import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface CreateOppositeDialogData {
  currentType: string;
  oppositeType: string;
  assortmentSubType?: string;
  startDate?: any;
  endDate?: any;
  articleName?: string;
}

@Component({
  selector: 'app-create-opposite-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="create-opposite-dialog">
      <h2 mat-dialog-title>
        <mat-icon class="success-icon">check_circle</mat-icon>
        Création d'un assortiment - {{ data.articleName || 'Article' }}
      </h2>
      
      <mat-dialog-content>
        <p>Type d'assortiment créé : {{ labelType(data.currentType) }}</p>
        <p>Sous-type : {{ subTypeLabel(data.assortmentSubType) }}</p>
        <p *ngIf="hasAnyDate(data.startDate, data.endDate)">Date(s) : 
          <span *ngIf="data.startDate">début {{ formatDate(data.startDate) }}</span>
          <span *ngIf="data.startDate && data.endDate"> • </span>
          <span *ngIf="data.endDate">fin {{ formatDate(data.endDate) }}</span>
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

  subTypeLabel(value?: string): string {
    if (!value) return '—';
    if (value === 'permanent') return 'Permanent';
    if (value === 'promotional') return 'Promotionnel';
    if (value === 'catalog') return 'Catalogue';
    return String(value);
  }

  formatDate(value: any): string {
    if (!value) return '—';
    try {
      const d = value instanceof Date ? value : new Date(value);
      if (isNaN(d.getTime())) return '—';
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${day}/${m}/${y}`;
    } catch {
      return '—';
    }
  }

  hasAnyDate(start: any, end: any): boolean {
    return !!start || !!end;
  }

  labelType(value: string): string {
    if (value === 'commandable') return 'Commandable';
    if (value === 'vendable') return 'Vendable';
    return String(value);
  }
}
