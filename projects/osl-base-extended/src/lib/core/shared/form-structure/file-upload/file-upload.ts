import { Component, EventEmitter, Input, Output } from '@angular/core';

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
  @Input('model') model: File | File[] | null = null;
  @Input('accept') accept: string = '';
  @Input('multiple') multiple: boolean = false;
  /** Max file size in bytes. 0 = no limit. */
  @Input('maxSize') maxSize: number = 0;
  @Input('skeletonLoading') skeletonLoading: boolean = false;
  @Input('skeletonTheme') skeletonTheme: 'light' | 'dark' = 'light';

  @Output() modelChange = new EventEmitter<File | File[] | null>();
  @Output() changeEv = new EventEmitter<File | File[] | null>();

  touched = false;
  isDragOver = false;
  sizeError = false;

  get fileNames(): string {
    if (!this.model) return '';
    if (Array.isArray(this.model)) return this.model.map(f => f.name).join(', ');
    return this.model.name;
  }

  get isInvalid(): boolean {
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

  get maxSizeLabel(): string {
    if (!this.maxSize) return '';
    if (this.maxSize >= 1024 * 1024) return `Max ${(this.maxSize / 1024 / 1024).toFixed(1)} MB`;
    if (this.maxSize >= 1024) return `Max ${(this.maxSize / 1024).toFixed(0)} KB`;
    return `Max ${this.maxSize} B`;
  }
}
