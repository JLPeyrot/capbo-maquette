import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MaterialModule } from '../../shared/material-module';
import { MatCheckboxModule } from '@angular/material/checkbox';

export interface Article {
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
  statut: 'actif' | 'inactif' | 'suspendu';
  dateCreation: Date;
  derniereMaj: Date;
  codeEan: string;
  fournisseurPrincipal: string;
}

export interface ArticleFilters {
  search: string;
  famille: string;
  marque: string;
  statut: string;
  stockFaible: boolean;
}

@Component({
  selector: 'app-articles-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, MatCheckboxModule],
  templateUrl: './articles-list.component.html',
  styleUrls: ['./articles-list.component.scss']
})
export class ArticlesListComponent implements OnInit, OnDestroy {
  @Input() isFocusMode: boolean = false; // NOUVEAU : Input pour le mode focus
  @Input() isStoreContext: boolean = false;
  @Input() theme: 'default' | 'green' = 'default';
  @Output() goBack = new EventEmitter<void>(); // NOUVEAU : Output pour le retour
  
  private destroy$ = new Subject<void>();

  // États du composant
  isLoading = false;
  selectedArticles: Article[] = [];
  
  // Filtres
  filters: ArticleFilters = {
    search: '',
    famille: '',
    marque: '',
    statut: '',
    stockFaible: false
  };

  // Pagination
  pageSize = 25;
  currentPage = 0;
  totalArticles = 0;
  pageSizeOptions = [10, 25, 50, 100];

  // Data
  articles: Article[] = [];
  filteredArticles: Article[] = [];
  
