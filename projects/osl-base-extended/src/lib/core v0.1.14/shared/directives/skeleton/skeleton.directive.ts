import {
  Directive,
  ElementRef,
  Inject,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  Renderer2,
  SimpleChanges,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// ─── Public Types ────────────────────────────────────────────────────────────

/** How skeleton bones are laid out */
export type SkeletonType =
  | 'auto'        // reads host children and mirrors their bounding boxes
  | 'text'        // N horizontal bars (last one shorter)
  | 'rect'        // single full-size block
  | 'circle'      // single circle
  | 'card'        // image block + text lines below
  | 'list'        // N rows of avatar + two text lines
  | 'table'       // header row + data rows × columns
  | 'avatar-text' // circle on the left + N text lines on the right
  ;

/** CSS animation applied to bones */
export type SkeletonAnimation = 'shimmer' | 'pulse' | 'wave' | 'none';

/** Colour preset — overridden by oslSkeletonColor / oslSkeletonHighlight */
export type SkeletonTheme = 'light' | 'dark';

// ─── Internal ────────────────────────────────────────────────────────────────

interface Bone {
  top: number;
  left: number;
  width: number;
  height: number;
  radius: string;
  delay?: number; // wave animation stagger (seconds)
}

// Injected once per app lifetime — static flag avoids duplicate <style> tags.
let _osl_sk_injected = false;

// CSS is minified inline: zero runtime SCSS processing, one GPU-composited
// keyframe (translateX uses the compositor thread, no layout/paint on each frame).
const SKELETON_CSS = `
.osl-sk-host{position:relative!important}
.osl-sk-overlay{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.osl-sk-bone{position:absolute;background:var(--osl-sk-color,#e2e8f0);border-radius:var(--osl-sk-r,4px);overflow:hidden;will-change:transform,opacity}
.osl-sk-bone::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 0%,var(--osl-sk-hl,rgba(255,255,255,.6)) 50%,transparent 100%);transform:translateX(-100%);will-change:transform}
.osl-sk-shimmer .osl-sk-bone::after{animation:_osl-sk-shimmer var(--osl-sk-dur,1.5s) ease-in-out infinite}
.osl-sk-pulse .osl-sk-bone{animation:_osl-sk-pulse var(--osl-sk-dur,1.5s) ease-in-out infinite;animation-delay:var(--osl-sk-d,0s)}
.osl-sk-wave .osl-sk-bone{animation:_osl-sk-pulse var(--osl-sk-dur,1.5s) ease-in-out infinite;animation-delay:var(--osl-sk-d,0s)}
.osl-sk-none .osl-sk-bone::after{display:none}
.osl-sk-host.osl-sk-active>*:not(.osl-sk-overlay){visibility:hidden}
@keyframes _osl-sk-shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
@keyframes _osl-sk-pulse{0%,100%{opacity:1}50%{opacity:.4}}
`;

// Keys whose changes require bone recomputation
const LAYOUT_KEYS = new Set([
  'type', 'rows', 'rowGap', 'circleSize',
  'listItems', 'tableRows', 'tableCols', 'cardLines', 'minHeight',
]);

// ─── Directive ───────────────────────────────────────────────────────────────

@Directive({ selector: '[oslSkeleton]' })
export class OslSkeletonDirective implements OnChanges, OnDestroy {

  // ── Inputs ────────────────────────────────────────────────────────────────

  /** Primary toggle — set true while data is loading */
  @Input('oslSkeleton') loading = false;

  /** Layout strategy (default: auto — mirrors host children) */
  @Input('oslSkeletonType') type: SkeletonType = 'auto';

  /** Animation style (default: shimmer) */
  @Input('oslSkeletonAnimation') animation: SkeletonAnimation = 'shimmer';

  /** Colour preset — overridden by oslSkeletonColor & oslSkeletonHighlight */
  @Input('oslSkeletonTheme') theme: SkeletonTheme = 'light';

  /** Override bone background colour (e.g. '#cbd5e1') */
  @Input('oslSkeletonColor') color?: string;

  /** Override shimmer highlight colour (e.g. 'rgba(255,255,255,0.8)') */
  @Input('oslSkeletonHighlight') highlight?: string;

  /** Override bone border-radius (e.g. '8px' or '50%') */
  @Input('oslSkeletonRadius') radius?: string;

  /** Text rows — used by type=text and type=avatar-text */
  @Input('oslSkeletonRows') rows = 3;

  /** Gap between text rows (px) */
  @Input('oslSkeletonRowGap') rowGap = 10;

  /** Overlay z-index */
  @Input('oslSkeletonZIndex') zIndex = 10;

  /** Delay before skeleton appears (ms) — prevents flicker on fast responses */
  @Input('oslSkeletonDelay') delay = 0;

  /** Animation cycle duration (ms) */
  @Input('oslSkeletonDuration') duration = 1500;

  /** Minimum overlay height when host has no size yet (px) */
  @Input('oslSkeletonMinHeight') minHeight?: number;

  /** Re-read host DOM on every show() instead of using cached layout */
  @Input('oslSkeletonForceReread') forceReread = false;

  /** Circle diameter — used by type=circle and avatar in list/avatar-text (px) */
  @Input('oslSkeletonCircleSize') circleSize = 40;

  /** Item count for type=list */
  @Input('oslSkeletonListItems') listItems = 4;

  /** Row count for type=table (data rows, excluding header) */
  @Input('oslSkeletonTableRows') tableRows = 5;

  /** Column count for type=table */
  @Input('oslSkeletonTableCols') tableCols = 4;

  /** Body text lines for type=card */
  @Input('oslSkeletonCardLines') cardLines = 3;

  // ── State ─────────────────────────────────────────────────────────────────

  private overlay: HTMLElement | null = null;
  private cachedBones: Bone[] | null = null;
  private delayTimer: ReturnType<typeof setTimeout> | null = null;
  private rafId = 0;

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private zone: NgZone,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    if (isPlatformBrowser(this.platformId)) {
      OslSkeletonDirective.injectStyles();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Bust bone cache when any layout-affecting input changes
    for (const key of Object.keys(changes)) {
      if (LAYOUT_KEYS.has(key)) { this.cachedBones = null; break; }
    }

    if ('loading' in changes) {
      this.loading ? this.show() : this.hide();
    } else if (this.loading && this.overlay) {
      // Visual config changed while skeleton is visible — re-apply without toggling
      this.applyConfig();
      this.renderBones();
    }
  }

  ngOnDestroy(): void {
    this.cancelPending();
    if (this.overlay?.parentNode) this.overlay.parentNode.removeChild(this.overlay);
    this.overlay = null;
    this.cachedBones = null;
    this.renderer.removeClass(this.el.nativeElement, 'osl-sk-host');
    this.renderer.removeClass(this.el.nativeElement, 'osl-sk-active');
  }

  // ── Visibility control ────────────────────────────────────────────────────

  private show(): void {
    this.cancelPending();
    if (this.delay > 0) {
      this.delayTimer = setTimeout(() => this.doRender(), this.delay);
    } else {
      this.doRender();
    }
  }

  private hide(): void {
    this.cancelPending();
    if (this.overlay?.parentNode) this.overlay.parentNode.removeChild(this.overlay);
    this.renderer.removeClass(this.el.nativeElement, 'osl-sk-host');
    this.renderer.removeClass(this.el.nativeElement, 'osl-sk-active');
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  private doRender(): void {
    // Run outside Angular zone so RAF doesn't trigger change detection
    this.zone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame(() => {
        this.ensureOverlay();
        this.applyConfig();
        if (!this.cachedBones || this.forceReread) {
          this.cachedBones = this.computeBones();
        }
        this.renderBones();
        // Host classes go through Renderer2 so Angular's abstraction layer
        // remains consistent (server rendering, test harness, etc.)
        this.renderer.addClass(this.el.nativeElement, 'osl-sk-host');
        this.renderer.addClass(this.el.nativeElement, 'osl-sk-active');
        this.el.nativeElement.appendChild(this.overlay!);
      });
    });
  }

  private ensureOverlay(): void {
    if (!this.overlay) {
      this.overlay = document.createElement('div');
    }
  }

  private applyConfig(): void {
    const ov = this.overlay!;
    // Reset to known baseline before adding animation class
    ov.className = `osl-sk-overlay osl-sk-${this.animation}`;

    const dark = this.theme === 'dark';
    const parts = [
      `--osl-sk-dur:${this.duration}ms`,
      `--osl-sk-color:${this.color ?? (dark ? '#374151' : '#e2e8f0')}`,
      `--osl-sk-hl:${this.highlight ?? (dark ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.6)')}`,
      `z-index:${this.zIndex}`,
    ];
    if (this.radius) parts.push(`--osl-sk-r:${this.radius}`);
    // Single cssText assignment avoids repeated style flushes
    ov.style.cssText = parts.join(';');
  }

  private renderBones(): void {
    const ov = this.overlay!;
    // Clear previous bones without innerHTML (avoids serialisation overhead)
    while (ov.firstChild) ov.removeChild(ov.firstChild);
    if (!this.cachedBones?.length) return;

    const isWave = this.animation === 'wave';
    // DocumentFragment = single reflow when appended
    const frag = document.createDocumentFragment();

    this.cachedBones.forEach((b, i) => {
      const div = document.createElement('div');
      div.className = 'osl-sk-bone';
      let css = `top:${b.top}px;left:${b.left}px;width:${b.width}px;height:${b.height}px;border-radius:${b.radius}`;
      if (isWave) css += `;--osl-sk-d:${b.delay ?? i * 0.1}s`;
      div.style.cssText = css;
      frag.appendChild(div);
    });

    ov.appendChild(frag);
  }

  // ── Bone computation ──────────────────────────────────────────────────────

  private computeBones(): Bone[] {
    return this.type === 'auto' ? this.autoDetect() : this.predefined();
  }

  /**
   * Reads the host's direct children, computes their bounding boxes in a
   * single batched pass (all reads before writes), and creates matching bones.
   * Falls back to predefined() when host is empty.
   */
  private autoDetect(): Bone[] {
    const host = this.el.nativeElement;
    const kids = Array.from(host.children).filter(
      (c) => !(c as HTMLElement).classList.contains('osl-sk-overlay'),
    ) as HTMLElement[];

    if (!kids.length) return this.predefined();

    // ── Batch reads (no write between these) ──
    const hostRect = host.getBoundingClientRect();
    const rects = kids.map((k) => k.getBoundingClientRect());

    // ── Build bone descriptors ──
    const bones: Bone[] = [];
    rects.forEach((r, i) => {
      if (r.width === 0 && r.height === 0) return;
      bones.push({
        top:    r.top  - hostRect.top,
        left:   r.left - hostRect.left,
        width:  r.width,
        height: r.height,
        radius: this.inferRadius(kids[i]),
        delay:  i * 0.1,
      });
    });

    return bones.length ? bones : this.predefined();
  }

  /** Classifies an element's shape without triggering getComputedStyle */
  private inferRadius(el: HTMLElement): string {
    const cls = el.className ?? '';
    const tag = el.tagName.toLowerCase();
    if (tag === 'mat-icon' || /\bcircle\b|\bround\b|\bavatar\b/.test(cls)) return '50%';
    return '4px';
  }

  /** Generates a fully predefined bone layout for the current type */
  private predefined(): Bone[] {
    const host = this.el.nativeElement;
    const w  = host.offsetWidth  || 300;
    const rh = host.offsetHeight;
    const h  = rh > 20 ? rh : (this.minHeight ?? 200);

    const { rows, rowGap, circleSize, listItems, tableRows, tableCols, cardLines } = this;

    switch (this.type) {

      // ── Circle ────────────────────────────────────────────────────────────
      case 'circle':
        return [{ top: 0, left: 0, width: circleSize, height: circleSize, radius: '50%' }];

      // ── Rect ──────────────────────────────────────────────────────────────
      case 'rect':
        return [{ top: 0, left: 0, width: w, height: h, radius: '4px' }];

      // ── Text ──────────────────────────────────────────────────────────────
      case 'text': {
        const lh = 14;
        return Array.from({ length: rows }, (_, i) => ({
          top:    i * (lh + rowGap),
          left:   0,
          width:  i === rows - 1 ? Math.round(w * 0.6) : w,
          height: lh,
          radius: '4px',
          delay:  i * 0.1,
        }));
      }

      // ── Card ──────────────────────────────────────────────────────────────
      case 'card': {
        const imgH = Math.round(h * 0.45);
        const lh   = 14;
        const bones: Bone[] = [
          { top: 0, left: 0, width: w, height: imgH, radius: '4px', delay: 0 },
        ];
        for (let i = 0; i < cardLines; i++) {
          bones.push({
            top:    imgH + 16 + i * (lh + rowGap),
            left:   0,
            width:  i === cardLines - 1 ? Math.round(w * 0.5) : Math.round(w * 0.9),
            height: lh,
            radius: '4px',
            delay:  (i + 1) * 0.1,
          });
        }
        return bones;
      }

      // ── List ──────────────────────────────────────────────────────────────
      case 'list': {
        const itemH = Math.max(circleSize + 12, 52);
        const gap   = 12;
        const bones: Bone[] = [];
        for (let i = 0; i < listItems; i++) {
          const t = i * (itemH + gap);
          // Avatar
          bones.push({ top: t, left: 0, width: circleSize, height: circleSize, radius: '50%', delay: i * 0.06 });
          // Title
          bones.push({ top: t,      left: circleSize + 12, width: Math.round(w * 0.5),  height: 14, radius: '4px', delay: i * 0.06 });
          // Subtitle
          bones.push({ top: t + 22, left: circleSize + 12, width: Math.round(w * 0.35), height: 12, radius: '4px', delay: i * 0.06 + 0.05 });
        }
        return bones;
      }

      // ── Table ─────────────────────────────────────────────────────────────
      case 'table': {
        const rh2 = 36;
        const cw  = Math.floor(w / tableCols);
        const bones: Bone[] = [];
        // Header
        for (let c = 0; c < tableCols; c++) {
          bones.push({ top: 0, left: c * cw + 4, width: cw - 8, height: rh2,     radius: '4px', delay: c * 0.05 });
        }
        // Data rows
        for (let r = 0; r < tableRows; r++) {
          for (let c = 0; c < tableCols; c++) {
            bones.push({
              top:    (r + 1) * (rh2 + 4) + 4,
              left:   c * cw + 4,
              width:  cw - 8,
              height: rh2 - 8,
              radius: '4px',
              delay:  (c + r * tableCols) * 0.03,
            });
          }
        }
        return bones;
      }

      // ── Avatar + text ─────────────────────────────────────────────────────
      case 'avatar-text': {
        const bones: Bone[] = [
          { top: 0, left: 0, width: circleSize, height: circleSize, radius: '50%', delay: 0 },
        ];
        const tLeft  = circleSize + 12;
        const tWidth = w - tLeft;
        const lh     = 14;
        for (let i = 0; i < rows; i++) {
          bones.push({
            top:    i * (lh + rowGap),
            left:   tLeft,
            width:  i === rows - 1 ? Math.round(tWidth * 0.6) : tWidth,
            height: lh,
            radius: '4px',
            delay:  (i + 1) * 0.1,
          });
        }
        return bones;
      }

      // ── Fallback ──────────────────────────────────────────────────────────
      default:
        return [{ top: 0, left: 0, width: w, height: h, radius: '4px' }];
    }
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  private cancelPending(): void {
    if (this.delayTimer) { clearTimeout(this.delayTimer); this.delayTimer = null; }
    if (this.rafId)       { cancelAnimationFrame(this.rafId); this.rafId = 0; }
  }

  private static injectStyles(): void {
    if (_osl_sk_injected) return;
    _osl_sk_injected = true;
    const style = document.createElement('style');
    style.id = 'osl-sk-styles';
    style.textContent = SKELETON_CSS;
    document.head.appendChild(style);
  }
}
