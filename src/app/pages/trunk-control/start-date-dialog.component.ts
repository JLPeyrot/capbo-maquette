import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

export interface StartDateDialogData {
  selectedCount: number;
  defaultMetatype?: 'commandable' | 'vendable';
}

export interface StartDateDialogResult {
  metatype: 'commandable' | 'vendable';
  date: Date;
}

@Component({
  selector: 'app-start-date-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, MatDatepickerModule, MatNativeDateModule],
  template: `
    <h2 mat-dialog-title>Modifier la date de début</h2>
    <div mat-dialog-content class="dialog-content">
      <p class="selection-info">Articles sélectionnés: {{ data.selectedCount }}</p>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Type d'assortiment</mat-label>
        <mat-select [(ngModel)]="metatype">
          <mat-option value="commandable">Commandable</mat-option>
          <mat-option value="vendable">Vendable</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Date de début</mat-label>
        <input matInput [matDatepicker]="picker" [(ngModel)]="startDate" placeholder="Choisir une date"/>
        <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>
    </div>
    <div mat-dialog-actions align="end" class="dialog-actions">
      <button mat-stroked-button mat-dialog-close>Annuler</button>
      <button mat-flat-button color="primary" (click)="confirm()" [disabled]="!metatype || !startDate">Valider</button>
    </div>
  `,
  styles: [`
    .full-width { width: 100%; }
    .dialog-content { min-width: 360px; }
    .selection-info { margin-bottom: 8px; color: #555; }
  `]
})
export class StartDateDialogComponent {
  metatype: 'commandable' | 'vendable' = 'vendable';
  startDate: Date | null = new Date();

  constructor(
    public dialogRef: MatDialogRef<StartDateDialogComponent, StartDateDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: StartDateDialogData
  ) {
    if (data && data.defaultMetatype) {
      this.metatype = data.defaultMetatype;
    }
  }

  confirm(): void {
    if (!this.metatype || !this.startDate) return;
    this.dialogRef.close({ metatype: this.metatype, date: this.startDate });
  }
}
