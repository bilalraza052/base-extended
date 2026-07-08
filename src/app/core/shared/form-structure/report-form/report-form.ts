import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { elements } from '../dynamic-form/dynamic-form';
import { OslPdfConfig, OslReportColumn, OslReportGrid } from '../report-grid/report-grid';
import { OslMenuAction } from '../grid/grid';

export type ReportGenerateType = 'pdf' | 'grid' | 'excel';

@Component({
  selector: 'osl-report-form',
  standalone: false,
  templateUrl: './report-form.html',
  styleUrl: './report-form.scss',
})
export class OslReportForm implements OnInit {
  @Input() title: string = 'Report';
  @Input() formElements: elements[] = [];

  private _model: any = {};
  @Input() set model(val: any) { this._model = val ?? {}; }
  get model(): any { return this._model; }
  @Output() modelChange = new EventEmitter<any>();

  @Input() generateOptions: ReportGenerateType[] = ['pdf', 'grid', 'excel'];
  @Input() reportColumns: OslReportColumn[] = [];
  @Input() onGenerate!: (model: any, type: ReportGenerateType) => Promise<any[]> | any[];
  @Input() skeletonLoading: boolean = false;
  @Input() skeletonTheme: 'light' | 'dark' = 'light';
  @Input() pageSize: number = 50;
  @Input() pdfConfig: OslPdfConfig = {};
  @Input('moreMenuActions') moreMenuActions: OslMenuAction[] = [];

  @ViewChild(OslReportGrid) private _grid?: OslReportGrid;

  get _mergedPdfConfig(): OslPdfConfig {
    return { ...this.pdfConfig, reportName: this.pdfConfig.reportName ?? this.title };
  }

  constructor(public cd: ChangeDetectorRef) {}

  selectedType: ReportGenerateType = 'grid';
  generating: boolean = false;
  resultDatasource: any[] = [];
  showResultView: boolean = false;

  // ── Footer more-actions menu state ─────────────────────────────
  moreMenuOpen: boolean = false;
  moreMenuPosition = { top: 0, left: 0 };

  @HostListener('document:click')
  onDocumentClick(): void {
    this.moreMenuOpen = false;
  }

  get hasVisibleMoreMenuActions(): boolean {
    return this.moreMenuActions.some(a => !a.hideIf || !a.hideIf(undefined));
  }

  toggleMoreMenu(event: Event): void {
    event.stopPropagation();
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

  ngOnInit(): void {
    if (this.generateOptions.length > 0 && !this.generateOptions.includes(this.selectedType)) {
      this.selectedType = this.generateOptions[0];
    }
  }

  selectType(type: ReportGenerateType): void {
    this.selectedType = type;
  }

  async generate(): Promise<void> {
    if (!this.onGenerate) return;
    this.generating = true;
    try {
      const result = await Promise.resolve(this.onGenerate({ ...this._model }, this.selectedType));
      if (result && result.length > 0) {
        this.resultDatasource = result || [];
        if (this.selectedType === 'grid') {
          this.showResultView = true;
          this.cd.markForCheck()
        }
      }
    } finally {
      this.generating = false;
      this.cd.markForCheck();
    }
  }

  backToForm(): void {
    this.showResultView = false;
    this.resultDatasource = [];
  }

  reExportExcel(): void { this._grid?.exportExcel(); }
  reExportPdf(): void { this._grid?.exportPdf(); }

  typeLabel(type: ReportGenerateType): string {
    return type === 'pdf' ? 'PDF' : type === 'excel' ? 'Excel' : 'Grid';
  }

  typeIcon(type: ReportGenerateType): string {
    return type === 'pdf' ? 'picture_as_pdf' : type === 'excel' ? 'table_chart' : 'grid_on';
  }

  onModelChange(val: any): void {
    this._model = val;
    this.modelChange.emit(val);
  }

}

