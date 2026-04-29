import { NgModule } from "@angular/core";
import { AUTOCOMPLETE_LISTER_COMPONENT } from "./autocomplete-lister/autocomplete-lister-types";
import { DynamicForm } from "./dynamic-form/dynamic-form";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgTemplateOutlet } from "@angular/common";
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
    OslCheckbox,
    OslButton,
    OslSetup,
    OslSearchbar,
    OslGrid,
    OslFormGrid,
    OslAutocompleteLister
  ],
  imports: [
    NgTemplateOutlet,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatHint,
    MatIconModule,
    MatDialogModule,
    MatButtonModule,
    OslSkeletonModule
  ],
  exports: [DynamicForm, OslSetup, OslGrid, OslFormGrid,Oslinput,
    Osltextarea,
    OslSelect,
    OslRadio,
    OslSlideToggle,
    OslAutocomplete,
    OslFileUpload,
    OslDatepicker,
    OslCheckbox,
    OslButton,
    OslSetup,
    OslSearchbar,OslAutocompleteLister],
  providers: [
    { provide: AUTOCOMPLETE_LISTER_COMPONENT, useValue: OslAutocompleteLister },
  ],
})
export class FormStructureModule {}
