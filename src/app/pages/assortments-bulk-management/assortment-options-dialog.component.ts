import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter, NativeDateAdapter, ErrorStateMatcher } from '@angular/material/core';

export interface AssortmentOptionsResult {
  commandableEnabled: boolean;
  commandableStart?: string | null;
  commandableEnd?: string | null;
  vendableEnabled: boolean;
  vendableStart?: string | null;
  vendableEnd?: string | null;
}

class FrDateAdapter extends NativeDateAdapter {
  override format(date: Date, displayFormat: any): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  override parse(value: any): Date | null {
    if (typeof value === 'string') {
      const match = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(value);
      if (match) {
        const day = Number(match[1]);
        const month = Number(match[2]);
        const year = Number(match[3]);
        const d = new Date(year, month - 1, day);
        return this.isValid(d) ? d : null;
      }
    }
    return super.parse(value);
  }
}

@Component({
  selector: 'app-assortment-options-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './assortment-options-dialog.component.html',
  styleUrls: ['./assortment-options-dialog.component.scss'],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
    { provide: DateAdapter, useClass: FrDateAdapter }
  ]
})
export class AssortmentOptionsDialogComponent {
  commandableEnabled: boolean = false;
  vendableEnabled: boolean = false;

  commandableStart: Date | null = null;
  commandableEnd: Date | null = null;

  vendableStart: Date | null = null;
  vendableEnd: Date | null = null;
  showDates: boolean = true;
  submitted: boolean = false;
  errorStateMatcher: ErrorStateMatcher = {
    isErrorState: (control: any) => !!control && control.invalid && (control.dirty || control.touched || this.submitted)
  };

  constructor(
    private dialogRef: MatDialogRef<AssortmentOptionsDialogComponent>,
    private dateAdapter: DateAdapter<Date>,
    @Inject(MAT_DIALOG_DATA) data?: { showDates?: boolean }
  ) {
    this.showDates = typeof data?.showDates === 'boolean' ? data!.showDates! : true;
    this.dateAdapter.setLocale('fr-FR');
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  confirm(): void {
    this.submitted = true;
    const invalidCommandable = this.commandableEnabled && !this.commandableStart;
    const invalidVendable = this.vendableEnabled && !this.vendableStart;
    if (invalidCommandable || invalidVendable) {
      return;
    }
    const result: AssortmentOptionsResult = {
      commandableEnabled: this.commandableEnabled,
      commandableStart: this.commandableEnabled ? this.formatDate(this.commandableStart) : null,
      commandableEnd: this.commandableEnabled ? this.formatDate(this.commandableEnd) : null,
      vendableEnabled: this.vendableEnabled,
      vendableStart: this.vendableEnabled ? this.formatDate(this.vendableStart) : null,
      vendableEnd: this.vendableEnabled ? this.formatDate(this.vendableEnd) : null
    };
    this.dialogRef.close(result);
  }

  private formatDate(d: Date | null): string | null {
    if (!d) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
