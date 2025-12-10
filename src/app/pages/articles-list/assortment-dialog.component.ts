import { Component, Inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MasterdataService } from '../../services/masterdata.service';
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

interface SupplierBlock {
  supplierSearch: string;
  selectedSupplier: string;
  pcb: number;
  moq: number;
  deliveryCadence: { lundi: boolean; mardi: boolean; mercredi: boolean; jeudi: boolean; vendredi: boolean; samedi: boolean; dimanche: boolean };
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
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatSnackBarModule,
  ],
  template: `
    <ng-template #cannotDeleteDialog>
      <h2 mat-dialog-title>
        <mat-icon color="warn">error</mat-icon>
        Action non autorisée
      </h2>
      <mat-dialog-content>
        Impossible de supprimer ce fournisseur. Au moins un fournisseur est requis.
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-flat-button color="primary" (click)="closeCannot()">OK</button>
      </mat-dialog-actions>
    </ng-template>
    <ng-template #confirmDeleteDialog>
      <h2 mat-dialog-title>
        <mat-icon color="warn">delete</mat-icon>
        Confirmer la suppression
      </h2>
      <mat-dialog-content>
        Voulez-vous supprimer ce bloc fournisseur ?
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-stroked-button (click)="closeConfirm()">Annuler</button>
        <button mat-flat-button color="warn" (click)="onConfirmDelete()">Supprimer</button>
      </mat-dialog-actions>
    </ng-template>
    <h2 mat-dialog-title>
      <mat-icon>grid_view</mat-icon>
      Assortiments – {{ data.article.reference }}
    </h2>
    <mat-dialog-content class="dialog-content">
      <mat-tab-group mat-stretch-tabs="false" class="strong-tabs">
        <mat-tab label="Commandable">
          <div class="tab-content">
            <div class="two-columns">
              <div class="section general">
                <div class="section-title">Général</div>
                <div class="form-grid">
                  <mat-form-field appearance="outline" floatLabel="always" class="field">
                    <mat-label>Type</mat-label>
                    <mat-select [(ngModel)]="cmdType">
                      <mat-option value="Permanent">Permanent</mat-option>
                      <mat-option value="Promotionnel">Promotionnel</mat-option>
                      <mat-option value="Catalogue">Catalogue</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline" floatLabel="always" class="field">
                    <mat-label>Typologie de déploiement</mat-label>
                    <mat-select [(ngModel)]="cmdTypology">
                      <mat-option value="Ouvert">Ouvert</mat-option>
                      <mat-option value="Mixte">Mixte</mat-option>
                      <mat-option value="Fermé">Fermé</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
                <div class="dates-row">
                  <mat-form-field appearance="outline" floatLabel="always" class="field">
                    <mat-label>Date de début</mat-label>
                    <input matInput [matDatepicker]="pickerStart" [(ngModel)]="cmdStartDate" placeholder="JJ/MM/AAAA">
                    <mat-datepicker-toggle matSuffix [for]="pickerStart"></mat-datepicker-toggle>
                    <mat-datepicker #pickerStart></mat-datepicker>
                  </mat-form-field>
                  <mat-form-field appearance="outline" floatLabel="always" class="field">
                    <mat-label>Date de fin</mat-label>
                    <input matInput [matDatepicker]="pickerEnd" [(ngModel)]="cmdEndDate" placeholder="JJ/MM/AAAA">
                    <mat-datepicker-toggle matSuffix [for]="pickerEnd"></mat-datepicker-toggle>
                    <mat-datepicker #pickerEnd></mat-datepicker>
                  </mat-form-field>
                </div>
                <div class="stocks-row">
                  <mat-form-field appearance="outline" floatLabel="always" class="field">
                    <mat-label>Stock mini</mat-label>
                    <input matInput type="number" [(ngModel)]="cmdStockMin" (ngModelChange)="cmdStockMin = toInt($event)" inputmode="numeric" pattern="\\d*" min="0" step="1">
                  </mat-form-field>
                  <mat-form-field appearance="outline" floatLabel="always" class="field">
                    <mat-label>Stock maxi</mat-label>
                    <input matInput type="number" [(ngModel)]="cmdStockMax" (ngModelChange)="cmdStockMax = toInt($event)" inputmode="numeric" pattern="\\d*" min="0" step="1">
                  </mat-form-field>
                </div>
                <div class="stocks-row">
                  <mat-form-field appearance="outline" floatLabel="always" class="field">
                    <mat-label>Stock de sécurité</mat-label>
                    <input matInput type="number" [(ngModel)]="cmdStockBackup" (ngModelChange)="cmdStockBackup = toInt($event)" inputmode="numeric" pattern="\\d*" min="0" step="1">
                  </mat-form-field>
                </div>
              </div>
              <div class="right-col">
                <ng-container *ngFor="let supp of supplierConfigs; let i = index">
                  <div class="section supplier">
                  <div class="section-actions">
                    <button mat-icon-button class="section-create-btn" aria-label="Créer un fournisseur" (click)="addSupplierAt(i)">
                      <mat-icon>add_circle</mat-icon>
                    </button>
                    <button mat-icon-button class="section-delete-btn" aria-label="Supprimer" (click)="openConfirmDelete(i)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                    <div class="section-title">Fournisseur</div>
                    <div class="supplier-grid">
                      <div class="supplier-cell">
                        <mat-form-field appearance="outline" floatLabel="always" class="field">
                          <mat-label>Fournisseur</mat-label>
                          <input matInput [(ngModel)]="supp.supplierSearch" [matAutocomplete]="auto" placeholder="Rechercher">
                          <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onSupplierSelected(i, $event.option.value)">
                            <mat-option *ngFor="let s of filteredSuppliers(supp.supplierSearch)" [value]="s">{{ s }}</mat-option>
                          </mat-autocomplete>
                        </mat-form-field>
                      </div>

                      <div class="pcb-cell">
                        <mat-form-field appearance="outline" floatLabel="always" class="field">
                          <mat-label>PCB</mat-label>
                          <input matInput type="number" [(ngModel)]="supp.pcb" min="0" step="1">
                        </mat-form-field>
                      </div>

                      <div class="moq-cell">
                        <mat-form-field appearance="outline" floatLabel="always" class="field">
                          <mat-label>MOQ</mat-label>
                          <input matInput type="number" [(ngModel)]="supp.moq" min="0" step="1">
                        </mat-form-field>
                      </div>

                      <div class="cadence-wrap">
                        <div class="cadence-title">Cadencier de livraison</div>
                        <div class="cadence-grid">
                          <mat-checkbox [(ngModel)]="supp.deliveryCadence.lundi">L</mat-checkbox>
                          <mat-checkbox [(ngModel)]="supp.deliveryCadence.mardi">M</mat-checkbox>
                          <mat-checkbox [(ngModel)]="supp.deliveryCadence.mercredi">M</mat-checkbox>
                          <mat-checkbox [(ngModel)]="supp.deliveryCadence.jeudi">J</mat-checkbox>
                          <mat-checkbox [(ngModel)]="supp.deliveryCadence.vendredi">V</mat-checkbox>
                          <mat-checkbox [(ngModel)]="supp.deliveryCadence.samedi">S</mat-checkbox>
                          <mat-checkbox [(ngModel)]="supp.deliveryCadence.dimanche">D</mat-checkbox>
                        </div>
                      </div>
                    </div>
                  </div>
                </ng-container>
              </div>
            </div>
          </div>
        </mat-tab>
        <mat-tab label="Vendable">
          <div class="tab-content">
            <div class="two-columns">
            <div class="section general">
              <div class="section-title">Général</div>
              <div class="form-grid">
                <mat-form-field appearance="outline" floatLabel="always" class="field">
                  <mat-label>Type</mat-label>
                  <mat-select [(ngModel)]="vType">
                    <mat-option value="Permanent">Permanent</mat-option>
                    <mat-option value="Promotionnel">Promotionnel</mat-option>
                    <mat-option value="Catalogue">Catalogue</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline" floatLabel="always" class="field">
                  <mat-label>Typologie de déploiement</mat-label>
                  <mat-select [(ngModel)]="vTypology">
                    <mat-option value="Ouvert">Ouvert</mat-option>
                    <mat-option value="Mixte">Mixte</mat-option>
                    <mat-option value="Fermé">Fermé</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <div class="dates-row">
                <mat-form-field appearance="outline" floatLabel="always" class="field">
                  <mat-label>Date de début</mat-label>
                  <input matInput [matDatepicker]="pickerStartV" [(ngModel)]="vStartDate" placeholder="JJ/MM/AAAA">
                  <mat-datepicker-toggle matSuffix [for]="pickerStartV"></mat-datepicker-toggle>
                  <mat-datepicker #pickerStartV></mat-datepicker>
                </mat-form-field>
                <mat-form-field appearance="outline" floatLabel="always" class="field">
                  <mat-label>Date de fin</mat-label>
                  <input matInput [matDatepicker]="pickerEndV" [(ngModel)]="vEndDate" placeholder="JJ/MM/AAAA">
                  <mat-datepicker-toggle matSuffix [for]="pickerEndV"></mat-datepicker-toggle>
                  <mat-datepicker #pickerEndV></mat-datepicker>
                </mat-form-field>
              </div>
            </div>
            <div class="section vendable-extra">
              <div class="section-title">Cycle de vie</div>
              <div class="dates-stack">
                <mat-form-field appearance="outline" floatLabel="always" class="field">
                  <mat-label>Date de fin d'écoulement</mat-label>
                  <input matInput [matDatepicker]="pickerEcoulementEnd" [(ngModel)]="vEcoulementEndDate" placeholder="JJ/MM/AAAA">
                  <mat-datepicker-toggle matSuffix [for]="pickerEcoulementEnd"></mat-datepicker-toggle>
                  <mat-datepicker #pickerEcoulementEnd></mat-datepicker>
                </mat-form-field>
                <mat-form-field appearance="outline" floatLabel="always" class="field">
                  <mat-label>Date de fin de retour</mat-label>
                  <input matInput [matDatepicker]="pickerRetourEnd" [(ngModel)]="vRetourEndDate" placeholder="JJ/MM/AAAA">
                  <mat-datepicker-toggle matSuffix [for]="pickerRetourEnd"></mat-datepicker-toggle>
                  <mat-datepicker #pickerRetourEnd></mat-datepicker>
                </mat-form-field>
              </div>
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
    .section { display: flex; flex-direction: column; gap: 8px; width: 800px; padding: 12px; border: 1px solid rgba(0,0,0,0.12); border-radius: 8px; box-sizing: border-box; }
    .section-title { font-weight: 600; color: rgba(0,0,0,0.6); }
    h2 mat-icon { vertical-align: middle; margin-right: 8px; }
    .two-columns { display: grid; grid-template-columns: 800px 800px; gap: 16px; align-items: start; }
    .right-col { grid-column: 2; display: flex; flex-direction: column; gap: 16px; }
    .form-grid { display: grid; grid-template-columns: 360px 360px; gap: 12px 16px; }
    .dates-row { display: grid; grid-template-columns: 360px 360px; gap: 12px 16px; }
    .stocks-row { display: grid; grid-template-columns: 360px 360px; gap: 12px 16px; }
    .dates-stack { display: grid; grid-template-columns: 360px; gap: 12px 16px; }
    .form-grid .field { width: 360px; box-sizing: border-box; }
    .dates-row .field { width: 360px; box-sizing: border-box; }
    .stocks-row .field { width: 360px; box-sizing: border-box; }
    .dates-stack .field { width: 360px; box-sizing: border-box; }
    .supplier-grid { display: grid; grid-template-columns: 360px 360px; grid-auto-rows: min-content; gap: 12px 16px; }
    .supplier-grid .field { width: 360px; box-sizing: border-box; }
    .section.supplier { position: relative; }
    .section-actions { position: absolute; top: 8px; right: 8px; display: flex; gap: 8px; align-items: center; }
    .section-create-btn { color: #1565c0; }
    .section-create-btn .mat-icon { color: #1565c0; }
    .section-delete-btn { color: #c62828; }
    .section-delete-btn .mat-icon { color: #c62828; }
    .supplier-cell { grid-column: 1 / span 2; grid-row: 1; }
    .pcb-cell { grid-column: 1; grid-row: 2; }
    .moq-cell { grid-column: 2; grid-row: 2; }
    .cadence-wrap { grid-column: 1 / span 2; grid-row: 3; display: flex; flex-direction: column; gap: 6px; }
    .cadence-title { font-weight: 600; color: rgba(0,0,0,0.6); }
    .cadence-grid { display: flex; flex-direction: row; gap: 8px; align-items: center; }

    .strong-tabs { --mdc-tab-indicator-active-indicator-color: #1565c0; }
    :host ::ng-deep .mat-mdc-tab-group .mat-mdc-tab-header { background: #f6f7fb; border-bottom: 2px solid #e0e0e0; border-radius: 8px 8px 0 0; }
    :host ::ng-deep .mat-mdc-tab-group .mdc-tab { min-width: 220px; margin: 0 8px; border-radius: 16px; }
    :host ::ng-deep .mat-mdc-tab-group .mdc-tab .mdc-tab__text-label { font-size: 14px; font-weight: 600; color: rgba(0,0,0,0.7); }
    :host ::ng-deep .mat-mdc-tab-group .mdc-tab--active { background: #e3f2fd; }
    :host ::ng-deep .mat-mdc-tab-group .mdc-tab--active .mdc-tab__text-label { color: #1565c0; font-weight: 700; }
    `,
  ],
})
export class AssortmentDialogComponent implements OnInit {
  commandable: AssortmentConfig = { subType: '', perimeter: '', trunk: null, level: null, startDate: null, endDate: null };
  vendable: AssortmentConfig = { subType: '', perimeter: '', trunk: null, level: null, startDate: null, endDate: null };
  cmdType: 'Permanent' | 'Promotionnel' | 'Catalogue' = 'Permanent';
  cmdTypology: 'Ouvert' | 'Mixte' | 'Fermé' = 'Fermé';
  cmdStartDate: Date | null = new Date();
  cmdEndDate: Date | null = null;
  vType: 'Permanent' | 'Promotionnel' | 'Catalogue' = 'Permanent';
  vTypology: 'Ouvert' | 'Mixte' | 'Fermé' = 'Fermé';
  vStartDate: Date | null = new Date();
  vEndDate: Date | null = null;
  vReassortEndDate: Date | null = null;
  vEcoulementEndDate: Date | null = null;
  vRetourEndDate: Date | null = null;
  supplierConfigs: SupplierBlock[] = [];
  suppliers: string[] = [];
  cmdStockMin: number = 0;
  cmdStockMax: number = 0;
  cmdStockBackup: number = 0;

