import { NgModule } from "@angular/core";
import { AUTOCOMPLETE_LISTER_COMPONENT } from "./autocomplete-lister/autocomplete-lister-types";
import { DynamicForm } from "./dynamic-form/dynamic-form";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { DatePipe, DecimalPipe, NgClass, NgStyle, NgTemplateOutlet, UpperCasePipe } from "@angular/common";
import { MatFormFieldModule, MatHint } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { Oslinput } from "./input/input";
import { Osltextarea } from "./textarea/textarea";
import { OslSelect } from "./select/select";
import { OslRadio } from "./radio/radio";
import { OslSlideToggle } from "./slide-toggle/slide-toggle";
import { OslAutocomplete } from "./autocomplete/autocomplete";
import { OslFileUpload } from "./file-upload/file-upload";
import { OslDatepicker } from "./datepicker/datepicker";
import { OslDatetimepicker } from "./datetimepicker/datetimepicker";
import { OslCheckbox } from "./checkbox/checkbox";
import { OslButton } from "./button/button";
import { OslSetup } from "./setup/setup";
import { OslSearchbar } from "./searchbar/searchbar";
import { MatIconModule } from "@angular/material/icon";
import { MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { OslGrid } from "./grid/grid";
import { OslFormGrid } from "./form-grid/form-grid";
import { OslAutocompleteLister } from "./autocomplete-lister/autocomplete-lister";
import { OslSkeletonModule } from "../directives/skeleton/skeleton.module";
import { OslTooltipDirective } from "../directives/tooltip/tooltip.directive";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatMenuModule } from "@angular/material/menu";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { OslReportGrid } from "./report-grid/report-grid";
import { OslReportForm } from "./report-form/report-form";
import { OslUserLog } from "./user-log/user-log";
import { OslMenu, OslMenuTriggerFor } from "./menu/menu";
import { OslDocumentUploader } from "./document-uploader/document-uploader";
import { OverlayModule } from "@angular/cdk/overlay";
import { PortalModule } from "@angular/cdk/portal";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NgxMatDatetimepicker, NgxMatDatepickerInput } from "@ngxmc/datetime-picker";

@NgModule({
  declarations: [
    DynamicForm,
    Oslinput,
    Osltextarea,
    OslSelect,
    OslRadio,
    OslSlideToggle,
    OslAutocomplete,
    OslFileUpload,
    OslDatepicker,
    OslDatetimepicker,
    OslCheckbox,
    OslButton,
    OslSetup,
    OslSearchbar,
    OslGrid,
    OslFormGrid,
    OslAutocompleteLister,
    OslReportGrid,
    OslReportForm,
    OslUserLog,
    OslMenu,
    OslMenuTriggerFor,
    OslDocumentUploader,
  ],
  imports: [
    NgTemplateOutlet,
    NgStyle,
    NgClass,
    DatePipe,
    DecimalPipe,
    UpperCasePipe,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatHint,
    MatIconModule,
    MatDialogModule,
    MatButtonModule,
    OslSkeletonModule,
    OslTooltipDirective,
    MatDatepickerModule,
    MatMenuModule,
    DragDropModule,
    MatTooltipModule,
    OverlayModule,
    PortalModule,
    NgxMatDatetimepicker,
    NgxMatDatepickerInput,
  ],
  exports: [DynamicForm, OslSetup, OslGrid, OslFormGrid, Oslinput, OslUserLog,
    Osltextarea,
    OslSelect,
    OslRadio,
    OslSlideToggle,
    OslAutocomplete,
    OslFileUpload,
    OslDatepicker,
    OslDatetimepicker,
    OslCheckbox,
    OslButton,
    OslSetup,
    OslSearchbar, OslAutocompleteLister, OslReportGrid, OslReportForm,
    OslMenu, OslMenuTriggerFor, OslDocumentUploader, OslTooltipDirective],
  providers: [
    { provide: AUTOCOMPLETE_LISTER_COMPONENT, useValue: OslAutocompleteLister },
  ],
})
export class FormStructureModule {}
