import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MaterialModule } from '../../shared/material-module';

export interface ConfirmationDialogData {
  articleCount: number;
  trunkName: string;
  trunkLevel: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <div class="confirmation-dialog">
      <div class="dialog-header">
        <mat-icon class="warning-icon">warning</mat-icon>
        <h2 mat-dialog-title>Confirmation d'affectation</h2>
      </div>
      
      <div mat-dialog-content class="dialog-content">
        <p class="confirmation-message">
          Vous êtes sur le point d'ajouter <strong>{{ data.articleCount }} articles</strong> au tronc suivant :
        </p>
        <div class="trunk-info">
          <div class="trunk-details">
            <span class="trunk-name">"{{ data.trunkName }}"</span>
            <span class="trunk-level" *ngIf="data.trunkLevel">{{ data.trunkLevel }}</span>
          </div>
        </div>
        <p class="question">Voulez-vous continuer ?</p>
      </div>
      
      <div mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()" class="cancel-button">
          <mat-icon>close</mat-icon>
          Annuler
        </button>
        <button mat-raised-button (click)="onConfirm()" class="confirm-button">
          <mat-icon>check</mat-icon>
          Confirmer
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirmation-dialog {
      padding: 0;
      min-width: 450px;
      border-radius: 12px;
      overflow: hidden;
    }
    
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 24px 16px 24px;
      background: #fef7e6;
      color: #333;
      border-bottom: 1px solid #f0e6d2;
      border-radius: 12px 12px 0 0;
      border-left: 4px solid #ff8c00;
    }
    
    .warning-icon {
      color: #ff8c00;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    
    h2 {
      margin: 0;
      color: #333;
      font-weight: 600;
      font-size: 20px;
    }
    
    .dialog-content {
      padding: 24px;
      background: white;
    }
    
    .confirmation-message {
      margin: 0 0 16px 0;
      font-size: 16px;
      line-height: 1.5;
      color: #333;
    }
    
    .trunk-info {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border: 1px solid #dee2e6;
      border-left: 4px solid #ff8c00;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
    
    .trunk-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .trunk-name {
      font-weight: 600;
      color: #1976d2;
      font-size: 16px;
    }
    
    .trunk-level {
      color: #666;
      font-size: 14px;
    }
    
    .question {
      margin: 16px 0 0 0;
      font-weight: 500;
      color: #333;
      font-size: 16px;
    }
    
    .dialog-actions {
      padding: 16px 24px 24px 24px;
      justify-content: flex-end;
      gap: 12px;
      background: #f8f9fa;
      border-top: 1px solid #e0e0e0;
    }
    
    .cancel-button {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      border: 1px solid #dee2e6;
      
      &:hover {
        background-color: #f8f9fa;
        border-color: #adb5bd;
      }
    }
    
    .confirm-button {
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: #ff8c00;
      color: white;
      border: none;
      min-width: 120px;
      height: 40px;
      font-weight: 500;
      
      &:hover {
        background-color: #e67e00;
        box-shadow: 0 4px 12px rgba(255, 140, 0, 0.3);
      }
    }
  `]
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}