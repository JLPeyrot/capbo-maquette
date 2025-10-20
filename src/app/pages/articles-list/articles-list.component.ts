import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MaterialModule } from '../../shared/material-module';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorIntl } from '@angular/material/paginator';

export interface Article {
  id: string;
  reference: string;
  designationCourte: string;
  designationLongue: string;
  famille: string;
  sousFamille: string;
  prixAchat: number;
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
  statut: string;
  articlesActifs: boolean;
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
  @Input() hideActiveToggle: boolean = false; // NOUVEAU : Masquer la case "Articles actifs uniquement" selon le contexte
  @Output() goBack = new EventEmitter<void>(); // NOUVEAU : Output pour le retour
  @Output() createArticle = new EventEmitter<void>(); // NOUVEAU : Output pour créer un article
  
  private destroy$ = new Subject<void>();

  // États du composant
  isLoading = false;
  selectedArticles: Article[] = [];
  
  // Filtres
  filters: ArticleFilters = {
    search: '',
    famille: '',
    statut: '',
    articlesActifs: false
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
  statutsOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'actif', label: 'Actif' },
    { value: 'inactif', label: 'Inactif' },
    { value: 'suspendu', label: 'Suspendu' }
  ];

  // Colonnes affichées
  displayedColumns: string[] = [
    'select',
    'reference',
    'designationCourte',
    'designationLongue',
    'famille',
    'statut',
    'actions'
  ];

  constructor(private paginatorIntl: MatPaginatorIntl) {
    // Configuration des labels français pour le paginator
    this.paginatorIntl.itemsPerPageLabel = 'Éléments par page :';
    this.paginatorIntl.nextPageLabel = 'Page suivante';
    this.paginatorIntl.previousPageLabel = 'Page précédente';
    this.paginatorIntl.firstPageLabel = 'Première page';
    this.paginatorIntl.lastPageLabel = 'Dernière page';
    this.paginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
      if (length === 0 || pageSize === 0) {
        return `0 sur ${length}`;
      }
      const startIndex = page * pageSize;
      const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
      return `${startIndex + 1} - ${endIndex} sur ${length}`;
    };
  }

  // Lifecycle hooks
  ngOnInit(): void {
    this.loadArticles();
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

  /**
   * Navigation vers la création d'article
   */
  onCreateArticle(): void {
    this.createArticle.emit();
  }

  /**
   * Importer des articles
   */
  onImportArticles(): void {
    console.log('Import articles clicked');
    // TODO: Implémenter la logique d'import
  }

  /**
   * Chargement des articles depuis le fichier JSON
   */
  private loadArticles(): void {
    this.isLoading = true;
    
    // Chargement du fichier JSON
    fetch('/assets/data/botanic-products.json')
      .then(response => response.json())
      .then(data => {
        this.articles = data.articles.map((article: any) => ({
          ...article,
          dateCreation: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          derniereMaj: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        }));
        this.filteredArticles = [...this.articles];
        this.totalArticles = this.articles.length;
        this.extractFilterOptions();
        this.isLoading = false;
      })
      .catch(error => {
        console.error('Erreur lors du chargement des articles:', error);
        // Fallback sur les données générées si le fichier JSON n'est pas trouvé
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
    const familles = ['Plantes fleuries', 'Outils de jardin', 'Graines', 'Terreaux', 'Plantes aromatiques'];
    const marques = ['Botanic Premium', 'Vilmorin', 'Opinel Jardin', 'Or Brun', 'Felco'];
    const statuts: ('actif' | 'inactif' | 'suspendu')[] = ['actif', 'inactif', 'suspendu'];

    return Array.from({ length: 20 }, (_, i) => {
      const famille = familles[Math.floor(Math.random() * familles.length)];
      
      return {
        id: `ART-${String(i + 1).padStart(6, '0')}`,
        reference: `REF-${String(i + 1).padStart(3, '0')}`,
        designationCourte: `Article ${i + 1}`,
        designationLongue: `Article de jardinage complet numéro ${i + 1} avec description détaillée`,
        famille,
        sousFamille: 'Sous-famille',
        prixAchat: Math.round((Math.random() * 50 + 2) * 100) / 100,
        stockMinimum: Math.floor(Math.random() * 15 + 5),
        statut: statuts[Math.floor(Math.random() * statuts.length)],
        dateCreation: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        derniereMaj: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        codeEan: `${Math.floor(Math.random() * 9000000000000) + 1000000000000}`,
        fournisseurPrincipal: `Fournisseur ${Math.floor(Math.random() * 5) + 1}`
      };
    });
  }

  /**
   * Extraction des options pour les filtres
   */
  private extractFilterOptions(): void {
    this.famillesOptions = [...new Set(this.articles.map(a => a.famille))].sort();
  }

  /**
   * Application des filtres
   */
  applyFilters(): void {
    this.filteredArticles = this.articles.filter(article => {
      const matchSearch = !this.filters.search || 
        article.designationCourte.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        article.designationLongue.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        article.reference.toLowerCase().includes(this.filters.search.toLowerCase());
      
      const matchFamille = !this.filters.famille || article.famille === this.filters.famille;
      const matchStatut = !this.filters.statut || article.statut === this.filters.statut;
      const matchArticlesActifs = !this.filters.articlesActifs || article.statut === 'actif';

      return matchSearch && matchFamille && matchStatut && matchArticlesActifs;
    });

    this.totalArticles = this.filteredArticles.length;
    this.currentPage = 0; // Reset à la première page
  }

  /**
   * Reset des filtres
   */
  resetFilters(): void {
    this.filters = {
      search: '',
      famille: '',
      statut: '',
      articlesActifs: false
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