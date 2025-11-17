import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface EndDateConfirmDialogData {
  metatype: 'vendable' | 'commandable';
  dateFin: string; // YYYY-MM-DD
  selectedCount: number;
}

@Component({
  selector: 'app-end-date-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Confirmer la modification</h2>
    <div mat-dialog-content class="dialog-content">
      <p>
        Vous allez modifier la <strong>date de fin</strong> pour
        <strong>{{ data.metatype }}</strong> sur
        <strong>{{ data.selectedCount }}</strong> article(s).
      </p>
      <p>Nouvelle date: <strong>{{ data.dateFin }}</strong></p>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button mat-flat-button color="primary" (click)="onConfirm()">Confirmer</button>
    </div>
  `,
  styles: [
    `.dialog-content { display: flex; flex-direction: column; gap: 8px; }`,
  ],
})
export class EndDateConfirmDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<EndDateConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EndDateConfirmDialogData,
  ) {}

  onCancel() { this.dialogRef.close(false); }
  onConfirm() { this.dialogRef.close(true); }
}

