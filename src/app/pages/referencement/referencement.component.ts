import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ReferencementSelectionService, SelectedArticleSummary } from './referencement-selection.service';

interface SupplierArticle {
  id: string;
  reference: string;
  designation: string;
  famille: string;
  sousFamille: string;
  marque: string;
  prixVente: number;
  prixAchat: number;
  stock: number;
  stockMinimum: number;
  statut: string;
  codeEan: string;
  fournisseurPrincipal: string;
}

interface PrerefArticle {
  Code: string;
  Libellé: string;
  Marque?: string;
  Fournisseur?: string;
  Famille?: string;
  SousFamille?: string;
  PrixAchatHT?: number;
  PrixVenteTTC?: number;
  TVA?: number;
  EAN?: string;
  Conditionnement?: string;
  MOQ?: number;
  DélaiLivraisonJ?: number;
  Origine?: string;
  Statut?: string;
}

@Component({
  selector: 'app-referencement',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, MatCheckboxModule, HttpClientModule],
  templateUrl: './referencement.component.html',
  styleUrls: ['./referencement.component.scss']
})
export class ReferencementComponent implements OnInit {
  // État
  isLoading = false;
  articles: SupplierArticle[] = [];
  filtered: SupplierArticle[] = [];
  selectedIds = new Set<string>();

  // Filtres basiques
  search = '';
  familleOptions: string[] = [];
  selectedFamille = '';
  fournisseurOptions: string[] = [];
  selectedFournisseur = '';

  // Pagination
  pageSize = 20;
  currentPage = 0;

  // Colonnes
  displayed: string[] = ['select','reference','designation','fournisseur','marque','famille','prixAchat'];

  // CRUD state
  showAddForm = false;
  editingCode: string | null = null;
  editDesignation = '';
  editPrixVente: number = 0;
  editPrixAchat: number = 0;
  editStatut = '';

  // Add form
  newArticle: PrerefArticle = {
    Code: '',
    Libellé: '',
    Marque: '',
    Fournisseur: '',
    Famille: '',
    SousFamille: '',
    PrixAchatHT: 0,
    PrixVenteTTC: 0,
    TVA: 20,
    EAN: '',
    Conditionnement: 'Pièce',
    MOQ: 1,
    DélaiLivraisonJ: 5,
    Origine: '',
    Statut: 'Actif'
  };

