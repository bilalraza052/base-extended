import { NgModule } from "@angular/core";
import { AUTOCOMPLETE_LISTER_COMPONENT } from "./autocomplete-lister/autocomplete-lister-types";
import { DynamicForm } from "./dynamic-form/dynamic-form";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { DatePipe, DecimalPipe, NgClass, NgStyle, NgTemplateOutlet, UpperCasePipe } from "@angular/common";
import { MatFormFieldModule, MatHint } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { Shinput } from "./input/input";
import { Shtextarea } from "./textarea/textarea";
import { ShSelect } from "./select/select";
import { ShRadio } from "./radio/radio";
import { ShSlideToggle } from "./slide-toggle/slide-toggle";
import { ShAutocomplete } from "./autocomplete/autocomplete";
import { ShFileUpload } from "./file-upload/file-upload";
import { ShDatepicker } from "./datepicker/datepicker";
import { ShDatetimepicker } from "./datetimepicker/datetimepicker";
import { ShCheckbox } from "./checkbox/checkbox";
import { ShButton } from "./button/button";
import { ShSetup } from "./setup/setup";
import { ShSearchbar } from "./searchbar/searchbar";
import { MatIconModule } from "@angular/material/icon";
import { MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { ShGrid } from "./grid/grid";
import { ShFormGrid } from "./form-grid/form-grid";
import { ShAutocompleteLister } from "./autocomplete-lister/autocomplete-lister";
import { ShChipsInput } from "./chips-input/chips-input";
import { ShSkeletonModule } from "../directives/skeleton/skeleton.module";
import { ShTooltipDirective } from "../directives/tooltip/tooltip.directive";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatMenuModule } from "@angular/material/menu";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { ShReportGrid } from "./report-grid/report-grid";
import { ShReportForm } from "./report-form/report-form";
import { ShUserLog } from "./user-log/user-log";
import { ShMenu, ShMenuTriggerFor, ShMenuItem } from "./menu/menu";
import { ShDocumentUploader } from "./document-uploader/document-uploader";
import { OverlayModule } from "@angular/cdk/overlay";
import { PortalModule } from "@angular/cdk/portal";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NgxMatDatetimepicker, NgxMatDatepickerInput } from "@ngxmc/datetime-picker";

@NgModule({
  declarations: [
    DynamicForm,
    Shinput,
    Shtextarea,
    ShSelect,
    ShRadio,
    ShSlideToggle,
    ShAutocomplete,
    ShFileUpload,
    ShDatepicker,
    ShDatetimepicker,
    ShCheckbox,
    ShButton,
    ShSetup,
    ShSearchbar,
    ShGrid,
    ShFormGrid,
    ShAutocompleteLister,
    ShChipsInput,
    ShReportGrid,
    ShReportForm,
    ShUserLog,
    ShMenu,
    ShMenuTriggerFor,
    ShMenuItem,
    ShDocumentUploader,
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
    ShSkeletonModule,
    ShTooltipDirective,
    MatDatepickerModule,
    MatMenuModule,
    DragDropModule,
    MatTooltipModule,
    OverlayModule,
    PortalModule,
    NgxMatDatetimepicker,
    NgxMatDatepickerInput,
  ],
  exports: [DynamicForm, ShSetup, ShGrid, ShFormGrid, Shinput, ShUserLog,
    Shtextarea,
    ShSelect,
    ShRadio,
    ShSlideToggle,
    ShAutocomplete,
    ShFileUpload,
    ShDatepicker,
    ShDatetimepicker,
    ShCheckbox,
    ShButton,
    ShSetup,
    ShSearchbar, ShAutocompleteLister, ShChipsInput, ShReportGrid, ShReportForm,
    ShMenu, ShMenuTriggerFor, ShMenuItem, ShDocumentUploader, ShTooltipDirective],
  providers: [
    { provide: AUTOCOMPLETE_LISTER_COMPONENT, useValue: ShAutocompleteLister },
  ],
})
export class FormStructureModule {}
