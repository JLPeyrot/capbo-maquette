import { Component, OnInit, ViewChild, TemplateRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
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
  @Input() supplierOnly: boolean = false;
  // État
  isLoading = false;
  articles: SupplierArticle[] = [];
  filtered: SupplierArticle[] = [];
  selectedIds = new Set<string>();

  // Filtres basiques
  search = '';
  fournisseurOptions: string[] = [];
  selectedFournisseur = '';

  // Pagination
  pageSize = 20;
  currentPage = 0;

  // Colonnes
  displayed: string[] = ['select','reference','designation','fournisseur','marque','prixAchat'];

  // CRUD state
  showAddForm = false;
  showSupplierForm = false;
  showArticleForm = false;
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

  newSupplier: {
    code: string;
    name: string;
    email: string;
    phone: string;
    type: 'externe' | 'central' | 'transit';
    state: 'actif' | 'gelé' | 'supprimé';
    nature: 'emballages' | 'marchandises';
    country: string;
    language: string;
    codeFiscal: string;
    numeroTVA: string;
    vatSubject: boolean;
    vatEvent: 'débit' | 'encaissement' | '';
  } = {
    code: '',
    name: '',
    email: '',
    phone: '',
    type: 'externe',
    state: 'gelé',
    nature: 'marchandises',
    country: 'FR',
    language: 'fr',
    codeFiscal: '',
    numeroTVA: '',
    vatSubject: false,
    vatEvent: ''
  };

  newItem: {
    typeArticle: string;
    uniteStock: string;
    uniteFacturation: string;
    natureArticle: string;
    delaiConsommation?: number;
    structureMarchandise?: string;
    codeStatistique?: string;
    codeModele?: string;
    autresCodes?: string;
    caracteristiquesTechniques?: string;
    classeAttributs?: string;
    variantesVente?: string;
    ean13?: string;
    plu?: string;
    ean7?: string;
    codePropre?: string;
    packsKits?: string;
    venteAssistee?: string;
    variantesLogistiques?: string;
    uvc?: string;
    spcb?: string;
    pcb?: string;
    couche?: string;
    palette?: string;
    planPalettisation?: string;
    ulHomogenes?: string;
    ulComplexes?: string;
    recetteFabrication?: string;
    emballages?: string;
  } = {
    typeArticle: '',
    uniteStock: '',
    uniteFacturation: '',
    natureArticle: '',
    delaiConsommation: undefined,
    structureMarchandise: '',
    codeStatistique: '',
    codeModele: '',
    autresCodes: '',
    caracteristiquesTechniques: '',
    classeAttributs: '',
    variantesVente: '',
    ean13: '',
    plu: '',
    ean7: '',
    codePropre: '',
    packsKits: '',
    venteAssistee: '',
    variantesLogistiques: '',
    uvc: '',
    spcb: '',
    pcb: '',
    couche: '',
    palette: '',
    planPalettisation: '',
    ulHomogenes: '',
    ulComplexes: '',
    recetteFabrication: '',
    emballages: ''
  };

  @ViewChild('selectionInfoDialog') selectionInfoDialog!: TemplateRef<any>;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private selectionService: ReferencementSelectionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.supplierOnly) {
      this.showSupplierForm = true;
      this.showArticleForm = false;
      return;
    }
    let pendingFournisseur = '';
    this.route.queryParamMap.subscribe(params => {
      const f = params.get('fournisseur');
      if (f) pendingFournisseur = f;
    });
    this.loadSupplierCatalog(() => {
      if (pendingFournisseur) {
        this.selectedFournisseur = pendingFournisseur;
        this.applyFilters();
      }
    });
  }

  private loadSupplierCatalog(after?: () => void): void {
    this.isLoading = true;
    this.http.get<{articles: PrerefArticle[]}>(`/data/articles-preref.json`).subscribe({
      next: (data) => {
        const raw = Array.isArray(data.articles) ? data.articles : [];
        this.articles = raw.map((a: PrerefArticle) => this.mapPrerefToSupplier(a));
        this.filtered = [...this.articles];
        this.fournisseurOptions = [...new Set(this.articles.map(a => a.fournisseurPrincipal).filter(x => !!x))].sort();
      },
      error: (err) => {
        console.error('Erreur chargement pré-référencement:', err);
        const fallback = this.getDefaultPrerefArticles();
        this.articles = fallback.map((a: PrerefArticle) => this.mapPrerefToSupplier(a));
        this.filtered = [...this.articles];
        this.fournisseurOptions = [...new Set(this.articles.map(a => a.fournisseurPrincipal).filter(x => !!x))].sort();
        this.isLoading = false;
      },
      complete: () => { this.isLoading = false; if (after) after(); }
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
      const matchesFournisseur = !this.selectedFournisseur || a.fournisseurPrincipal === this.selectedFournisseur;
      return matchesSearch && matchesFournisseur;
    });
    this.currentPage = 0;
  }

  resetFilters(): void {
    this.search = '';
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

  createSupplier(): void {
    const { code, name, email, phone, type, state, nature, vatSubject, vatEvent } = this.newSupplier;
    if (!code || !/^[A-Za-z0-9_\-\/]+$/.test(code)) {
      this.snackBar.open('Code fournisseur alphanumérique requis', 'Fermer', { duration: 3000 });
      return;
    }
    if (!name || !email || !phone) {
      this.snackBar.open('Veuillez renseigner Nom, Email et Téléphone', 'Fermer', { duration: 3000 });
      return;
    }
    const emailValid = /.+@.+\..+/.test(email);
    if (!emailValid) {
      this.snackBar.open('Email invalide', 'Fermer', { duration: 3000 });
      return;
    }
    if (!['externe','central','transit'].includes(type)) {
      this.snackBar.open('Type de fournisseur invalide', 'Fermer', { duration: 3000 });
      return;
    }
    if (!['actif','gelé','supprimé'].includes(state)) {
      this.snackBar.open("État de fournisseur invalide", 'Fermer', { duration: 3000 });
      return;
    }
    if (!['emballages','marchandises'].includes(nature)) {
      this.snackBar.open('Nature de fournisseur invalide', 'Fermer', { duration: 3000 });
      return;
    }
    if (vatSubject && !['débit','encaissement'].includes(vatEvent)) {
      this.snackBar.open("Sélectionnez le fait générateur de TVA", 'Fermer', { duration: 3000 });
      return;
    }
    console.log('[Référencement] Nouveau fournisseur créé:', this.newSupplier);
    this.snackBar.open('Fournisseur créé avec succès', 'Fermer', { duration: 3000 });
    this.newSupplier = {
      code: '',
      name: '',
      email: '',
      phone: '',
      type: 'externe',
      state: 'gelé',
      nature: 'marchandises',
      country: 'FR',
      language: 'fr',
      codeFiscal: '',
      numeroTVA: '',
      vatSubject: false,
      vatEvent: ''
    };
    this.showSupplierForm = false;
  }

  createArticle(): void {
    const required = [
      this.newItem.typeArticle,
      this.newItem.uniteStock,
      this.newItem.uniteFacturation,
      this.newItem.natureArticle
    ];
    if (required.some(v => !v)) {
      this.snackBar.open('Veuillez renseigner les champs obligatoires de l’article', 'Fermer', { duration: 3000 });
      return;
    }
    console.log('[Référencement] Nouvel article saisi:', this.newItem);
    this.snackBar.open('Article référencé (brouillon) enregistré', 'Fermer', { duration: 3000 });
    this.newItem = {
      typeArticle: '',
      uniteStock: '',
      uniteFacturation: '',
      natureArticle: '',
      delaiConsommation: undefined,
      structureMarchandise: '',
      codeStatistique: '',
      codeModele: '',
      autresCodes: '',
      caracteristiquesTechniques: '',
      classeAttributs: '',
      variantesVente: '',
      ean13: '',
      plu: '',
      ean7: '',
      codePropre: '',
      packsKits: '',
      venteAssistee: '',
      variantesLogistiques: '',
      uvc: '',
      spcb: '',
      pcb: '',
      couche: '',
      palette: '',
      planPalettisation: '',
      ulHomogenes: '',
      ulComplexes: '',
      recetteFabrication: '',
      emballages: ''
    };
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
  private getDefaultPrerefArticles(): PrerefArticle[] {
    const brands = ['Samsung','EcoWear','TerraCafe','DermaPlus','SoundX','TechPro','MaisonPlus'];
    const suppliers = ['Fournisseur A','Fournisseur B','Fournisseur C'];
    const families = ['Électronique','Textile','Alimentaire','Cosmétique','Maison'];
    const subFamilies: Record<string,string[]> = {
      'Électronique': ['Téléphonie','Audio','Informatique','Objets connectés'],
      'Textile': ['Tops','Bas','Accessoires','Chaussures'],
      'Alimentaire': ['Boissons','Épicerie','Frais','Bio'],
      'Cosmétique': ['Soins visage','Soins corps','Cheveux','Hygiène'],
      'Maison': ['Décoration','Cuisine','Rangement','Linge']
    };
    const origins = ['FR','DE','IT','ES','CN','KR','US'];

    const items: PrerefArticle[] = [];
    for (let i = 1; i <= 30; i++) {
      const fam = families[i % families.length];
      const subs = subFamilies[fam];
      const sousFamille = subs[i % subs.length];
      const marque = brands[i % brands.length];
      const fournisseur = suppliers[i % suppliers.length];
      const base = 10 + (i * 3.7);
      const prixAchat = Number((base).toFixed(2));
      const prixVente = Number((base * (fam === 'Alimentaire' ? 1.25 : 1.35)).toFixed(2));
      const tva = fam === 'Alimentaire' ? 5.5 : 20;
      const ean = '3760' + String(1234567890 + i).slice(0, 10);
      const moq = (i % 7) + 1;
      const delai = (i % 9) + 3;
      const origine = origins[i % origins.length];
      const lib = `${fam === 'Électronique' ? 'Smart' : fam === 'Textile' ? 'T-shirt' : fam === 'Alimentaire' ? 'Produit' : fam === 'Cosmétique' ? 'Soins' : 'Article'} ${marque} ${i}`;

      items.push({
        Code: `PR-${String(i).padStart(3,'0')}`,
        Libellé: lib,
        Marque: marque,
        Fournisseur: fournisseur,
        Famille: fam,
        SousFamille: sousFamille,
        PrixAchatHT: prixAchat,
        PrixVenteTTC: prixVente,
        TVA: tva,
        EAN: ean,
        Conditionnement: 'Pièce',
        MOQ: moq,
        DélaiLivraisonJ: delai,
        Origine: origine,
        Statut: 'Actif'
      });
    }
    return items;
  }
}
