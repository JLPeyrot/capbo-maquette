import { Component, OnInit, ViewChild, TemplateRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { TextboxList1Component } from '../../components/textbox-list1/textbox-list1.component';
import { TextboxList2Component } from '../../components/textbox-list2/textbox-list2.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { ArticleDetailsDialogComponent } from './article-details-dialog.component';
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
  imports: [CommonModule, FormsModule, MaterialModule, MatCheckboxModule, HttpClientModule, TextboxList1Component, TextboxList2Component],
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
  selectedRightIds = new Set<string>();
  movedIdsRight = new Set<string>();
  assignedIds = new Set<string>();

  merchTree: Record<string, string[]> = {};
  familiesByUnivers: Record<string, string[]> = {};
  merchTreeUnivers: string[] = [];
  selectedMerchNodeLeft?: { univers: string; famille?: string; sousFamille?: string };
  selectedMerchNodeRight?: { univers: string; famille?: string; sousFamille?: string };
  expandedUniversLeft = new Set<string>();
  expandedFamiliesLeft = new Set<string>();
  expandedUniversRight = new Set<string>();
  expandedFamiliesRight = new Set<string>();

  // Filtres basiques
  search = '';
  fournisseurOptions: string[] = [];
  selectedFournisseur = '';
  vendable = false;
  commandable = false;

  // Pagination
  pageSizeLeft = 30;
  pageSizeRight = 30;
  currentPageLeft = 0;
  currentPageRight = 0;

  // Colonnes
  displayed: string[] = ['select','reference','designation','fournisseur','marque','prixAchat','prixVente','statut','actions'];

  // CRUD state
  showAddForm = false;
  showSupplierForm = false;
  showArticleForm = false;
  editingCode: string | null = null;
  editDesignation = '';
  editPrixVente: number = 0;
  editPrixAchat: number = 0;
  editStatut = '';

  listItemsLeft: { id: string; code: string; designation: string; state?: 'brouillon' | 'référencé'; enseignes?: string[] }[] = [];
  listItemsRight: { id: string; code: string; designation: string; state?: 'brouillon' | 'référencé'; enseignes?: string[] }[] = [];
  private listItemsRightSource: { id: string; code: string; designation: string; state?: 'brouillon' | 'référencé'; enseignes?: string[] }[] = [];
  private rightNodeLists: Record<string, { id: string; code: string; designation: string; state?: 'brouillon' | 'référencé'; enseignes?: string[] }[]> = {};

  private getRightNodeKey(univers?: string, famille?: string, sousFamille?: string): string {
    return [univers || '', famille || '', sousFamille || ''].join('|');
  }

  private seedRightListFor(label: string): { id: string; code: string; designation: string; state?: 'brouillon' | 'référencé'; enseignes?: string[] }[] {
    const slug = String(label || 'Article').replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'GEN';
    const out: { id: string; code: string; designation: string; state?: 'brouillon' | 'référencé'; enseignes?: string[] }[] = [];
    for (let i = 1; i <= 5; i++) {
      const seq = String(i).padStart(3, '0');
      out.push({ id: `SEED-${slug}-${seq}`, code: `${slug}-${seq}`, designation: `${label} ${seq}`, state: 'référencé', enseignes: this.randomEnseignes() });
    }
    return out;
  }

  private randomEnseignes(): string[] {
    const r = Math.floor(Math.random() * 3);
    if (r === 0) return ['Boulanger'];
    if (r === 1) return ['Electrodépot'];
    return ['Boulanger','Electrodépot'];
  }

  private seedRightListForNode(univers?: string, famille?: string, sousFamille?: string): { id: string; code: string; designation: string; state?: 'brouillon' | 'référencé'; enseignes?: string[] }[] {
    if (sousFamille) {
      return this.seedRightListFor(String(sousFamille));
    }
    if (famille) {
      const sous = this.merchTree[famille] || [];
      if (sous.length) {
        return sous.flatMap(sf => this.seedRightListFor(String(sf)));
      }
      return this.seedRightListFor(String(famille));
    }
    if (univers) {
      const fams = this.familiesByUnivers[univers] || [];
      const sousAll = fams.flatMap(f => this.merchTree[f] || []);
      if (sousAll.length) {
        return sousAll.flatMap(sf => this.seedRightListFor(String(sf)));
      }
      return this.seedRightListFor(String(univers));
    }
    return this.seedRightListFor('Article');
  }

  getEnseigneTags(it: { enseignes?: string[] }): string[] {
    const map: Record<string, string> = { 'Boulanger': 'BL', 'Electrodépot': 'ED' };
    const tags = (it.enseignes || []).map(e => map[e]).filter(t => !!t);
    return Array.from(new Set(tags));
  }
  leftFilterText: string = '';
  rightFilterText: string = '';

  // Sélection de l'enseigne cible
  targetEnseigneOptions: string[] = ['Boulanger','Electrodépot'];
  selectedTargetEnseignes: string[] = [];

  // Panneau gauche: ajout fournisseurs
  showAddSupplierLeft = false;
  leftSuppliers: string[] = [];
  suppliersExpandedLeft = new Set<string>();

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
  @ViewChild('enregistrerConfirmDialog') enregistrerConfirmDialog!: TemplateRef<any>;
  @ViewChild('targetEnseigneDialog') targetEnseigneDialog!: TemplateRef<any>;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private selectionService: ReferencementSelectionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.buildMerchTree();
    if (this.supplierOnly) {
      this.showSupplierForm = true;
      this.showArticleForm = false;
      return;
    }
    // liste centrale alimentée après chargement
    let pendingFournisseur = '';
    this.route.queryParamMap.subscribe(params => {
      const f = params.get('fournisseur');
      if (f) pendingFournisseur = f;
    });
    this.loadSupplierCatalog(() => {
      if (pendingFournisseur) {
        if (!this.fournisseurOptions.includes(pendingFournisseur)) {
          this.fournisseurOptions = [...this.fournisseurOptions, pendingFournisseur].sort();
        }
        this.selectedFournisseur = pendingFournisseur;
      }
      this.showAddSupplierLeft = true;
      this.applyFilters();
      // Ne pas pré-remplir les listes au chargement
    });
  }

  get availableLeftSuppliers(): string[] {
    return this.fournisseurOptions.filter(opt => !this.leftSuppliers.includes(opt));
  }

  addLeftSupplier(name: string): void {
    if (!name) { this.showAddSupplierLeft = false; return; }
    if (name === '__ALL__') {
      const toAdd = this.availableLeftSuppliers;
      for (const s of toAdd) {
        if (!this.leftSuppliers.includes(s)) {
          this.leftSuppliers.push(s);
          this.suppliersExpandedLeft.add(s);
        }
      }
      this.showAddSupplierLeft = false;
      return;
    }
    if (!this.leftSuppliers.includes(name)) {
      this.leftSuppliers.push(name);
      this.suppliersExpandedLeft.add(name);
    }
    this.showAddSupplierLeft = false;
  }

  toggleSupplierLeft(name: string): void {
    if (this.suppliersExpandedLeft.has(name)) this.suppliersExpandedLeft.delete(name);
    else this.suppliersExpandedLeft.add(name);
  }

  private buildListItemsFor(side: 'left' | 'right', univers?: string, famille?: string, sousFamille?: string): void {
    const term = (side === 'left' ? this.leftFilterText : this.rightFilterText).trim().toLowerCase();

    if (side === 'right') {
      const key = this.getRightNodeKey(univers, famille, sousFamille);
      if (!this.rightNodeLists[key]) {
        this.rightNodeLists[key] = this.seedRightListForNode(univers, famille, sousFamille);
      }
      this.listItemsRightSource = this.rightNodeLists[key].slice();
      const filtered = term
        ? this.listItemsRightSource.filter(it => it.designation.toLowerCase().includes(term) || it.code.toLowerCase().includes(term))
        : this.listItemsRightSource;
      this.listItemsRight = filtered;
      return;
    }

    // ====== côté gauche inchangé ======
    let srcList = this.filtered.filter(a => !this.assignedIds.has(a.id));
    if (term) {
      srcList = srcList.filter(a => a.designation.toLowerCase().includes(term) || a.reference.toLowerCase().includes(term));
    }
    if (sousFamille) {
      srcList = srcList.filter(a => a.sousFamille === sousFamille);
    } else if (famille) {
      srcList = srcList.filter(a => a.famille === famille);
    } else if (univers) {
      srcList = srcList.filter(a => a.famille === univers || a.sousFamille === univers);
    } else {
      if (term) {
        const outNoContext: { id: string; code: string; designation: string; state?: 'brouillon' | 'référencé' }[] = [];
        const capNoContext = 60;
        for (let i = 0; i < Math.min(capNoContext, srcList.length); i++) {
          const src = srcList[i];
          outNoContext.push({ id: src.id, code: `FOURN-${String(i + 1).padStart(4, '0')}`, designation: src.designation, state: 'brouillon' });
        }
        this.listItemsLeft = outNoContext;
        return;
      }
      this.listItemsLeft = [];
      return;
    }
    const out: { id: string; code: string; designation: string; state?: 'brouillon' | 'référencé' }[] = [];
    const isFamilyOrSous = !!famille || !!sousFamille;
    if (isFamilyOrSous) {
      const targetSous: string[] = sousFamille ? [sousFamille] : (this.merchTree[famille || ''] || Array.from(new Set(srcList.map(a => a.sousFamille))));
      for (const sous of targetSous) {
        const group = srcList.filter(a => a.sousFamille === sous);
        const count = 3 + Math.floor(Math.random() * 5);
        for (let i = 0; i < count; i++) {
          const seq = String(i + 1).padStart(3, '0');
          if (i < group.length) {
            const src = group[i];
            out.push({ id: src.id, code: `FOURN-${String(out.length + 1).padStart(4, '0')}`, designation: `${sous} ${seq}`, state: 'brouillon' });
          } else {
            const slug = String(sous || 'GEN').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            out.push({ id: `GEN-LEFT-${slug}-${seq}`, code: `FOURN-${String(out.length + 1).padStart(4, '0')}`, designation: `${sous || 'Article'} ${seq}`, state: 'brouillon' });
          }
        }
      }
    } else {
      const cap = 60;
      for (let i = 0; i < Math.min(cap, srcList.length); i++) {
        const src = srcList[i];
        out.push({ id: src.id, code: `FOURN-${String(out.length + 1).padStart(4, '0')}`, designation: src.designation, state: 'brouillon' });
      }
    }
    if (term) {
      const t = term;
      const filteredOut = out.filter(it => it.designation.toLowerCase().includes(t) || it.code.toLowerCase().includes(t));
      this.listItemsLeft = filteredOut;
      return;
    }
    if (univers || famille || sousFamille) {
      const ctx = String(sousFamille || famille || univers || 'Article');
      const slug = ctx.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'GEN';
      const minCount = 100;
      let i = out.length;
      while (i < minCount) {
        const seq = String(i + 1).padStart(3, '0');
        out.push({ id: `GEN-LEFT-${slug}-${seq}`, code: `FOURN-${String(i + 1).padStart(4, '0')}`, designation: `${ctx} ${seq}`, state: 'brouillon' });
        i++;
      }
    }
    this.listItemsLeft = out;
  }

  onFilterLeftChange(val: string): void {
    this.leftFilterText = val;
    this.currentPageLeft = 0;
    const sel = this.selectedMerchNodeLeft;
    this.buildListItemsFor('left', sel?.univers, sel?.famille, sel?.sousFamille);
  }

  onFilterRightChange(val: string): void {
    this.rightFilterText = val;
    this.currentPageRight = 0;
    const sel = this.selectedMerchNodeRight;
    this.buildListItemsFor('right', sel?.univers, sel?.famille, sel?.sousFamille);
  }

  private buildMerchTree(): void {
    this.http.get<{ familles: { univers: string; familles: { code: string; libelle: string; sousFamilles: string[] }[] }[] }>(`/data/familles.json`)
      .subscribe(json => {
        const universBlocks = Array.isArray(json?.familles) ? json.familles : [];
        const universNames: string[] = [];
        const familiesByUnivers: Record<string, string[]> = {};
        const sousByFamily: Record<string, string[]> = {};

        for (const block of universBlocks) {
          const universName = String(block.univers);
          universNames.push(universName);
          const fams = Array.isArray(block.familles) ? block.familles : [];
          const famNames: string[] = [];
          for (const f of fams) {
            const famName = String(f.libelle);
            famNames.push(famName);
            const sous = Array.isArray(f.sousFamilles) ? f.sousFamilles.slice() : [];
            sousByFamily[famName] = sous;
          }
          familiesByUnivers[universName] = famNames.sort((a, b) => a.localeCompare(b));
        }

        const uniqUnivers = Array.from(new Set(universNames)).sort((a, b) => a.localeCompare(b));
        this.merchTreeUnivers = uniqUnivers;
        this.familiesByUnivers = familiesByUnivers;
        this.merchTree = sousByFamily;
      });
  }

  isUniversExpandedLeft(univers: string): boolean { return this.expandedUniversLeft.has(univers); }
  isUniversExpandedRight(univers: string): boolean { return this.expandedUniversRight.has(univers); }
  isFamilyExpandedLeft(famille: string): boolean { return this.expandedFamiliesLeft.has(famille); }
  isFamilyExpandedRight(famille: string): boolean { return this.expandedFamiliesRight.has(famille); }

  toggleUniversLeft(univers: string, event?: MouseEvent): void {
    if (event) { event.stopPropagation(); }
    if (this.expandedUniversLeft.has(univers)) this.expandedUniversLeft.delete(univers);
    else this.expandedUniversLeft.add(univers);
  }

  toggleUniversRight(univers: string, event?: MouseEvent): void {
    if (event) { event.stopPropagation(); }
    if (this.expandedUniversRight.has(univers)) this.expandedUniversRight.delete(univers);
    else this.expandedUniversRight.add(univers);
  }

  toggleFamilyLeft(famille: string, event?: MouseEvent): void {
    if (event) { event.stopPropagation(); }
    if (this.expandedFamiliesLeft.has(famille)) this.expandedFamiliesLeft.delete(famille);
    else this.expandedFamiliesLeft.add(famille);
  }

  toggleFamilyRight(famille: string, event?: MouseEvent): void {
    if (event) { event.stopPropagation(); }
    if (this.expandedFamiliesRight.has(famille)) this.expandedFamiliesRight.delete(famille);
    else this.expandedFamiliesRight.add(famille);
  }

  onSelectMerchNodeLeft(univers: string, famille?: string, sousFamille?: string): void {
    this.selectedMerchNodeLeft = { univers, famille, sousFamille };
    this.buildListItemsFor('left', univers, famille, sousFamille);
  }

  onSelectMerchNodeRight(univers: string, famille?: string, sousFamille?: string): void {
    this.selectedMerchNodeRight = { univers, famille, sousFamille };
    this.buildListItemsFor('right', univers, famille, sousFamille);
  }

  private updateExcelForSelection(univers?: string, famille?: string, sousFamille?: string): void {
    this.buildListItemsFor('left', univers, famille, sousFamille);
    this.buildListItemsFor('right', univers, famille, sousFamille);
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
      const matchesVendable = !this.vendable || a.statut === 'Actif';
      const matchesCommandable = !this.commandable || a.stockMinimum > 0;
      return matchesSearch && matchesFournisseur && matchesVendable && matchesCommandable;
    });
    this.currentPageLeft = 0;
    this.currentPageRight = 0;
    if (this.selectedMerchNodeLeft) {
      this.buildListItemsFor('left', this.selectedMerchNodeLeft.univers, this.selectedMerchNodeLeft.famille, this.selectedMerchNodeLeft.sousFamille);
    } else { this.listItemsLeft = []; }
    if (this.selectedMerchNodeRight) {
      this.buildListItemsFor('right', this.selectedMerchNodeRight.univers, this.selectedMerchNodeRight.famille, this.selectedMerchNodeRight.sousFamille);
    } else { this.listItemsRight = []; }
  }

  resetFilters(): void {
    this.search = '';
    this.selectedFournisseur = '';
    this.vendable = false;
    this.commandable = false;
    this.applyFilters();
  }

  

  areAllPagedSelected(): boolean { return this.areAllPagedSelectedLeft(); }
  areAllPagedSelectedLeft(): boolean {
    const ids = this.listItemsLeft.map(it => it.id);
    return ids.length > 0 && ids.every(id => this.selectedIds.has(id));
  }

  areSomePagedSelected(): boolean { return this.areSomePagedSelectedLeft(); }
  areSomePagedSelectedLeft(): boolean {
    const ids = this.listItemsLeft.map(it => it.id);
    return ids.some(id => this.selectedIds.has(id)) && !this.areAllPagedSelectedLeft();
  }

  areAllPagedSelectedRight(): boolean {
    const start = this.currentPageRight * this.pageSizeRight;
    const p = this.listItemsRight.slice(start, start + this.pageSizeRight).filter(a => this.movedIdsRight.has(a.id));
    return p.length > 0 && p.every(a => this.selectedRightIds.has(a.id));
  }

  areSomePagedSelectedRight(): boolean {
    const start = this.currentPageRight * this.pageSizeRight;
    const p = this.listItemsRight.slice(start, start + this.pageSizeRight).filter(a => this.movedIdsRight.has(a.id));
    return p.some(a => this.selectedRightIds.has(a.id)) && !this.areAllPagedSelectedRight();
  }

  toggleAll(): void { this.toggleAllLeft(); }
  toggleAllLeft(): void {
    const ids = this.listItemsLeft.map(it => it.id);
    const allSelected = ids.length > 0 && ids.every(id => this.selectedIds.has(id));
    if (allSelected) { ids.forEach(id => this.selectedIds.delete(id)); }
    else { ids.forEach(id => this.selectedIds.add(id)); }
  }

  toggleAllRight(): void {
    const start = this.currentPageRight * this.pageSizeRight;
    const ids = this.listItemsRight.slice(start, start + this.pageSizeRight).map(it => it.id).filter(id => this.movedIdsRight.has(id));
    const allSelected = ids.length > 0 && ids.every(id => this.selectedRightIds.has(id));
    if (allSelected) { ids.forEach(id => this.selectedRightIds.delete(id)); }
    else { ids.forEach(id => this.selectedRightIds.add(id)); }
  }

  prevPageLeft(): void {
    this.currentPageLeft = Math.max(0, this.currentPageLeft - 1);
  }

  nextPageLeft(): void {
    const hasNext = (this.currentPageLeft + 1) * this.pageSizeLeft < this.listItemsLeft.length;
    if (hasNext) this.currentPageLeft += 1;
  }

  firstPageLeft(): void {
    this.currentPageLeft = 0;
  }

  lastPageLeft(): void {
    const last = Math.max(0, Math.floor((this.listItemsLeft.length - 1) / this.pageSizeLeft));
    this.currentPageLeft = last;
  }

  prevPageRight(): void {
    this.currentPageRight = Math.max(0, this.currentPageRight - 1);
  }

  nextPageRight(): void {
    const hasNext = (this.currentPageRight + 1) * this.pageSizeRight < this.listItemsRight.length;
    if (hasNext) this.currentPageRight += 1;
  }

  firstPageRight(): void {
    this.currentPageRight = 0;
  }

  lastPageRight(): void {
    const last = Math.max(0, Math.floor((this.listItemsRight.length - 1) / this.pageSizeRight));
    this.currentPageRight = last;
  }

  toggleSelection(article: { id: string } | SupplierArticle): void {
    if (this.selectedIds.has(article.id)) this.selectedIds.delete(article.id);
    else this.selectedIds.add(article.id);
  }

  toggleSelectionRight(it: { id: string }): void {
    if (!this.movedIdsRight.has(it.id)) return;
    if (this.selectedRightIds.has(it.id)) this.selectedRightIds.delete(it.id);
    else this.selectedRightIds.add(it.id);
  }

  isMovedRight(id: string): boolean { return this.movedIdsRight.has(id); }
  isRightItemSelectable(id: string): boolean { return this.movedIdsRight.has(id); }

  onReferencerSelection(): void {
    const count = this.selectedIds.size;
    console.log(`[Référencement] ${count} article(s) sélectionné(s):`, Array.from(this.selectedIds));
    // Popup d'information
    this.dialog.open(this.selectionInfoDialog, { width: '420px' });
    // TODO: intégrer API de référencement si besoin
  }

  onEnregistrer(): void {
    if (this.movedIdsRight.size === 0) return;
    this.dialog.open(this.enregistrerConfirmDialog, { width: '420px' });
  }

  confirmEnregistrer(): void {
    const ids = Array.from(this.movedIdsRight);
    this.listItemsRight = this.listItemsRight.map(it => ids.includes(it.id) ? { ...it, state: 'référencé' as const } : it);
    ids.forEach(id => this.selectedRightIds.delete(id));
    this.movedIdsRight.clear();
    this.snackBar.open(`${ids.length} article(s) enregistré(s)`, 'OK', { duration: 3000 });
  }

  viewDetails(it: { id: string; code: string; designation: string }): void {
    const art = this.articles.find(a => a.id === it.id) || this.filtered.find(a => a.id === it.id);
    const rayon = 'Cuisine';
    const famille = 'Electromenager';
    const sousFamille = 'Petit-Electromenager';
    const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();
    const supplierCode = `SUP-${randomPart}`;
    const supplierRef = `${it.code}`;
    const purchasePriceHT = art?.prixAchat ?? 0;
    const deliveryLeadDays = 3 + Math.floor(Math.random() * 12);
    const moq = 1 + Math.floor(Math.random() * 10);
    const supplierPackaging = 'Carton de 12';
    const salePriceTTC = art?.prixVente ?? 0;
    const marginPercent = salePriceTTC > 0 ? ((salePriceTTC - purchasePriceHT) / salePriceTTC) * 100 : 0;
    const activeStatus = (art?.statut || '').toLowerCase() === 'actif' ? 'Actif' : 'Inactif';
    const unitSale = 'Pièce';
    const discounts = '—';
    const stockAvailable = art?.stock ?? 0;
    const stockMinimum = art?.stockMinimum ?? 0;
    const location = 'Magasin A / Entrepôt Central';
    const weightKg: number | null = null;
    const volumeL: number | null = null;
    const dimensions = '—';
    const lotManagement = 'Non';
    const barcode = art?.codeEan || '';
    const secondarySupplier = 'Fournisseur B';
    this.dialog.open(ArticleDetailsDialogComponent, {
      width: '1040px',
      height: '460px',
      data: {
        id: it.id,
        code: it.code,
        designation: it.designation,
        supplierCode,
        internalCode: art?.reference || it.code,
        designationShort: art?.designation || it.designation,
        designationLong: art?.designation || it.designation,
        rayon,
        famille,
        sousFamille,
        supplierPrincipal: art?.fournisseurPrincipal || 'Fournisseur A',
        supplierRef,
        purchasePriceHT,
        deliveryLeadDays,
        moq,
        supplierPackaging,
        salePriceTTC,
        marginPercent,
        category: rayon,
        activeStatus,
        unitSale,
        discounts,
        stockAvailable,
        stockMinimum,
        location,
        weightKg,
        volumeL,
        dimensions,
        lotManagement,
        barcode,
        secondarySupplier
      }
    });
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

  openTargetEnseigneDialog(): void {
    this.dialog.closeAll();
    this.selectedTargetEnseignes = [];
    this.dialog.open(this.targetEnseigneDialog, { width: '420px' });
  }

  confirmTargetEnseigne(): void {
    if (!this.selectedTargetEnseignes.length) {
      this.snackBar.open("Veuillez sélectionner l'enseigne cible", 'Fermer', { duration: 3000 });
      return;
    }
    this.confirmReferencer();
  }

  confirmReferencer(): void {
    if (!this.selectedMerchNodeRight?.sousFamille) {
      this.snackBar.open('Aucune sous-famille sélectionnée — référence en brouillon', 'OK', { duration: 3000 });
    }
    const ids = Array.from(this.selectedIds);
    this.assignedIds = new Set([...this.assignedIds, ...ids]);
    const movedFromLeft = this.listItemsLeft
      .filter(it => ids.includes(it.id))
      .map(it => ({ ...it, state: 'brouillon' as const, enseignes: (this.selectedTargetEnseignes.length ? [...this.selectedTargetEnseignes] : (it.enseignes || [])) }));

    const key = this.getRightNodeKey(this.selectedMerchNodeRight?.univers, this.selectedMerchNodeRight?.famille, this.selectedMerchNodeRight?.sousFamille);
    const existingList = this.rightNodeLists[key] || [];
    const updatedExisting = existingList.map(it => ids.includes(it.id) ? { ...it, state: 'brouillon' as const, enseignes: (this.selectedTargetEnseignes.length ? [...this.selectedTargetEnseignes] : (it.enseignes || [])) } : it);

    const combined = [...movedFromLeft, ...updatedExisting];
    const seen = new Set<string>();
    const deduped: { id: string; code: string; designation: string; state?: 'brouillon' | 'référencé'; enseignes?: string[] }[] = [];
    for (const it of combined) {
      if (!seen.has(it.id)) { seen.add(it.id); deduped.push(it); }
    }
    this.rightNodeLists[key] = deduped;
    this.listItemsRightSource = deduped;
    const term = (this.rightFilterText || '').trim().toLowerCase();
    const filtered = term
      ? deduped.filter(it => it.designation.toLowerCase().includes(term) || it.code.toLowerCase().includes(term))
      : deduped;
    this.listItemsRight = filtered;

    // Retirer de la liste gauche
    this.listItemsLeft = this.listItemsLeft.filter(it => !ids.includes(it.id));

    // Marquer tous les référencés comme déplacés à droite pour surlignage
    ids.forEach(id => this.movedIdsRight.add(id));

    this.selectedIds.clear();
    this.dialog.closeAll();
    const ens = this.selectedTargetEnseignes.length ? ` vers ${this.selectedTargetEnseignes.join(', ')}` : '';
    this.snackBar.open(`${ids.length} article(s) référencé(s)${ens}`, 'OK', { duration: 3000 });
  }

  

  // Pagination helpers: gérés par liste gauche/droite

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
      PrixVenteTTC: this.editPrixVente,
      PrixAchatHT: this.editPrixAchat,
      Statut: this.editStatut
    };
    this.http.put(`/api/preref-articles/${encodeURIComponent(this.editingCode)}`, payload).subscribe({
      next: (updated: any) => {
        // Mettre à jour localement
        const idx = this.articles.findIndex(x => x.reference === this.editingCode);
        if (idx !== -1) {
          this.articles[idx] = {
            ...this.articles[idx],
            designation: this.editDesignation,
            prixVente: this.editPrixVente,
            prixAchat: this.editPrixAchat,
            statut: this.editStatut
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
