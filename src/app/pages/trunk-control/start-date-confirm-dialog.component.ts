import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface StartDateConfirmDialogData {
  selectedCount: number;
  metatypeLabel: string;
  dateLabel: string;
}

@Component({
  selector: 'app-start-date-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Confirmer la mise à jour</h2>
    <div mat-dialog-content>
      <p>
        Vous allez définir la date de début <strong>{{ metatypeLabel }}</strong>
        à <strong>{{ dateLabel }}</strong> pour <strong>{{ data.selectedCount }}</strong> article(s).
      </p>
      <p>Souhaitez-vous continuer ?</p>
    </div>
    <div mat-dialog-actions>
      <button mat-stroked-button (click)="onCancel()">Annuler</button>
      <button mat-flat-button color="primary" (click)="onConfirm()">Confirmer</button>
    </div>
  `,
})
export class StartDateConfirmDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<StartDateConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StartDateConfirmDialogData
  ) {}

  get metatypeLabel(): string { return this.data.metatypeLabel; }
  get dateLabel(): string { return this.data.dateLabel; }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}

