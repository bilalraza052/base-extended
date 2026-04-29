import { inject, Injectable, Injector, TemplateRef } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { Dialog, DialogWrapper } from "../shared/components/dialog-wrapper/dialog-wrapper";
import { DeleteConfirmation, DeleteConfirmationData } from "../shared/components/delete-confirmation/delete-confirmation";
@Injectable()

export class baseComponent{
    private _injector = inject(Injector);

    protected showSuccess(message:any){
        if(Array.isArray(message)){
            message = message.join(',')
        }
        this.showSnack(message)
    }


    protected showError(error:string|string[]){
         if(Array.isArray(error)){
            error = error.join(',')
        }
        this.showSnack(error)
    }

    protected navigate(url:string){
        this._injector.get(Router).navigate([url])
    }

    private showSnack(message:string){
        this._injector.get(MatSnackBar).open(message,'Ok',{
            duration:3000
        })
    }

    protected openDialog(
        header?:string|TemplateRef<any>, 
        formBody?:TemplateRef<any>,
        formFooter?:TemplateRef<any>,
        width:string = '40vw',
        data?:any,
        component?:any
    ):MatDialogRef<any>{
        const dialogData:Dialog= {
            header:header,
            formBody:formBody,
            formFooter:formFooter,
            data:data,
            component:component
        }
        const dialogRef = this._injector.get(MatDialog)?.open(DialogWrapper,{
            width:width,
            maxWidth:'80vw',
            data:{...dialogData,...data},

        })
        return dialogRef;
    }

    protected openDeleteDialog(
        message: string = 'Are you sure you want to delete this item?',
        title: string = 'Delete Confirmation',
        confirmText: string = 'Delete',
        cancelText: string = 'Cancel',
        data?: any,
    ): MatDialogRef<DeleteConfirmation> {
        const dialogData: DeleteConfirmationData = { title, message, confirmText, cancelText, data };
        return this._injector.get(MatDialog).open(DeleteConfirmation, {
            width: '380px',
            data: dialogData,
            disableClose: true,
        });
    }

}