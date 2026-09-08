import { CommonModule } from '@angular/common';
import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface OslEmailAttachment {
  name: string;
  size?: number;
  type?: string;
  /** Newly attached browser file (added by the user via the dialog). */
  file?: File;
  /** Pre-existing attachment reference, e.g. a download URL. */
  url?: string;
  /** Pre-existing attachment content, e.g. a base64 payload. */
  data?: string;
  /** Set false to lock an attachment (e.g. a required generated report) so it can't be removed. */
  removable?: boolean;
}

export interface OslEmailSendResult {
  to: string[];
  cc: string[];
  subject: string;
  body: string;
  attachments: OslEmailAttachment[];
}

export class OslEmailDialogData {
  title: string = 'Compose Email';
  to: string[] = [];
  cc: string[] = [];
  subject: string = '';
  body: string = '';
  attachments: OslEmailAttachment[] = [];
  maxAttachmentSizeMB?: number = 15;
  acceptedFileTypes?: string = '*';
  sendButtonText?: string = 'Send Email';
  onSendClick?: (result: OslEmailSendResult) => Promise<any> | any;
}

type OslEmailFileKind = 'pdf' | 'doc' | 'sheet' | 'image' | 'archive' | 'file';

const EMAIL_REGEX = /^(?!.*\.\.)(?!.*\.$)[A-Za-z0-9][A-Za-z0-9._%+-]{0,63}@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

@Component({
  selector: 'osl-email-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule],
  templateUrl: './email-dialog.html',
  styleUrl: './email-dialog.scss',
})
export class OslEmailDialog {
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  to: string[] = [];
  cc: string[] = [];
  subject: string = '';
  body: string = '';
  attachments: OslEmailAttachment[] = [];

  toDraft: string = '';
  ccDraft: string = '';
  toError: string | null = null;
  ccError: string | null = null;
  showCc: boolean = false;

  dragOver: boolean = false;
  sending: boolean = false;
  sendError: string | null = null;
  attachError: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<OslEmailDialog>,
    @Inject(MAT_DIALOG_DATA) public data: OslEmailDialogData,
  ) {
    this.to = [...(data.to ?? [])];
    this.cc = [...(data.cc ?? [])];
    this.subject = data.subject ?? '';
    this.body = data.body ?? '';
    this.attachments = [...(data.attachments ?? [])];
    this.showCc = this.cc.length > 0;
  }

  get isValid(): boolean {
    return this.to.length > 0 && this.subject.trim().length > 0 && !this.sending;
  }

  get totalAttachmentSize(): number {
    return this.attachments.reduce((sum, a) => sum + (a.size ?? 0), 0);
  }

  formatSize(bytes: number = 0): string {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  fileKind(name: string): OslEmailFileKind {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'doc';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'sheet';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['zip', 'rar', '7z'].includes(ext)) return 'archive';
    return 'file';
  }

  toggleCc(): void {
    this.showCc = !this.showCc;
  }

  private _commitChip(field: 'to' | 'cc', raw: string): void {
    const target = field === 'to' ? this.to : this.cc;
    const parts = raw.split(/[,;\s]+/).map(p => p.trim()).filter(Boolean);
    let error: string | null = null;
    for (const part of parts) {
      if (!EMAIL_REGEX.test(part)) {
        error = `"${part}" is not a valid email address`;
        continue;
      }
      if (!target.includes(part)) target.push(part);
    }
    if (field === 'to') {
      this.toError = error;
      this.toDraft = error ? raw : '';
    } else {
      this.ccError = error;
      this.ccDraft = error ? raw : '';
    }
  }

  onRecipientKeydown(field: 'to' | 'cc', event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',' || event.key === ' ') {
      event.preventDefault();
      const raw = field === 'to' ? this.toDraft : this.ccDraft;
      if (raw.trim()) this._commitChip(field, raw);
    } else if (event.key === 'Backspace') {
      const draft = field === 'to' ? this.toDraft : this.ccDraft;
      if (!draft) (field === 'to' ? this.to : this.cc).pop();
    }
  }

  onRecipientBlur(field: 'to' | 'cc'): void {
    const raw = field === 'to' ? this.toDraft : this.ccDraft;
    if (raw.trim()) this._commitChip(field, raw);
  }

  removeRecipient(field: 'to' | 'cc', index: number): void {
    (field === 'to' ? this.to : this.cc).splice(index, 1);
  }

  browseFiles(): void {
    this.fileInput?.nativeElement.click();
  }

  onFilesPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    this._addFiles(input.files);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(): void {
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    this._addFiles(event.dataTransfer?.files ?? null);
  }

  private _addFiles(files: FileList | null): void {
    if (!files || files.length === 0) return;
    this.attachError = null;
    const maxBytes = (this.data.maxAttachmentSizeMB ?? 15) * 1024 * 1024;
    for (const file of Array.from(files)) {
      if (file.size > maxBytes) {
        this.attachError = `"${file.name}" exceeds the ${this.data.maxAttachmentSizeMB ?? 15}MB limit`;
        continue;
      }
      this.attachments.push({ name: file.name, size: file.size, type: file.type, file, removable: true });
    }
  }

  removeAttachment(index: number): void {
    if (this.attachments[index]?.removable === false) return;
    this.attachments.splice(index, 1);
  }

  cancel(): void {
    if (this.sending) return;
    this.dialogRef.close(null);
  }

  async send(): Promise<void> {
    if (!this.isValid) return;
    this.sending = true;
    this.sendError = null;
    const result: OslEmailSendResult = {
      to: this.to,
      cc: this.cc,
      subject: this.subject,
      body: this.body,
      attachments: this.attachments,
    };
    try {
      await Promise.resolve(this.data.onSendClick?.(result));
      this.dialogRef.close(result);
    } catch (e: any) {
      this.sendError = e?.message || 'Failed to send email. Please try again.';
    } finally {
      this.sending = false;
    }
  }
}
