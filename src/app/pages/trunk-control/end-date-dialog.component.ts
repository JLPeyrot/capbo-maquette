import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';

export interface EndDateDialogData {
  selectedCount: number;
}

export interface EndDateDialogResult {
  metatype: 'vendable' | 'commandable';
  dateFin: string; // ISO date string YYYY-MM-DD
}

@Component({
  selector: 'app-end-date-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Modifier date de fin</h2>
    <div mat-dialog-content class="dialog-content">
      <p>Articles sélectionnés: {{ data.selectedCount }}</p>

      <mat-form-field appearance="fill" class="full-width">
        <mat-label>Type d'assortiment</mat-label>
        <mat-select [(ngModel)]="metatype">
          <mat-option value="vendable">Vendable</mat-option>
          <mat-option value="commandable">Commandable</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="fill" class="full-width">
        <mat-label>Date de fin</mat-label>
        <input matInput [matDatepicker]="picker" [(ngModel)]="date" />
        <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button mat-flat-button color="primary" [disabled]="!date" (click)="onConfirm()">Continuer</button>
    </div>
  `,
  styles: [
    `.dialog-content { display: flex; flex-direction: column; gap: 12px; }`,
    `.full-width { width: 100%; }`,
  ],
})
export class EndDateDialogComponent {
  metatype: 'vendable' | 'commandable' = 'vendable';
  date: Date | null = null;

  constructor(
    private dialogRef: MatDialogRef<EndDateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EndDateDialogData,
  ) {}

  onCancel() {
    this.dialogRef.close();
  }

  onConfirm() {
    if (!this.date) return;
    const iso = this.date.toISOString().slice(0, 10); // YYYY-MM-DD
    const result: EndDateDialogResult = { metatype: this.metatype, dateFin: iso };
    this.dialogRef.close(result);
  }
}

