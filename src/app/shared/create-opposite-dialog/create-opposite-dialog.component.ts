import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface CreateOppositeDialogData {
  currentType: string;
  oppositeType: string;
}

@Component({
  selector: 'app-create-opposite-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="create-opposite-dialog">
      <h2 mat-dialog-title>
        <mat-icon class="success-icon">check_circle</mat-icon>
        Créer l'assortiment associé ?
      </h2>
      
      <mat-dialog-content>
        <p>
          Souhaitez-vous créer la version {{ data.oppositeType }} correspondante ? 
          Les informations communes seront reprises automatiquement.
        </p>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button (click)="onLater()">
          Plus tard
        </button>
        <button mat-raised-button color="primary" (click)="onCreateNow()">
          <mat-icon>add</mat-icon>
          Créer maintenant
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .create-opposite-dialog {
      min-width: 450px;
    }
    
    .success-icon {
      color: #4caf50;
      margin-right: 8px;
      vertical-align: middle;
    }
    
    h2 {
      display: flex;
      align-items: center;
      margin: 0;
    }
    
    mat-dialog-content {
      margin: 16px 0;
    }
    
    mat-dialog-actions {
      gap: 8px;
    }
    
    mat-dialog-actions button {
      min-width: 120px;
    }
  `]
})
export class CreateOppositeDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CreateOppositeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateOppositeDialogData
  ) {}

  onLater(): void {
    this.dialogRef.close('later');
  }

  onCreateNow(): void {
    this.dialogRef.close('create');
  }
}