  @ViewChild('selectionInfoDialog') selectionInfoDialog!: TemplateRef<any>;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private router: Router,
    private selectionService: ReferencementSelectionService
  ) {}

  ngOnInit(): void {
    this.loadSupplierCatalog();
  }

  private loadSupplierCatalog(): void {
    this.isLoading = true;
    this.http.get<{articles: PrerefArticle[]}>(`/api/preref-articles`).subscribe({
      next: (data) => {
        const raw = Array.isArray(data.articles) ? data.articles : [];
        this.articles = raw.map((a: PrerefArticle) => this.mapPrerefToSupplier(a));
        this.filtered = [...this.articles];
        this.familleOptions = [...new Set(this.articles.map(a => a.famille))].sort();
        this.fournisseurOptions = [...new Set(this.articles.map(a => a.fournisseurPrincipal).filter(x => !!x))].sort();
      },
      error: (err) => {
        console.error('Erreur chargement pré-référencement:', err);
        this.articles = [];
        this.filtered = [];
      },
      complete: () => this.isLoading = false
    });
  }

  private mapPrerefToSupplier(a: PrerefArticle): SupplierArticle {
    return {
      id: a.Code,
      reference: a.Code,
      designation: a.Libellé,
      famille: a.Famille || '',
      sousFamille: a.SousFamille || '',
      marque: a.Marque || '—',
      prixVente: a.PrixVenteTTC ?? 0,
      prixAchat: a.PrixAchatHT ?? 0,
      stock: 0,
      stockMinimum: a.MOQ ?? 1,
      statut: a.Statut || 'Actif',
      codeEan: a.EAN || '',
      fournisseurPrincipal: a.Fournisseur || ''
    };
  }

  applyFilters(): void {
    const term = this.search.trim().toLowerCase();
    this.filtered = this.articles.filter(a => {
      const matchesSearch = !term ||
        a.reference.toLowerCase().includes(term) ||
        a.designation.toLowerCase().includes(term) ||
        a.codeEan.toLowerCase().includes(term);
      const matchesFamille = !this.selectedFamille || a.famille === this.selectedFamille;
      const matchesFournisseur = !this.selectedFournisseur || a.fournisseurPrincipal === this.selectedFournisseur;
      return matchesSearch && matchesFamille && matchesFournisseur;
    });
    this.currentPage = 0;
  }

  resetFilters(): void {
    this.search = '';
    this.selectedFamille = '';
    this.selectedFournisseur = '';
    this.applyFilters();
  }

  get paged(): SupplierArticle[] {
    const start = this.currentPage * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  areAllPagedSelected(): boolean {
    const p = this.paged;
    return p.length > 0 && p.every(a => this.selectedIds.has(a.id));
  }

  areSomePagedSelected(): boolean {
    const p = this.paged;
    return p.some(a => this.selectedIds.has(a.id)) && !this.areAllPagedSelected();
  }

  toggleAll(): void {
    const p = this.paged;
    const allSelected = this.areAllPagedSelected();
    if (allSelected) {
      p.forEach(a => this.selectedIds.delete(a.id));
    } else {
      p.forEach(a => this.selectedIds.add(a.id));
    }
  }

  toggleSelection(article: SupplierArticle): void {
    if (this.selectedIds.has(article.id)) this.selectedIds.delete(article.id);
    else this.selectedIds.add(article.id);
  }

  onReferencerSelection(): void {
    const count = this.selectedIds.size;
    console.log(`[Référencement] ${count} article(s) sélectionné(s):`, Array.from(this.selectedIds));
    // Popup d'information
    this.dialog.open(this.selectionInfoDialog, { width: '420px' });
    // TODO: intégrer API de référencement si besoin
  }

  confirmReferencer(): void {
    const ids = Array.from(this.selectedIds);
    const summaries: SelectedArticleSummary[] = this.articles
      .filter(a => ids.includes(a.id))
      .map(a => ({
        id: a.id,
        reference: a.reference,
        designation: a.designation,
        fournisseur: a.fournisseurPrincipal,
        marque: a.marque,
        famille: a.famille,
        prixAchat: a.prixAchat
      }));

    this.selectionService.setSelection(summaries);
    this.dialog.closeAll();
    this.router.navigateByUrl('/referencement/review');
  }

  // Pagination helpers
  prevPage(): void {
    this.currentPage = Math.max(0, this.currentPage - 1);
  }

  nextPage(): void {
    const hasNext = (this.currentPage + 1) * this.pageSize < this.filtered.length;
    if (hasNext) this.currentPage += 1;
  }

  // ===== CRUD Methods =====
  startEdit(a: SupplierArticle): void {
    this.editingCode = a.reference;
    this.editDesignation = a.designation;
    this.editPrixVente = a.prixVente;
    this.editPrixAchat = a.prixAchat;
    this.editStatut = a.statut;
  }

  cancelEdit(): void {
    this.editingCode = null;
    this.editDesignation = '';
    this.editPrixVente = 0;
    this.editPrixAchat = 0;
    this.editStatut = '';
  }

  saveEdit(a: SupplierArticle): void {
    if (!this.editingCode) return;
    const payload: Partial<PrerefArticle> = {
      Libellé: this.editDesignation,
      PrixVenteTTC: this.editPrixVente
    };
    this.http.put(`/api/preref-articles/${encodeURIComponent(this.editingCode)}`, payload).subscribe({
      next: (updated: any) => {
        // Mettre à jour localement
        const idx = this.articles.findIndex(x => x.reference === this.editingCode);
        if (idx !== -1) {
          this.articles[idx] = {
            ...this.articles[idx],
            designation: this.editDesignation,
            prixVente: this.editPrixVente
          };
          this.applyFilters();
        }
        this.cancelEdit();
      },
      error: (err) => console.error('Erreur mise à jour:', err)
    });
  }

  deleteArticle(a: SupplierArticle): void {
    if (!confirm(`Supprimer l'article ${a.reference} ?`)) return;
    this.http.delete(`/api/preref-articles/${encodeURIComponent(a.reference)}`).subscribe({
      next: () => {
        this.articles = this.articles.filter(x => x.reference !== a.reference);
        this.applyFilters();
      },
      error: (err) => console.error('Erreur suppression:', err)
    });
  }

  addArticle(): void {
    if (!this.newArticle.Code || !this.newArticle.Libellé) return;
    this.http.post(`/api/preref-articles`, this.newArticle).subscribe({
      next: (created: any) => {
        const sup = this.mapPrerefToSupplier(created as PrerefArticle);
        this.articles.unshift(sup);
        this.applyFilters();
        this.showAddForm = false;
        this.newArticle = {
          Code: '', Libellé: '', Marque: '', Fournisseur: '', Famille: '', SousFamille: '', PrixAchatHT: 0, PrixVenteTTC: 0, TVA: 20, EAN: '', Conditionnement: 'Pièce', MOQ: 1, DélaiLivraisonJ: 5, Origine: '', Statut: 'Actif'
        };
      },
      error: (err) => console.error('Erreur création:', err)
    });
  }
}