  constructor(
    private dialogRef: MatDialogRef<AssortmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssortmentDialogData,
    private dateAdapter: DateAdapter<Date>,
    private masterData: MasterdataService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {
    this.dateAdapter.setLocale('fr-FR');
  }

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
    this.supplierConfigs = [this.newSupplierBlock()];
    this.masterData.getSupplierOptions().subscribe(opts => {
      this.suppliers = opts || [];
    });
  }

  onCancel(): void { this.dialogRef.close(null); }
  filteredSuppliers(term: string): string[] {
    const t = (term || '').toLowerCase();
    return this.suppliers.filter(s => s.toLowerCase().includes(t));
  }
  onSupplierSelected(index: number, value: string): void {
    const supp = this.supplierConfigs[index];
    if (!supp) return;
    supp.selectedSupplier = value;
    supp.supplierSearch = value;
  }
  newSupplierBlock(): SupplierBlock {
    return {
      supplierSearch: '',
      selectedSupplier: '',
      pcb: 0,
      moq: 0,
      deliveryCadence: { lundi: false, mardi: false, mercredi: false, jeudi: false, vendredi: false, samedi: false, dimanche: false },
    };
  }
  addSupplierAt(index: number): void {
    const entry = this.newSupplierBlock();
    this.supplierConfigs.splice(index + 1, 0, entry);
  }

  @ViewChild('confirmDeleteDialog') confirmDeleteDialog!: TemplateRef<any>;
  @ViewChild('cannotDeleteDialog') cannotDeleteDialog!: TemplateRef<any>;
  private confirmRef?: MatDialogRef<any>;
  private cannotRef?: MatDialogRef<any>;
  private pendingDeleteIndex: number | null = null;
  openConfirmDelete(index: number): void {
    if (this.supplierConfigs.length <= 1) {
      this.cannotRef = this.dialog.open(this.cannotDeleteDialog, { width: '420px' });
      return;
    }
    this.pendingDeleteIndex = index;
    this.confirmRef = this.dialog.open(this.confirmDeleteDialog, { width: '420px' });
  }
  closeConfirm(): void {
    this.confirmRef?.close();
    this.confirmRef = undefined;
    this.pendingDeleteIndex = null;
  }
  closeCannot(): void {
    this.cannotRef?.close();
    this.cannotRef = undefined;
  }
  onConfirmDelete(): void {
    if (this.pendingDeleteIndex !== null) {
      this.supplierConfigs.splice(this.pendingDeleteIndex, 1);
    }
    this.closeConfirm();
  }

  toInt(x: any): number {
    const n = Number(x);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.floor(n));
  }
}
