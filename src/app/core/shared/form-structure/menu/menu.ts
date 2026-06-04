import {
  Component, Directive, ElementRef, HostListener, Input,
  OnDestroy, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation,
} from '@angular/core';
import { Overlay, OverlayRef, ConnectedPosition } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Subscription } from 'rxjs';

export type OslMenuPosition = 'auto' | 'above' | 'below' | 'before' | 'after';

@Component({
  selector: 'osl-menu',
  standalone: false,
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: none' },
})
export class OslMenu {
  @Input() position: OslMenuPosition = 'auto';
  @ViewChild('panel', { static: true }) templateRef!: TemplateRef<any>;
}

@Directive({
  selector: '[oslMenuTriggerFor]',
  standalone: false,
})
export class OslMenuTriggerFor implements OnDestroy {
  @Input('oslMenuTriggerFor') menu!: OslMenu;

  private _ref: OverlayRef | null = null;
  private _subs: Subscription[] = [];

  constructor(
    private _el: ElementRef<HTMLElement>,
    private _overlay: Overlay,
    private _vcr: ViewContainerRef,
  ) {}

  @HostListener('click', ['$event'])
  _onClick(event: MouseEvent): void {
    event.stopPropagation();
    this._ref ? this._close() : this._open();
  }

  private _open(): void {
    if (!this.menu) return;

    this._ref = this._overlay.create({
      positionStrategy: this._overlay
        .position()
        .flexibleConnectedTo(this._el)
        .withPositions(this._positions())
        .withFlexibleDimensions(false)
        .withPush(true),
      scrollStrategy: this._overlay.scrollStrategies.close(),
      hasBackdrop: true,
      backdropClass: 'osl-menu-backdrop',
    });

    this._ref.attach(new TemplatePortal(this.menu.templateRef, this._vcr));

    this._subs = [
      this._ref.backdropClick().subscribe(() => this._close()),
      this._ref.keydownEvents().subscribe(e => { if (e.key === 'Escape') this._close(); }),
    ];

    this._ref.overlayElement.addEventListener('click', () => this._close());
  }

  private _close(): void {
    this._subs.forEach(s => s.unsubscribe());
    this._subs = [];
    const ref = this._ref;
    this._ref = null;
    ref?.dispose();
  }

  ngOnDestroy(): void {
    this._close();
  }

  private _positions(): ConnectedPosition[] {
    const pos = this.menu?.position ?? 'auto';

    const below:  ConnectedPosition = { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top',    offsetY: 4  };
    const above:  ConnectedPosition = { originX: 'start', originY: 'top',    overlayX: 'start', overlayY: 'bottom', offsetY: -4 };
    const belowE: ConnectedPosition = { originX: 'end',   originY: 'bottom', overlayX: 'end',   overlayY: 'top',    offsetY: 4  };
    const aboveE: ConnectedPosition = { originX: 'end',   originY: 'top',    overlayX: 'end',   overlayY: 'bottom', offsetY: -4 };
    const after:  ConnectedPosition = { originX: 'end',   originY: 'top',    overlayX: 'start', overlayY: 'top',    offsetX: 4  };
    const before: ConnectedPosition = { originX: 'start', originY: 'top',    overlayX: 'end',   overlayY: 'top',    offsetX: -4 };

    switch (pos) {
      case 'below':  return [below,  above];
      case 'above':  return [above,  below];
      case 'after':  return [after,  before];
      case 'before': return [before, after];
      default:       return [below,  belowE, above, aboveE];
    }
  }
}
