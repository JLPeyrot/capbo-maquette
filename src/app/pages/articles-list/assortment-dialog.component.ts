import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Article } from './articles-list.component';

export interface AssortmentDialogData {
  article: Article;
}

export interface AssortmentConfig {
  subType: 'Permanent' | 'Promotionnel' | 'Catalogue' | 'Dynamique' | '';
  perimeter: 'Fermé' | 'Mixte' | 'Ouvert' | '';
  trunk?: string | null;
  level?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

@Component({
  selector: 'app-assortment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>grid_view</mat-icon>
      Assortiments – {{ data.article.reference }}
    </h2>

    <mat-dialog-content class="dialog-content">
      <mat-tab-group>
        <mat-tab label="Commandable">
          <div class="tab-content">
            <div class="section">
              <div class="section-title">Typologie</div>
              <div class="kv-grid">
                <div class="kv"><span class="kv-label">Sous-type</span><span class="kv-value">{{ commandable.subType || 'Non renseigné' }}</span></div>
                <div class="kv"><span class="kv-label">Périmètre de déploiement</span><span class="kv-value">{{ commandable.perimeter || 'Non renseigné' }}</span></div>
              </div>
            </div>
            <div class="section">
              <div class="section-title">Tronc</div>
              <div class="kv-grid">
                <div class="kv"><span class="kv-label">Tronc affecté</span><span class="kv-value">{{ commandable.trunk || 'Aucun' }}</span></div>
                <div class="kv"><span class="kv-label">Niveau</span><span class="kv-value">{{ commandable.level || '—' }}</span></div>
              </div>
              <div class="dates-grid">
                <div class="kv"><span class="kv-label">Date de début</span><span class="kv-value">{{ commandable.startDate ? (commandable.startDate | date:'dd/MM/yyyy') : '—' }}</span></div>
                <div class="kv"><span class="kv-label">Date de fin</span><span class="kv-value">{{ commandable.endDate ? (commandable.endDate | date:'dd/MM/yyyy') : '—' }}</span></div>
              </div>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Vendable">
          <div class="tab-content">
            <div class="section">
              <div class="section-title">Typologie</div>
              <div class="kv-grid">
                <div class="kv"><span class="kv-label">Sous-type</span><span class="kv-value">{{ vendable.subType || 'Non renseigné' }}</span></div>
                <div class="kv"><span class="kv-label">Périmètre de déploiement</span><span class="kv-value">{{ vendable.perimeter || 'Non renseigné' }}</span></div>
              </div>
            </div>
            <div class="section">
              <div class="section-title">Tronc</div>
              <div class="kv-grid">
                <div class="kv"><span class="kv-label">Tronc affecté</span><span class="kv-value">{{ vendable.trunk || 'Aucun' }}</span></div>
                <div class="kv"><span class="kv-label">Niveau</span><span class="kv-value">{{ vendable.level || '—' }}</span></div>
              </div>
              <div class="dates-grid">
                <div class="kv"><span class="kv-label">Date de début</span><span class="kv-value">{{ vendable.startDate ? (vendable.startDate | date:'dd/MM/yyyy') : '—' }}</span></div>
                <div class="kv"><span class="kv-label">Date de fin</span><span class="kv-value">{{ vendable.endDate ? (vendable.endDate | date:'dd/MM/yyyy') : '—' }}</span></div>
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" (click)="onCancel()">Fermer</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
    .dialog-content { width: 100%; max-width: 100%; }
    .tab-content { display: flex; flex-direction: column; gap: 16px; padding-top: 4px; align-items: flex-start; text-align: left; }
    .kv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 32px; width: 100%; }
    .dates-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 32px; width: 100%; }
    .section { display: flex; flex-direction: column; gap: 8px; width: 100%; padding: 12px; border: 1px solid rgba(0,0,0,0.12); border-radius: 8px; }
    .section-title { font-weight: 600; color: rgba(0,0,0,0.6); }
    .kv { display: grid; grid-template-columns: minmax(140px, 200px) 1fr; align-items: baseline; }
    .kv-label { font-weight: 600; color: rgba(0,0,0,0.6); }
    .kv-value { color: rgba(0,0,0,0.87); }
    h2 mat-icon { vertical-align: middle; margin-right: 8px; }
    @media (max-width: 900px) {
      .kv-grid { grid-template-columns: 1fr; }
      .dates-grid { grid-template-columns: 1fr; }
    }
    `,
  ],
})
export class AssortmentDialogComponent implements OnInit {
  commandable: AssortmentConfig = { subType: '', perimeter: '', trunk: null, level: null, startDate: null, endDate: null };
  vendable: AssortmentConfig = { subType: '', perimeter: '', trunk: null, level: null, startDate: null, endDate: null };

  constructor(
    private dialogRef: MatDialogRef<AssortmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssortmentDialogData,
  ) {}

  ngOnInit(): void {
    this.commandable = {
      subType: 'Permanent',
      perimeter: 'Fermé',
      trunk: 'TAN BL',
      level: 'GRAND (Niveau 3)',
      startDate: new Date(2025, 0, 1),
      endDate: new Date(2026, 7, 4),
    };
    this.vendable = {
      subType: 'Permanent',
      perimeter: 'Fermé',
      trunk: 'TAN BL',
      level: 'GRAND (Niveau 3)',
      startDate: new Date(2025, 0, 1),
      endDate: new Date(2026, 7, 4),
    };
  }

  onCancel(): void { this.dialogRef.close(null); }
}
