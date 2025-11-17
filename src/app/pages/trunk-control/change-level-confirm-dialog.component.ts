import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ChangeLevelConfirmDialogData {
  selectedCount: number;
  level: number;
  levelLabel?: string;
}

@Component({
  selector: 'app-change-level-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Confirmer la mise à jour</h2>
    <div mat-dialog-content>
      <p>
        Vous allez définir le niveau de tronc
        <strong>Level {{ data.level }}</strong>
        <span *ngIf="data.levelLabel">– {{ data.levelLabel }}</span>
        pour <strong>{{ data.selectedCount }}</strong> article(s).
      </p>
      <p>Souhaitez-vous continuer ?</p>
    </div>
    <div mat-dialog-actions>
      <button mat-stroked-button (click)="onCancel()">Annuler</button>
      <button mat-flat-button color="primary" (click)="onConfirm()">Confirmer</button>
    </div>
  `,
})
export class ChangeLevelConfirmDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ChangeLevelConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ChangeLevelConfirmDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}

