# OslCore

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.7, and is currently on **Angular 22**.

It hosts `osl-core`, a demo/test-bed application, and `osl-base-extended`, a reusable Angular component library for building data-driven admin/back-office UIs on top of Angular Material.

## Features

### Form structure components (`osl-base-extended`)
- **Inputs** — text, number (with negative/decimal restrictions), textarea, checkbox, radio, select, slide-toggle, with a shared skeleton/loading state.
- **Date & time** — datepicker (including year-only / multi-year mode) and datetimepicker.
- **Autocomplete** — single autocomplete and autocomplete-lister, with custom display functions, datasource caching, and API-driven data sources.
- **File handling** — file-upload and document-uploader components.
- **Dynamic form** — declarative form rendering driven by an `elements` config, supporting all the field types above.
- **Data display** — grid, form-grid (drag-drop builder mode, template-ref cells, autocomplete-resolved columns), and report-grid/report-form for tabular reporting.
- **Workflow shells** — setup (list/detail with pagination, state restoration, header actions) and searchbar.
- **Supporting UI** — button, menu, user-log, dialog-wrapper, delete-confirmation, error-dialog, and unsaved-changes-dialog.

### Core services & utilities
- `BaseComponent` — shared base class for form-backed components (see `markFormDirty` / `markFormClean`).
- Unsaved-changes guard (`CanDeactivate`) backed by `DirtyStateService`, for warning on navigation away from dirty forms.
- `HttpBase` — HTTP client wrapper with unified error handling, including Blob-based file download/error unwrapping.
- Skeleton and tooltip directives for loading states and contextual hints.

### Demo app (`osl-core`)
- Example pages under `src/app/testenv` demonstrating the library's components (setup, searchbar, dynamic-form, datepicker, drag-drop, etc.), used as a playground during development.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