  // Options pour les filtres
  famillesOptions: string[] = [];
  marquesOptions: string[] = [];
  statutsOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'actif', label: 'Actif' },
    { value: 'inactif', label: 'Inactif' },
    { value: 'suspendu', label: 'Suspendu' }
  ];

  // Colonnes affichées
  displayedColumns: string[] = [
    'id',
    'designation',
    'marque',
    'prixAchat',
    'prixVente'
  ];

  viewMode: 'table' | 'list' = 'table';

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Définir les colonnes selon le contexte
    if (this.isStoreContext) {
      this.displayedColumns = ['reference', 'designation', 'marque', 'prixVente'];
      this.viewMode = 'list';
    } else {
      this.displayedColumns = ['select', 'reference', 'designation', 'famille', 'marque', 'stock', 'prixVente', 'statut', 'actions'];
    }
    this.loadArticles();
  }

  setViewMode(mode: 'table' | 'list'): void {
    this.viewMode = mode;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * NOUVEAU : Méthode pour retourner au dashboard
   */
  goBackToDashboard(): void {
    this.goBack.emit();
  }

  navigateToCreateArticle(): void {
    if (this.isStoreContext) {
      this.router.navigate(['/referencement-article']);
    } else {
      this.router.navigate(['/create-article']);
    }
  }

  openArticleForEdit(article: Article): void {
    if (this.isStoreContext) { return; }
    const params = { queryParams: { ref: article.reference, designation: article.designation } };
    this.router.navigate(['/referencement-article'], params);
  }

  modifySelected(): void {
    const first = this.selectedArticles[0];
    if (!first) { return; }
    const params = { queryParams: { ref: first.reference, designation: first.designation } };
    this.router.navigate(['/referencement-article'], params);
  }

  /**
   * Chargement des articles depuis le fichier JSON
   */
  private loadArticles(): void {
    this.isLoading = true;
    if (this.isStoreContext) {
      this.articles = this.generateMockArticles();
      this.articles = this.articles.map(a => ({ ...a, famille: 'Électroménager' }));
      this.filteredArticles = [...this.articles];
      this.totalArticles = this.articles.length;
      this.extractFilterOptions();
      this.isLoading = false;
      return;
    }

    const path = '/data/articles_ref.json';
    fetch(path, { cache: 'no-cache' })
      .then(response => response.ok ? response.text() : Promise.reject(new Error('HTTP ' + response.status)))
      .then(text => {
        let data: any = null;
        try { data = JSON.parse(text); } catch { data = null; }
        if (!data || !Array.isArray(data.articles)) {
          this.articles = this.generateMockArticles();
        } else {
          this.articles = data.articles.map((article: any) => ({
            ...article,
            id: article.code,
            reference: article.code,
            designation: article.libelle,
            famille: article.univers,
            sousFamille: article.sousFamille || article.famille,
            marque: 'Marque générique',
            prixAchat: this.round2(Math.random() * 50 + 5),
            prixVente: 0,
            stock: Math.floor(Math.random() * 50),
            stockMinimum: Math.floor(Math.random() * 10 + 5),
            statut: (['actif', 'inactif', 'suspendu'] as const)[Math.floor(Math.random() * 3)],
            dateCreation: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
            derniereMaj: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            codeEan: `${Math.floor(Math.random() * 1000000000000)}`,
            fournisseurPrincipal: 'Fournisseur principal'
          }));
          this.articles = this.articles.map(a => ({ ...a, prixVente: this.ensureCoherentSale(a.prixAchat, a.prixVente) }));
        }
        this.articles = this.articles.filter(a => this.isElectromenager(a));
        this.filteredArticles = [...this.articles];
        this.totalArticles = this.articles.length;
        this.extractFilterOptions();
        this.isLoading = false;
      })
      .catch(error => {
        this.articles = this.generateMockArticles();
        this.filteredArticles = [...this.articles];
        this.totalArticles = this.articles.length;
        this.extractFilterOptions();
        this.isLoading = false;
      });
  }

  /**
   * Génération d'articles de démonstration (fallback)
   */
  private generateMockArticles(): Article[] {
    const familles = ['Électroménager'];
    const marques = ['Botanic Premium', 'Vilmorin', 'Opinel Jardin', 'Or Brun', 'Felco'];
    const statuts: ('actif' | 'inactif' | 'suspendu')[] = ['actif', 'inactif', 'suspendu'];

    return Array.from({ length: 20 }, (_, i) => {
      const famille = familles[0];
      const marque = marques[Math.floor(Math.random() * marques.length)];
      const stock = Math.floor(Math.random() * 50);
      
      const prixAchat = this.round2(Math.random() * 50 + 5);
      const prixVente = this.ensureCoherentSale(prixAchat, 0);
      return {
        id: `ART-${String(i + 1).padStart(6, '0')}`,
        reference: `REF-${String(i + 1).padStart(3, '0')}`,
        designation: `Électroménager ${i + 1}`,
        famille,
        sousFamille: 'Sous-famille',
        marque,
        prixAchat,
        prixVente,
        stock,
        stockMinimum: Math.floor(Math.random() * 15 + 5),
        statut: statuts[Math.floor(Math.random() * statuts.length)],
        dateCreation: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        derniereMaj: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        codeEan: `${Math.floor(Math.random() * 9000000000000) + 1000000000000}`,
        fournisseurPrincipal: `Fournisseur ${Math.floor(Math.random() * 5) + 1}`
      };
    });
  }

  private readonly MIN_MARGIN = 0.1;
  private readonly DEFAULT_MARGIN = 0.2;
  private round2(v: number): number { return Math.round(v * 100) / 100; }
  private ensureCoherentSale(prixAchat: number, prixVente: number): number {
    const minSale = prixAchat * (1 + this.MIN_MARGIN);
    if (!prixVente || prixVente < minSale) {
      return this.round2(prixAchat * (1 + this.DEFAULT_MARGIN));
    }
    return this.round2(prixVente);
  }

  onPrixAchatChange(article: Article, value: number): void {
    const v = this.round2(Math.max(0, Number(value) || 0));
    article.prixAchat = v;
    article.prixVente = this.ensureCoherentSale(article.prixAchat, article.prixVente);
    this.derniereMajUpdate(article);
  }

  onPrixVenteChange(article: Article, value: number): void {
    let v = this.round2(Math.max(0, Number(value) || 0));
    const minSale = article.prixAchat * (1 + this.MIN_MARGIN);
    if (v < minSale) {
      v = this.round2(minSale);
    }
    article.prixVente = v;
    this.derniereMajUpdate(article);
  }

  private derniereMajUpdate(article: Article): void {
    article.derniereMaj = new Date();
  }

  /**
   * Extraction des options pour les filtres
   */
  private extractFilterOptions(): void {
    this.famillesOptions = [...new Set(this.articles.map(a => a.famille))].sort();
    this.marquesOptions = [...new Set(this.articles.map(a => a.marque))].sort();
  }

  /**
   * Application des filtres
   */
  applyFilters(): void {
    this.filteredArticles = this.articles.filter(article => {
      const matchSearch = !this.filters.search || 
        article.designation.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        article.reference.toLowerCase().includes(this.filters.search.toLowerCase());
      
      const matchFamille = !this.filters.famille || article.famille === this.filters.famille;
      const matchMarque = !this.filters.marque || article.marque === this.filters.marque;
      const matchStatut = !this.filters.statut || article.statut === this.filters.statut;
      const matchStockFaible = !this.filters.stockFaible || article.stock <= article.stockMinimum;

      const contextOk = this.isStoreContext ? true : this.isElectromenager(article);
      return matchSearch && matchFamille && matchMarque && matchStatut && matchStockFaible && contextOk;
    });

    this.totalArticles = this.filteredArticles.length;
    this.currentPage = 0; // Reset à la première page
  }

  private isElectromenager(article: Article): boolean {
    const fam = (article.famille || '').toLowerCase();
    return fam === 'electromenager' || fam === 'électroménager';
  }

  /**
   * Reset des filtres
   */
  resetFilters(): void {
    this.filters = {
      search: '',
      famille: '',
      marque: '',
      statut: '',
      stockFaible: false
    };
    this.applyFilters();
  }

  /**
   * Actions rapides
   */
  openTarifs(article: Article): void {
    console.log('Ouverture tarifs pour:', article.reference);
    // TODO: Implémenter l'ouverture du module tarifs
  }

  openAssortiment(article: Article): void {
    console.log('Ouverture assortiment pour:', article.reference);
    // TODO: Implémenter l'ouverture du module assortiment
  }

  openReassort(article: Article): void {
    console.log('Ouverture réassort pour:', article.reference);
    // TODO: Implémenter l'ouverture du module réassort
  }

  /**
   * Gestion de la sélection
   */
  toggleSelection(article: Article): void {
    const index = this.selectedArticles.findIndex(a => a.id === article.id);
    if (index > -1) {
      this.selectedArticles.splice(index, 1);
    } else {
      this.selectedArticles.push(article);
    }
  }

  isSelected(article: Article): boolean {
    return this.selectedArticles.some(a => a.id === article.id);
  }

  /**
   * Sélection multiple
   */
  toggleAll(): void {
    const visibleArticles = this.getPagedArticles();
    const allSelected = visibleArticles.every(article => this.isSelected(article));
    
    if (allSelected) {
      // Désélectionner tous les articles visibles
      visibleArticles.forEach(article => {
        const index = this.selectedArticles.findIndex(a => a.id === article.id);
        if (index > -1) {
          this.selectedArticles.splice(index, 1);
        }
      });
    } else {
      // Sélectionner tous les articles visibles
      visibleArticles.forEach(article => {
        if (!this.isSelected(article)) {
          this.selectedArticles.push(article);
        }
      });
    }
  }

  /**
   * Articles pour la page courante
   */
  getPagedArticles(): Article[] {
    const startIndex = this.currentPage * this.pageSize;
    return this.filteredArticles.slice(startIndex, startIndex + this.pageSize);
  }

  /**
   * Vérifie si tous les articles de la page sont sélectionnés
   */
  areAllPagedArticlesSelected(): boolean {
    const pagedArticles = this.getPagedArticles();
    return pagedArticles.length > 0 && pagedArticles.every(article => this.isSelected(article));
  }

  /**
   * Vérifie si certains articles de la page sont sélectionnés (pour indeterminate)
   */
  areSomePagedArticlesSelected(): boolean {
    const pagedArticles = this.getPagedArticles();
    return pagedArticles.some(article => this.isSelected(article)) && !this.areAllPagedArticlesSelected();
  }
}
