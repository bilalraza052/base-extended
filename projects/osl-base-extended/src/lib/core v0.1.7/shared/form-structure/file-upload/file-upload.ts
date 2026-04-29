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
  @Input('model') model: File | null = null;
  @Input('accept') accept: string = '';
  @Output() modelChange = new EventEmitter<File | null>();
  @Output() changeEv = new EventEmitter<File | null>();

  touched: boolean = false;

  get fileName(): string {
    return this.model ? this.model.name : '';
  }

  get isInvalid(): boolean {
    return this.touched && this.required && !this.model;
  }

  onFileChange(event: Event) {
    this.touched = true;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.model = file;
    this.modelChange.emit(this.model);
    this.changeEv.emit(this.model);
  }

  triggerInput(fileInput: HTMLInputElement) {
    if (!this.disabled) {
      fileInput.click();
    }
  }
}
