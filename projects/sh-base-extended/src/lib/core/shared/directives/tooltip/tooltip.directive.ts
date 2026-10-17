import {
  Directive,
  ElementRef,
  HostListener,
  Inject,
  Input,
  OnDestroy,
  Renderer2,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

const TOOLTIP_CSS = `
.sh-tooltip {
  position: fixed;
  top: -9999px;
  left: -9999px;
  z-index: 10000;
  background: var(--sh-tooltip-bg, #141414);
  color: var(--sh-tooltip-text, #ffffff);
  font-size: 12px;
  font-weight: 300;
  line-height: 18px;
  font-family: var(--sh-font-family, "Lexend Deca", Helvetica, Arial, sans-serif);
  padding: 10px 16px;
  border-radius: 6px;
  max-width: 280px;
  word-break: break-word;
  white-space: pre-wrap;
  box-shadow: 0 24px 48px 0 rgba(20,20,20,0.08);
  pointer-events: none;
}
.sh-tooltip::after {
  content: '';
  position: absolute;
  border: 5px solid transparent;
}
.sh-tooltip--top::after {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-top-color: var(--sh-tooltip-bg, #141414);
}
.sh-tooltip--bottom::after {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-bottom-color: var(--sh-tooltip-bg, #141414);
}
.sh-tooltip--left::after {
  top: 50%;
  left: 100%;
  transform: translateY(-50%);
  border-left-color: var(--sh-tooltip-bg, #141414);
}
.sh-tooltip--right::after {
  top: 50%;
  right: 100%;
  transform: translateY(-50%);
  border-right-color: var(--sh-tooltip-bg, #141414);
}

/* Default: position-aware slide animations */
.sh-tooltip--top    { animation: _sh_tip_up    0.18s cubic-bezier(0.16,1,0.3,1) forwards; }
.sh-tooltip--bottom { animation: _sh_tip_down  0.18s cubic-bezier(0.16,1,0.3,1) forwards; }
.sh-tooltip--left   { animation: _sh_tip_left  0.18s cubic-bezier(0.16,1,0.3,1) forwards; }
.sh-tooltip--right  { animation: _sh_tip_right 0.18s cubic-bezier(0.16,1,0.3,1) forwards; }

/* Animation override variants */
.sh-tooltip--anim-scale  { animation: _sh_tip_scale  0.20s cubic-bezier(0.34,1.56,0.64,1) forwards !important; }
.sh-tooltip--anim-bounce { animation: _sh_tip_bounce 0.40s cubic-bezier(0.34,1.56,0.64,1) forwards !important; }
.sh-tooltip--anim-fade   { animation: _sh_tip_fade   0.22s ease-out forwards !important; }

@keyframes _sh_tip_up    { from { opacity:0; transform:translateY(8px);  } to { opacity:1; transform:translateY(0); } }
@keyframes _sh_tip_down  { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
@keyframes _sh_tip_left  { from { opacity:0; transform:translateX(8px);  } to { opacity:1; transform:translateX(0); } }
@keyframes _sh_tip_right { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }
@keyframes _sh_tip_scale {
  from { opacity:0; transform:scale(0.72); }
  to   { opacity:1; transform:scale(1); }
}
@keyframes _sh_tip_bounce {
  0%   { opacity:0; transform:scale(0.55); }
  55%  { opacity:1; transform:scale(1.12); }
  75%  { transform:scale(0.95); }
  90%  { transform:scale(1.03); }
  100% { transform:scale(1); }
}
@keyframes _sh_tip_fade  { from { opacity:0; } to { opacity:1; } }
`;

@Directive({ selector: '[shTooltip]', standalone: true })
export class ShTooltipDirective implements OnDestroy {
  @Input('shTooltip') text = '';
  @Input() shTooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input() shTooltipAnimation: 'slide' | 'scale' | 'bounce' | 'fade' = 'slide';
  @Input() shTooltipDisabled = false;
  @Input() shTooltipMaxWidth = '280px';

  private tooltipEl: HTMLElement | null = null;
  private static cssInjected = false;

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
  ) {
    this.injectCss();
  }

  @HostListener('mouseenter')
  show(): void {
    if (this.shTooltipDisabled || !this.text?.trim()) return;
    this.create();
    this.position();
  }

  @HostListener('mouseleave')
  hide(): void {
    this.destroy();
  }

  private create(): void {
    this.destroy();
    const tip: HTMLElement = this.renderer.createElement('div');
    this.renderer.addClass(tip, 'sh-tooltip');
    this.renderer.addClass(tip, `sh-tooltip--${this.shTooltipPosition}`);
    if (this.shTooltipAnimation !== 'slide') {
      this.renderer.addClass(tip, `sh-tooltip--anim-${this.shTooltipAnimation}`);
    }
    this.renderer.setStyle(tip, 'max-width', this.shTooltipMaxWidth);
    this.renderer.appendChild(tip, this.renderer.createText(this.text));
    this.renderer.appendChild(this.document.body, tip);
    this.tooltipEl = tip;
  }

  private position(): void {
    if (!this.tooltipEl) return;
    const host = this.el.nativeElement.getBoundingClientRect();
    const tip = this.tooltipEl.getBoundingClientRect();
    const gap = 8;
    let top: number;
    let left: number;

    switch (this.shTooltipPosition) {
      case 'bottom':
        top = host.bottom + gap;
        left = host.left + host.width / 2 - tip.width / 2;
        break;
      case 'left':
        top = host.top + host.height / 2 - tip.height / 2;
        left = host.left - tip.width - gap;
        break;
      case 'right':
        top = host.top + host.height / 2 - tip.height / 2;
        left = host.right + gap;
        break;
      default: // top
        top = host.top - tip.height - gap;
        left = host.left + host.width / 2 - tip.width / 2;
    }

    left = Math.max(8, Math.min(left, this.document.defaultView!.innerWidth - tip.width - 8));
    top = Math.max(8, top);

    this.renderer.setStyle(this.tooltipEl, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltipEl, 'left', `${left}px`);
  }

  private destroy(): void {
    if (this.tooltipEl) {
      if (this.document.body.contains(this.tooltipEl)) {
        this.renderer.removeChild(this.document.body, this.tooltipEl);
      }
      this.tooltipEl = null;
    }
  }

  private injectCss(): void {
    if (ShTooltipDirective.cssInjected || this.document.getElementById('_sh_tooltip_css')) {
      ShTooltipDirective.cssInjected = true;
      return;
    }
    const style = this.document.createElement('style');
    style.id = '_sh_tooltip_css';
    style.textContent = TOOLTIP_CSS;
    this.document.head.appendChild(style);
    ShTooltipDirective.cssInjected = true;
  }

  ngOnDestroy(): void {
    this.destroy();
  }
}
