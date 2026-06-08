import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface OslSavedDocument {
  id: any;
  name: string;
  file?: string;
  addBy?: string;
  addOn?: string | Date;
}

@Component({
  selector: 'osl-document-uploader',
  standalone: false,
  templateUrl: './document-uploader.html',
  styleUrl: './document-uploader.scss',
})
export class OslDocumentUploader {
  @Input('label') label: string = '';
  @Input('required') required: boolean = false;
  @Input('disabled') disabled: boolean = false;
  @Input('multiple') multiple: boolean = false;
  @Input('accept') accept: string = '';
  @Input('maxSize') maxSize: number = 0;
  @Input('minFiles') minFiles: number = 0;
  @Input('maxFiles') maxFiles: number = 0;
  @Input('showUploadButton') showUploadButton: boolean = false;
  @Input('uploadButtonLabel') uploadButtonLabel: string = 'Upload Files';
  @Input('savedDocuments') savedDocuments: OslSavedDocument[] = [];
  @Input('savedDocsMaxHeight') savedDocsMaxHeight: string = '260px';
  @Input('skeletonLoading') skeletonLoading: boolean = false;
  @Input('skeletonTheme') skeletonTheme: 'light' | 'dark' = 'light';

  @Output() uploadCallback = new EventEmitter<FormData>();
  @Output() viewCallback = new EventEmitter<OslSavedDocument>();
  @Output() deleteCallback = new EventEmitter<OslSavedDocument>();
  @Output() downloadCallback = new EventEmitter<OslSavedDocument>();
  @Output() filesChanged = new EventEmitter<File[]>();

  pendingFiles: File[] = [];
  isDragOver = false;
  sizeErrors: string[] = [];
  touched = false;

  get maxFilesReached(): boolean {
    return this.multiple && this.maxFiles > 0 && this.pendingFiles.length >= this.maxFiles;
  }

  get isBelowMin(): boolean {
    return this.minFiles > 0 && this.pendingFiles.length > 0 && this.pendingFiles.length < this.minFiles;
  }

  get isInvalid(): boolean {
    if (!this.touched) return false;
    if (this.required && this.pendingFiles.length === 0) return true;
    return this.isBelowMin;
  }

  get requiredError(): boolean {
    return this.touched && this.required && this.pendingFiles.length === 0;
  }

  get minFilesError(): boolean {
    return this.touched && this.isBelowMin;
  }

  get maxSizeLabel(): string {
    if (!this.maxSize) return '';
    if (this.maxSize >= 1024 * 1024) return `Max ${(this.maxSize / 1024 / 1024).toFixed(1)} MB`;
    if (this.maxSize >= 1024) return `Max ${(this.maxSize / 1024).toFixed(0)} KB`;
    return `Max ${this.maxSize} B`;
  }

  getFileSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
  }

  getFileType(name: string): 'pdf' | 'word' | 'excel' | 'image' | 'archive' | 'generic' {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'word';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
    return 'generic';
  }

  formatDate(value: string | Date | undefined): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  onFileChange(event: Event) {
    this.touched = true;
    const input = event.target as HTMLInputElement;
    this.processFiles(input.files);
    input.value = '';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (!this.disabled && !this.maxFilesReached) this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    const target = event.currentTarget as HTMLElement;
    const related = event.relatedTarget as Node | null;
    if (!related || !target.contains(related)) this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    if (this.disabled || this.maxFilesReached) return;
    this.touched = true;
    this.processFiles(event.dataTransfer?.files ?? null);
  }

  private processFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    this.sizeErrors = [];
    const newFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (this.maxSize > 0 && file.size > this.maxSize) {
        this.sizeErrors.push(`"${file.name}" exceeds the ${this.maxSizeLabel} limit.`);
        continue;
      }
      newFiles.push(file);
    }

    if (this.multiple) {
      const remaining = this.maxFiles > 0 ? this.maxFiles - this.pendingFiles.length : newFiles.length;
      const toAdd = newFiles.slice(0, remaining);
      if (newFiles.length > remaining) {
        this.sizeErrors.push(`Only ${remaining} more file(s) can be added. ${newFiles.length - remaining} skipped.`);
      }
      this.pendingFiles = [...this.pendingFiles, ...toAdd];
    } else {
      this.pendingFiles = newFiles.slice(0, 1);
    }

    this.filesChanged.emit(this.pendingFiles);
  }

  removeFile(index: number) {
    this.pendingFiles = this.pendingFiles.filter((_, i) => i !== index);
    this.filesChanged.emit(this.pendingFiles);
  }

  triggerInput(fileInput: HTMLInputElement) {
    if (!this.disabled && !this.maxFilesReached) fileInput.click();
  }

  upload() {
    if (this.pendingFiles.length === 0) return;
    const formData = new FormData();
    if (this.multiple) {
      this.pendingFiles.forEach(file => formData.append('files', file, file.name));
    } else {
      formData.append('file', this.pendingFiles[0], this.pendingFiles[0].name);
    }
    this.uploadCallback.emit(formData);
  }

  onView(doc: OslSavedDocument) { this.viewCallback.emit(doc); }
  onDelete(doc: OslSavedDocument) { this.deleteCallback.emit(doc); }
  onDownload(doc: OslSavedDocument) { this.downloadCallback.emit(doc); }
}
