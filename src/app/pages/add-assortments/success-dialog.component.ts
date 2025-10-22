import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material-module';

export interface SuccessDialogData {
  articlesCount: number;
  trunkName: string;
  trunkLevel: string;
}

@Component({
  selector: 'app-success-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <div class="success-dialog">
      <div class="dialog-header">
        <mat-icon class="success-icon">check_circle</mat-icon>
        <h2 mat-dialog-title>Affectation réussie</h2>
      </div>
      
      <div mat-dialog-content class="dialog-content">
        <p class="success-message">
          <strong>{{ data.articlesCount }}</strong> article{{ data.articlesCount > 1 ? 's ont été affectés' : ' a été affecté' }} 
          avec succès au tronc :
        </p>
        
        <div class="trunk-info">
          <div class="trunk-details">
            <span class="trunk-name">{{ data.trunkName }}</span>
            <span class="trunk-level">{{ data.trunkLevel }}</span>
          </div>
        </div>
      </div>
      
      <div mat-dialog-actions class="dialog-actions">
        <button 
          mat-raised-button 
          (click)="onClose()"
          class="close-button">
          <mat-icon>done</mat-icon>
          OK
        </button>
      </div>
    </div>
  `,
  styles: [`
    .success-dialog {
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
      background: #f0f8f0;
      color: #333;
      border-bottom: 1px solid #e0f0e0;
      border-radius: 12px 12px 0 0;
      border-left: 4px solid #4caf50;
    }
    
    .success-icon {
      color: #4caf50;
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
    
    .success-message {
      margin: 0 0 16px 0;
      font-size: 16px;
      line-height: 1.5;
      color: #333;
    }
    
    .trunk-info {
      background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
      border: 1px solid #a5d6a7;
      border-left: 4px solid #4caf50;
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
    
    .dialog-actions {
      padding: 16px 24px 24px 24px;
      justify-content: center;
      background: #f8f9fa;
      border-top: 1px solid #e0e0e0;
    }
    
    .close-button {
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: #4caf50;
      color: white;
      border: none;
      min-width: 120px;
      height: 40px;
      font-weight: 500;
      
      &:hover {
        background-color: #388e3c;
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
      }
    }
  `]
})
export class SuccessDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SuccessDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SuccessDialogData
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}