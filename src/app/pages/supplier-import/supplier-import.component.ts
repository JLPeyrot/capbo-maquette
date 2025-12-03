import { Component, TemplateRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

interface SupplierFile {
  id: string;
  name: string;
  sizeKb: number;
  date: string;
  supplier: string;
}

@Component({
  selector: 'app-supplier-import',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule, HttpClientModule],
  templateUrl: './supplier-import.component.html',
  styleUrls: ['./supplier-import.component.scss']
})
export class SupplierImportComponent implements OnInit {
  files: SupplierFile[] = [];

  importForm: FormGroup;
  selectedFileIds = new Set<string>();
  selectedSupplier = '';
  supplierOptions: { value: string; label: string }[] = [];

  isImporting = false;
  progress = 0; // 0-100 global progress

  // Logs & metrics
  currentFileName = '';
  currentProcessed = 0;
  currentRejected = 0;
  totalValidated = 0;
  totalRejected = 0;
  logLines: string[] = [];
  validatedEvents: string[] = [];
  rejectedEvents: string[] = [];
  private errorMessages: string[] = [
    'erreur de type',
    'aucune donnée',
    'structure incorrecte',
    'valeur hors plage',
    'EAN invalide',
    'format date invalide'
  ];

  private importTimer?: any;
  private lineTimer?: any;

  constructor(private fb: FormBuilder, private dialog: MatDialog, private http: HttpClient, private router: Router) {
    this.importForm = this.fb.group({});
    this.supplierOptions = [];
  }

  ngOnInit(): void {
    // Charger la liste des fichiers fournisseurs fictifs
    this.http.get<{ files: SupplierFile[] }>(`/data/supplier-files/index.json`).subscribe({
      next: (data) => {
        const list = Array.isArray((data as any).files) ? (data as any).files : [];
        this.files = list;
        // Limiter explicitement aux 4 fournisseurs demandés et présents dans les fichiers
        this.refreshSupplierOptions();
        if (!this.supplierOptions.find(o => o.value === this.selectedSupplier)) this.selectedSupplier = '';
      },
      error: () => {},
      complete: () => {}
    });
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
    this.validatedEvents = [];
    this.rejectedEvents = [];

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
        const batch = Math.min(perTick, totalLines - this.currentProcessed);
        this.currentProcessed += batch;
        const rejects = Math.random() < 0.1 ? Math.floor(batch * 0.2) : 0;
        this.currentRejected += rejects;
        this.totalValidated += batch - rejects;
        this.totalRejected += rejects;

        const base = Math.max(1, this.currentProcessed - batch + 1);
        const rejectedIdx = new Set<number>();
        while (rejectedIdx.size < rejects && batch > 0) {
          rejectedIdx.add(Math.floor(Math.random() * batch));
        }

        for (let j = 0; j < batch; j++) {
          if (!rejectedIdx.has(j)) {
            const line = base + j;
            this.validatedEvents.push(`Ligne ${line} — ajouté`);
          }
        }

        if (rejects > 0) {
          const detailsCount = Math.min(3, rejects);
          const rejectedArr = Array.from(rejectedIdx).sort((a, b) => a - b);
          for (let k = 0; k < detailsCount; k++) {
            const idx = rejectedArr[k] !== undefined ? rejectedArr[k] : Math.floor(Math.random() * Math.max(1, batch));
            const line = base + idx;
            const col = 1 + Math.floor(Math.random() * 30);
            const msg = this.errorMessages[Math.floor(Math.random() * this.errorMessages.length)];
            this.rejectedEvents.push(`Ligne ${line} - Col ${col} ${msg}`);
          }
        }

        // Avancement global basé sur progression du fichier courant et position
        const fileProgress = this.currentProcessed / totalLines;
        const globalProgress = ((index - 1) + fileProgress) / selected.length;
        this.progress = Math.floor(globalProgress * 100);

        if (this.currentProcessed >= totalLines) {
          clearInterval(this.lineTimer);
          this.logLines.push(`Terminé: ${file.name} — Traité: ${this.currentProcessed}, Rejets: ${this.currentRejected}`);
          if (this.currentRejected > 0) {
            const extraDetails = Math.min(5, this.currentRejected);
            for (let k = 0; k < extraDetails; k++) {
              const line = 1 + Math.floor(Math.random() * Math.max(1, this.currentProcessed));
              const col = 1 + Math.floor(Math.random() * 30);
              const msg = this.errorMessages[Math.floor(Math.random() * this.errorMessages.length)];
              this.rejectedEvents.push(`Ligne ${line} - Col ${col} ${msg}`);
            }
          }
          setTimeout(processNext, 400);
        }
      }, 120);
    };

    processNext();
  }

  get visibleFiles(): SupplierFile[] {
    if (!this.selectedSupplier) return [];
    return this.files.filter(f => f.supplier === this.selectedSupplier);
  }

  onSupplierChange(val: string): void {
    this.selectedSupplier = val || '';
    this.selectedFileIds.clear();
  }

  goToReferencement(): void {
    const params: any = {};
    if (this.selectedSupplier) params.fournisseur = this.selectedSupplier;
    this.router.navigate(['/referencement'], { queryParams: params });
  }

  private finishImport(): void {
    this.progress = 100;
    this.isImporting = false;
    this.logLines.push(`Import terminé — Validations totales: ${this.totalValidated}, Rejets totaux: ${this.totalRejected}`);
    this.currentFileName = '';
    this.dialog.open(this.importResultDialog, { width: '480px' });
  }

  

  private estimateLines(file: SupplierFile): number {
    return Math.max(100, Math.floor(file.sizeKb * 1.8));
  }

  @ViewChild('importResultDialog') importResultDialog!: TemplateRef<any>;

  private refreshSupplierOptions(): void {
    const allowed = new Set<string>([
      'Samsung France',
      'BSH Électroménager',
      'Philips Domestic',
      'TCL Europe'
    ]);
    const uniq = Array.from(new Set(this.files.map(f => f.supplier).filter(x => !!x))).sort();
    const filtered = uniq.filter(s => allowed.has(s));
    this.supplierOptions = filtered.map(s => ({ value: s, label: s }));
  }

  onLocalFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
    // Simulation d’un fichier Bosch (BSH)
    const simulated: SupplierFile = {
      id: `local-bosch-${Date.now()}`,
      name: file ? file.name : 'bosch-products.csv',
      sizeKb: file ? Math.max(10, Math.floor(file.size / 1024)) : 512,
      date: dateStr,
      supplier: 'BSH Électroménager'
    };
    this.files = [simulated, ...this.files];
    this.refreshSupplierOptions();
    this.selectedSupplier = 'BSH Électroménager';
    this.selectedFileIds.clear();
    this.selectedFileIds.add(simulated.id);
  }
}
