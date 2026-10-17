import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { elements } from '../dynamic-form/dynamic-form';
import { ShPdfConfig, ShReportColumn, ShReportGrid } from '../report-grid/report-grid';
import { ShMenuAction } from '../grid/grid';
import { ShEmailAttachment, ShEmailDialog, ShEmailDialogData, ShEmailSendResult } from '../../components/email-dialog/email-dialog';

export type ReportGenerateType = 'pdf' | 'grid' | 'excel' | 'email';

export interface ShReportEmailConfig {
  to?: string[];
  cc?: string[];
  subject?: string;
  body?: string;
  attachments?: ShEmailAttachment[];
}

@Component({
  selector: 'sh-report-form',
  standalone: false,
  templateUrl: './report-form.html',
  styleUrl: './report-form.scss',
})
export class ShReportForm implements OnInit {
  @Input() title: string = 'Report';
  @Input() formElements: elements[] = [];

  private _model: any = {};
  @Input() set model(val: any) { this._model = val ?? {}; }
  get model(): any { return this._model; }
  @Output() modelChange = new EventEmitter<any>();

  @Input() generateOptions: ReportGenerateType[] = ['pdf', 'grid', 'excel'];
  @Input() reportColumns: ShReportColumn[] = [];
  @Input() onGenerate!: (model: any, type: ReportGenerateType) => Promise<any[]> | any[];
  @Input() skeletonLoading: boolean = false;
  @Input() skeletonTheme: 'light' | 'dark' = 'light';
  @Input() pageSize: number = 50;
  @Input() pdfConfig: ShPdfConfig = {};
  @Input('moreMenuActions') moreMenuActions: ShMenuAction[] = [];

  /** Default To / Cc / subject / body / attachments used to pre-fill the "Email" compose dialog. */
  @Input() emailConfig: ShReportEmailConfig = {};
  /** Called with the composed email when the user clicks Send in the email dialog. */
  @Input() onEmailSend?: (result: ShEmailSendResult, model: any) => Promise<any> | any;

  @ViewChild(ShReportGrid) private _grid?: ShReportGrid;

  get _mergedPdfConfig(): ShPdfConfig {
    return { ...this.pdfConfig, reportName: this.pdfConfig.reportName ?? this.title };
  }

  constructor(public cd: ChangeDetectorRef, private _dialog: MatDialog) {}

  selectedType: ReportGenerateType = 'grid';
  generating: boolean = false;
  resultDatasource: any[] = [];
  showResultView: boolean = false;

  // ── Footer more-actions menu state ─────────────────────────────
  moreMenuOpen: boolean = false;
  moreMenuPosition = { top: 0, left: 0 };
  moreMenuLoadingActionIndex: number | null = null;

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.moreMenuLoadingActionIndex === null) this.moreMenuOpen = false;
  }

  get hasVisibleMoreMenuActions(): boolean {
    return this.moreMenuActions.some(a => !a.hideIf || !a.hideIf(undefined));
  }

  toggleMoreMenu(event: Event): void {
    event.stopPropagation();
    if (this.moreMenuLoadingActionIndex !== null) return;
    if (this.moreMenuOpen) {
      this.moreMenuOpen = false;
      return;
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const menuWidth = 196;
    const left = Math.min(Math.max(rect.right - menuWidth, 8), window.innerWidth - menuWidth - 8);
    this.moreMenuPosition = { top: rect.bottom + 6, left };
    this.moreMenuOpen = true;
  }

  async onMoreMenuActionClick(action: ShMenuAction, index: number): Promise<void> {
    if (this.moreMenuLoadingActionIndex !== null) return;
    this.moreMenuLoadingActionIndex = index;
    try {
      await Promise.resolve(action.click(undefined));
    } finally {
      this.moreMenuLoadingActionIndex = null;
      this.moreMenuOpen = false;
      this.cd.markForCheck();
    }
  }

  ngOnInit(): void {
    if (this.generateOptions.length > 0 && !this.generateOptions.includes(this.selectedType)) {
      this.selectedType = this.generateOptions[0];
    }
  }

  selectType(type: ReportGenerateType): void {
    this.selectedType = type;
  }

  async generate(): Promise<void> {
    if (this.selectedType === 'email') {
      await this.composeEmail();
      return;
    }
    if (!this.onGenerate) return;
    this.generating = true;
    try {
      const result = await Promise.resolve(this.onGenerate({ ...this._model }, this.selectedType));
      if (result && result.length > 0) {
        this.resultDatasource = result || [];
        if (this.selectedType === 'grid') {
          this.showResultView = true;
          this.cd.markForCheck();
          // Let the view render the grid before triggering export
          // await new Promise(r => setTimeout(r, 50));
          // if (this.selectedType === 'pdf') {
          //   await this._grid?.exportPdf();
          // } else if (this.selectedType === 'excel') {
          //   this._grid?.exportCsv();
          // }
        }
      }
    } finally {
      this.generating = false;
      this.cd.markForCheck();
    }
  }

  /**
   * Optionally asks the consumer (via onGenerate) to build the attachment(s) for this
   * report, then opens the email compose dialog pre-filled from emailConfig.
   */
  private async composeEmail(): Promise<void> {
    this.generating = true;
    let generatedAttachments: ShEmailAttachment[] = [];
    try {
      if (this.onGenerate) {
        const result = await Promise.resolve(this.onGenerate({ ...this._model }, 'email'));
        if(!result) return
        if (Array.isArray(result)) generatedAttachments = result as unknown as ShEmailAttachment[];
      }
    } finally {
      this.generating = false;
      this.cd.markForCheck();
    }

  

    const dialogData: ShEmailDialogData = {
      title: `Email ${this.title}`,
      to: this.emailConfig.to ?? [],
      cc: this.emailConfig.cc ?? [],
      subject: this.emailConfig.subject ?? this.title,
      body: this.emailConfig.body ?? '',
      attachments: [...(this.emailConfig.attachments ?? []), ...generatedAttachments],
      onSendClick: this.onEmailSend
        ? (result) => this.onEmailSend!(result, { ...this._model })
        : undefined,
    };

    this._dialog.open(ShEmailDialog, {
      width: '640px',
      maxWidth: '92vw',
      data: dialogData,
      disableClose: true,
      autoFocus: false,
    });
  }

  backToForm(): void {
    this.showResultView = false;
    this.resultDatasource = [];
  }

  reExportExcel(): void { this._grid?.exportExcel(); }
  reExportPdf(): void { this._grid?.exportPdf(); }

  typeLabel(type: ReportGenerateType): string {
    return type === 'pdf' ? 'PDF' : type === 'excel' ? 'Excel' : type === 'email' ? 'Email' : 'Grid';
  }

  typeIcon(type: ReportGenerateType): string {
    return type === 'pdf' ? 'picture_as_pdf' : type === 'excel' ? 'table_chart' : type === 'email' ? 'mail' : 'grid_on';
  }

  onModelChange(val: any): void {
    this._model = val;
    this.modelChange.emit(val);
  }

}

