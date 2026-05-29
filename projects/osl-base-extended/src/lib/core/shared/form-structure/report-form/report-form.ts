import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { elements } from '../dynamic-form/dynamic-form';
import { OslPdfConfig, OslReportColumn, OslReportGrid } from '../report-grid/report-grid';

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

  @ViewChild(OslReportGrid) private _grid?: OslReportGrid;

  get _mergedPdfConfig(): OslPdfConfig {
    return { ...this.pdfConfig, reportName: this.pdfConfig.reportName ?? this.title };
  }

  constructor(public cd: ChangeDetectorRef) {}

  selectedType: ReportGenerateType = 'grid';
  generating: boolean = false;
  resultDatasource: any[] = [];
  showResultView: boolean = false;

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

