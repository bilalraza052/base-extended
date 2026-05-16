import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { elements } from '../dynamic-form/dynamic-form';
import { OslReportColumn } from '../report-grid/report-grid';

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

  selectedType: ReportGenerateType = 'grid';
  generating: boolean = false;
  resultDatasource: any[] = [];
  showResultView: boolean = false;

  constructor(public cd:ChangeDetectorRef){
    
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
      if(result && result.length > 0){
        this.resultDatasource = result || [];
        if (this.selectedType === 'grid') {
          this.showResultView = true;
        } 

      }
    } finally {
      this.generating = false;
    }
    this.cd.markForCheck()
  }

  backToForm(): void {
    this.showResultView = false;
    this.resultDatasource = [];
  }

  reExportExcel(): void { this._exportCsv(this.resultDatasource); }
  reExportPdf(): void { this._exportPdf(this.resultDatasource); }

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

  private _exportCsv(data: any[]): void {
    if (!data.length || !this.reportColumns.length) return;
    const cols = this.reportColumns;
    const header = cols.map(c => `"${c.label}"`).join(',');
    const rows = data.map(row =>
      cols.map(col => `"${String(row[col.key] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `${this.title || 'report'}.csv`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  private _exportPdf(data: any[]): void {
    if (!data.length || !this.reportColumns.length) return;
    const cols = this.reportColumns;
    const headerRow = cols.map(c => `<th>${c.label}</th>`).join('');
    const bodyRows = data.map(row =>
      `<tr>${cols.map(col => `<td>${String(row[col.key] ?? '')}</td>`).join('')}</tr>`
    ).join('');

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>${this.title}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:24px;font-size:13px;color:#111827}
        h2{color:#1e3a8a;margin:0 0 4px;font-size:20px;font-weight:700}
        .subtitle{color:#6b7280;font-size:12px;margin-bottom:20px}
        table{border-collapse:collapse;width:100%}
        th{background:#1e3a8a;color:#fff;padding:9px 12px;text-align:left;font-weight:600;font-size:12px}
        td{padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px}
        tr:nth-child(even) td{background:#f8fafc}
        @media print{@page{margin:.8cm}}
      </style>
      </head><body>
      <h2>${this.title}</h2>
      <p class="subtitle">Generated on ${new Date().toLocaleString()}</p>
      <table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>
      <script>window.onload=function(){window.print();}<\/script>
      </body></html>`);
    w.document.close();
  }
}
