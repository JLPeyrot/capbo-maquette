import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
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
    'select',
    'reference',
    'designation', 
    'famille',
    'marque',
    'stock',
    'prixVente',
    'statut',
    'actions'
  ];

  constructor() {}

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
   * Chargement des articles depuis le fichier JSON
   */
  private loadArticles(): void {
    this.isLoading = true;
    
    // Chargement du fichier JSON
    fetch('/assets/data/articles.json')
      .then(response => response.json())
      .then(data => {
        this.articles = data.articles.map((article: any) => ({
          ...article,
          id: article.code, // Utiliser le code comme ID
          reference: article.code,
          designation: article.libelle,
          famille: article.univers,
          sousFamille: article.sousFamille || article.famille,
          marque: 'Marque générique', // Valeur par défaut
          prixVente: Math.round((Math.random() * 100 + 5) * 100) / 100,
          prixAchat: Math.round((Math.random() * 50 + 2) * 100) / 100,
          stock: Math.floor(Math.random() * 50),
          stockMinimum: Math.floor(Math.random() * 10 + 5),
          statut: (['actif', 'inactif', 'suspendu'] as const)[Math.floor(Math.random() * 3)],
          dateCreation: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          derniereMaj: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          codeEan: `${Math.floor(Math.random() * 1000000000000)}`,
          fournisseurPrincipal: 'Fournisseur principal'
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
      const marque = marques[Math.floor(Math.random() * marques.length)];
      const stock = Math.floor(Math.random() * 50);
      
      return {
        id: `ART-${String(i + 1).padStart(6, '0')}`,
        reference: `REF-${String(i + 1).padStart(3, '0')}`,
        designation: `Article jardinage ${i + 1}`,
        famille,
        sousFamille: 'Sous-famille',
        marque,
        prixVente: Math.round((Math.random() * 100 + 5) * 100) / 100,
        prixAchat: Math.round((Math.random() * 50 + 2) * 100) / 100,
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

      return matchSearch && matchFamille && matchMarque && matchStatut && matchStockFaible;
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