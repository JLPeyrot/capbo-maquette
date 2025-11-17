import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { MatDialogRef } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

export interface AssortmentOptionsResult {
  commandableEnabled: boolean;
  commandableStart?: string | null;
  commandableEnd?: string | null;
  vendableEnabled: boolean;
  vendableStart?: string | null;
  vendableEnd?: string | null;
}

@Component({
  selector: 'app-assortment-options-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './assortment-options-dialog.component.html',
  styleUrls: ['./assortment-options-dialog.component.scss']
})
export class AssortmentOptionsDialogComponent {
  commandableEnabled: boolean = false;
  vendableEnabled: boolean = false;

  commandableStart: Date | null = null;
  commandableEnd: Date | null = null;

  vendableStart: Date | null = null;
  vendableEnd: Date | null = null;

  constructor(private dialogRef: MatDialogRef<AssortmentOptionsDialogComponent>) {}

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  confirm(): void {
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
