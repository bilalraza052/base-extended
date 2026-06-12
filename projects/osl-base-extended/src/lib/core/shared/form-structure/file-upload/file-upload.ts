import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface OslFileValue {
  fileName: string;
  /** Base64 data-URL. Present only when the user just selected a file (before save). */
  fileContent?: string;
}

@Component({
  selector: 'osl-file-upload',
  standalone: false,
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.scss',
})
export class OslFileUpload {
  @Input('label') label: string = '';
  @Input('required') required: boolean = false;
  @Input('disabled') disabled: boolean = false;
  @Input('model') model: OslFileValue | File | File[] | null = null;
  @Input('accept') accept: string = '';
  @Input('multiple') multiple: boolean = false;
  /** Max file size in bytes. 0 = no limit. */
  @Input('maxSize') maxSize: number = 0;
  @Input('skeletonLoading') skeletonLoading: boolean = false;
  @Input('skeletonTheme') skeletonTheme: 'light' | 'dark' = 'light';
  /** When 'base64', emits OslFileValue instead of File objects. */
  @Input('fileMode') fileMode: 'raw' | 'base64' = 'raw';
  /** Called when user clicks download on a saved file that has no base64 content. */
  @Input('downloadFn') downloadFn: (() => void) | null = null;

  @Output() modelChange = new EventEmitter<OslFileValue | File | File[] | null>();
  @Output() changeEv = new EventEmitter<OslFileValue | File | File[] | null>();

  touched = false;
  isDragOver = false;
  sizeError = false;

  get isBase64Mode(): boolean {
    return this.fileMode === 'base64';
  }

  get savedFileName(): string | null {
    if (!this.isBase64Mode) return null;
    return (this.model as OslFileValue)?.fileName ?? null;
  }

  get hasSavedContent(): boolean {
    return !!(this.model as OslFileValue)?.fileContent;
  }

  get fileNames(): string {
    if (!this.model) return '';
    if (Array.isArray(this.model)) return (this.model as File[]).map(f => f.name).join(', ');
    return (this.model as File).name;
  }

  get isInvalid(): boolean {
    if (this.isBase64Mode) return this.touched && this.required && !this.savedFileName;
    return this.touched && this.required && !this.model;
  }

  onFileChange(event: Event) {
    this.touched = true;
    const input = event.target as HTMLInputElement;
    this.processFiles(input.files);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (!this.disabled) this.isDragOver = true;
  }

  onDragLeave() {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    if (this.disabled) return;
    this.touched = true;
    this.processFiles(event.dataTransfer?.files ?? null);
  }

  private processFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    this.sizeError = false;

    if (this.maxSize > 0) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].size > this.maxSize) {
          this.sizeError = true;
          this.model = null;
          this.modelChange.emit(null);
          this.changeEv.emit(null);
          return;
        }
      }
    }

    if (this.isBase64Mode) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const value: OslFileValue = { fileName: file.name, fileContent: reader.result as string };
        this.model = value;
        this.modelChange.emit(value);
        this.changeEv.emit(value);
      };
      reader.readAsDataURL(file);
      return;
    }

    if (this.multiple) {
      this.model = Array.from(files);
    } else {
      this.model = files[0];
    }
    this.modelChange.emit(this.model);
    this.changeEv.emit(this.model);
  }

  triggerInput(fileInput: HTMLInputElement) {
    if (!this.disabled) fileInput.click();
  }

  clearFiles(event: Event) {
    event.stopPropagation();
    this.model = null;
    this.sizeError = false;
    this.modelChange.emit(null);
    this.changeEv.emit(null);
  }

  onDownload() {
    const val = this.model as OslFileValue;
    if (val?.fileContent) {
      const a = document.createElement('a');
      a.href = val.fileContent;
      a.download = val.fileName;
      a.click();
    } else if (this.downloadFn) {
      this.downloadFn();
    }
  }

  get maxSizeLabel(): string {
    if (!this.maxSize) return '';
    if (this.maxSize >= 1024 * 1024) return `Max ${(this.maxSize / 1024 / 1024).toFixed(1)} MB`;
    if (this.maxSize >= 1024) return `Max ${(this.maxSize / 1024).toFixed(0)} KB`;
    return `Max ${this.maxSize} B`;
  }
}
