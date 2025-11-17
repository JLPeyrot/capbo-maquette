import { Component, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { MatDialog } from '@angular/material/dialog';

interface SupplierFile {
  id: string;
  name: string;
  sizeKb: number;
  date: string;
}

@Component({
  selector: 'app-supplier-import',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './supplier-import.component.html',
  styleUrls: ['./supplier-import.component.scss']
})
export class SupplierImportComponent {
  files: SupplierFile[] = [
    { id: 'f001', name: 'catalogue_fournisseur_A.csv', sizeKb: 842, date: '2025-11-05' },
    { id: 'f002', name: 'catalogue_fournisseur_B.xlsx', sizeKb: 1260, date: '2025-11-10' },
    { id: 'f003', name: 'catalogue_fournisseur_C.csv', sizeKb: 560, date: '2025-11-12' }
  ];

  importForm: FormGroup;
  selectedFileIds = new Set<string>();

  isImporting = false;
  progress = 0; // 0-100 global progress

  // Logs & metrics
  currentFileName = '';
  currentProcessed = 0;
  currentRejected = 0;
  totalValidated = 0;
  totalRejected = 0;
  logLines: string[] = [];

  private importTimer?: any;
  private lineTimer?: any;

  constructor(private fb: FormBuilder, private dialog: MatDialog) {
    this.importForm = this.fb.group({});
  }

  toggleSelection(id: string): void {
    if (this.selectedFileIds.has(id)) {
      this.selectedFileIds.delete(id);
    } else {
      this.selectedFileIds.add(id);
    }
  }

  startImport(): void {
    if (this.isImporting || this.selectedFileIds.size === 0) return;
    this.isImporting = true;
    this.progress = 0;
    this.totalValidated = 0;
    this.totalRejected = 0;
    this.logLines = [];

    const selected = this.files.filter(f => this.selectedFileIds.has(f.id));
    let index = 0;

    const processNext = () => {
      if (index >= selected.length) {
        this.finishImport();
        return;
      }

      const file = selected[index++];
      this.currentFileName = file.name;
      this.currentProcessed = 0;
      this.currentRejected = 0;
      const totalLines = this.estimateLines(file);
      const perTick = Math.max(1, Math.floor(totalLines / 50));

      this.logLines.push(`Début import: ${file.name} (${totalLines} lignes estimées)`);

      this.lineTimer = setInterval(() => {
        // Simuler traitement
        const batch = Math.min(perTick, totalLines - this.currentProcessed);
        this.currentProcessed += batch;
        const rejects = Math.random() < 0.1 ? Math.floor(batch * 0.2) : 0; // ~10% des ticks génèrent des rejets
        this.currentRejected += rejects;
        this.totalValidated += batch - rejects;
        this.totalRejected += rejects;

        // Avancement global basé sur progression du fichier courant et position
        const fileProgress = this.currentProcessed / totalLines;
        const globalProgress = ((index - 1) + fileProgress) / selected.length;
        this.progress = Math.floor(globalProgress * 100);

        if (this.currentProcessed >= totalLines) {
          clearInterval(this.lineTimer);
          this.logLines.push(`Terminé: ${file.name} — Traité: ${this.currentProcessed}, Rejets: ${this.currentRejected}`);
          setTimeout(processNext, 400);
        }
      }, 120);
    };

    processNext();
  }

  private finishImport(): void {
    this.progress = 100;
    this.isImporting = false;
    this.logLines.push(`Import terminé — Validations totales: ${this.totalValidated}, Rejets totaux: ${this.totalRejected}`);
    this.currentFileName = '';
    this.dialog.open(this.importResultDialog, { width: '480px' });
  }

  cancelImport(): void {
    if (!this.isImporting) return;
    this.isImporting = false;
    if (this.lineTimer) clearInterval(this.lineTimer);
    if (this.importTimer) clearInterval(this.importTimer);
    this.logLines.push('Import annulé par l’utilisateur');
  }

  private estimateLines(file: SupplierFile): number {
    return Math.max(100, Math.floor(file.sizeKb * 1.8));
  }

  @ViewChild('importResultDialog') importResultDialog!: TemplateRef<any>;
}
