import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import { Component, Inject, TemplateRef } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'dialog-wrapper',
  imports: [MatDialogModule, MatIconModule, NgTemplateOutlet, MatIconButton,NgComponentOutlet],
  templateUrl: './dialog-wrapper.html',
  styleUrl: './dialog-wrapper.scss',
})
export class DialogWrapper {
  dialogData:Dialog= new Dialog()
  constructor(public dialogRef:MatDialogRef<DialogWrapper>,@Inject(MAT_DIALOG_DATA) public data: Dialog){
    this.dialogData.header = data.header;
    this.dialogData.partialHeader = data.partialHeader;
    this.dialogData.formBody = data.formBody;
    this.dialogData.formFooter = data.formFooter;
    this.dialogData.data = data.data
    this.dialogData.dialogRef = dialogRef
    this.dialogData.component = data.component
  }
}

export class Dialog{
  header?:string|TemplateRef<any>= "No Title Found";
  partialHeader?:TemplateRef<any> | undefined;
  formBody?:TemplateRef<any> | undefined;
  formFooter?:TemplateRef<any> | undefined;
  data?:any;
  component?:any;
  dialogRef?:any;



}
