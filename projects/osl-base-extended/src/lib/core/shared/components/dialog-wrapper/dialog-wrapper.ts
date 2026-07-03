import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import { Component, Inject, TemplateRef } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DragConstrainPosition, DragDropModule } from '@angular/cdk/drag-drop';

// Minimum sliver (px) of the dialog that must stay on-screen on every edge while dragging.
const DRAG_MIN_VISIBLE = 60;

@Component({
  selector: 'dialog-wrapper',
  imports: [MatDialogModule, MatIconModule, NgTemplateOutlet, MatIconButton,NgComponentOutlet, DragDropModule],
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
    this.dialogData.isDraggable = data.isDraggable
  }

  // Lets the dialog be dragged past the viewport edges but keeps at least
  // DRAG_MIN_VISIBLE px of it on-screen so it can never be fully lost off-screen.
  protected dragConstrainPosition: DragConstrainPosition = (point, _dragRef, dimensions, pickupPositionInElement) => {
    const x = point.x - pickupPositionInElement.x;
    const y = point.y - pickupPositionInElement.y;
    return {
      x: Math.min(Math.max(x, DRAG_MIN_VISIBLE - dimensions.width), window.innerWidth - DRAG_MIN_VISIBLE),
      y: Math.min(Math.max(y, DRAG_MIN_VISIBLE - dimensions.height), window.innerHeight - DRAG_MIN_VISIBLE),
    };
  };
}

export class Dialog{
  header?:string|TemplateRef<any>= "No Title Found";
  partialHeader?:TemplateRef<any> | undefined;
  formBody?:TemplateRef<any> | undefined;
  formFooter?:TemplateRef<any> | undefined;
  data?:any;
  component?:any;
  dialogRef?:any;
  isDraggable?:boolean = false;



}
