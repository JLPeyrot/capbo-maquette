import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { TreeViewComponent } from '../../components/tree-view/tree-view.component';
import { TrunkHierarchyNode, TreeViewConfig, TreeNodeAction } from '../../interfaces/trunk-hierarchy.interface';
import { ArticlesService, Article } from '../../services/articles.service';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-trunk-control',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, TreeViewComponent],
  templateUrl: './trunk-control.component.html',
  styleUrls: ['./trunk-control.component.scss']
})
export class TrunkControlComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  hierarchyNodes: TrunkHierarchyNode[] = [];
  selectedNodeIds: string[] = [];
  selectedNode: TrunkHierarchyNode | null = null;
  filteredArticles: Article[] = [];
  allArticles: Article[] = []; // Tous les articles chargés initialement
  currentFilter: { univers?: string; famille?: string; sousFamille?: string } | null = null;
  searchQuery: string = '';
  isLoading: boolean = true;
  selectedArticles: Set<string> = new Set(); // Pour stocker les codes des articles sélectionnés
  selectAll: boolean = false;
  viewMode: 'list' | 'grid' = 'grid'; // Mode d'affichage par défaut
  trunkName: string = 'TRONC ACTUEL'; // Nom du tronc, par défaut "TRONC ACTUEL"

  treeConfig: TreeViewConfig = {
    showIcons: true,
    showArticleCount: true,
    allowMultipleSelection: false,
    expandOnClick: true,
    expandOnSelect: true,
    multiSelect: false
  };

  constructor(
    private articlesService: ArticlesService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Récupérer le nom du tronc depuis les paramètres de route
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['trunkName']) {
        this.trunkName = decodeURIComponent(params['trunkName']);
        // Mettre à jour le nom du tronc dans le service
        this.articlesService.setTrunkName(this.trunkName);
      }
    });
    
    this.loadHierarchy();
    this.loadAllArticles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge la hiérarchie des rayons
   */
  private loadHierarchy(): void {
    this.articlesService.getHierarchy()
      .pipe(takeUntil(this.destroy$))
      .subscribe(hierarchy => {
        this.hierarchyNodes = hierarchy;
        this.isLoading = false;
      });
  }

  /**
   * Charge tous les articles au démarrage
   */
  private loadAllArticles(): void {
    this.articlesService.getArticles()
      .pipe(takeUntil(this.destroy$))
      .subscribe(articles => {
        this.allArticles = articles;
        this.filteredArticles = [...articles]; // Afficher tous les articles par défaut
        this.updateSelectAllState();
      });
  }

  /**
   * Gestion des actions sur les nœuds de l'arbre
   */
  onNodeAction(action: TreeNodeAction): void {
    console.log('Action sur le nœud:', action);
    
    switch (action.action) {
      case 'select':
        this.onNodeSelect(action.node);
        break;
      case 'expand':
        // L'expansion est gérée automatiquement par le composant tree-view
        break;
      case 'collapse':
        // La réduction est gérée automatiquement par le composant tree-view
        break;
    }
  }

  /**
   * Gestion de la sélection d'un nœud
   */
  onNodeSelect(node: TrunkHierarchyNode): void {
    this.selectedNode = node;
    this.selectedNodeIds = [node.id];
    this.applyFilterForNode(node);
  }

  /**
   * Applique le filtre pour un nœud sélectionné
   */
  private applyFilterForNode(node: TrunkHierarchyNode): void {
    // Utiliser directement les noms du nœud et de ses parents au lieu de parser l'ID
    if (node.type === 'department') {
      this.currentFilter = { univers: node.name };
    } else if (node.type === 'family') {
      // Pour une famille, on doit trouver l'univers parent
      const universParent = this.findParentUnivers(node);
      this.currentFilter = { 
        univers: universParent?.name || '', 
        famille: node.name 
      };
    } else if (node.type === 'sub-family') {
      // Pour une sous-famille, on doit trouver l'univers et la famille parents
      const parents = this.findParentHierarchy(node);
      this.currentFilter = { 
        univers: parents.univers?.name || '', 
        famille: parents.famille?.name || '', 
        sousFamille: node.name 
      };
    } else {
      this.currentFilter = null;
    }
    
    this.applyCurrentFilter();
  }

  /**
   * Trouve le nœud univers parent d'un nœud famille
   */
  private findParentUnivers(familleNode: TrunkHierarchyNode): TrunkHierarchyNode | null {
    for (const rootNode of this.hierarchyNodes) {
      if (rootNode.children) {
        for (const universNode of rootNode.children) {
          if (universNode.children) {
            for (const famille of universNode.children) {
              if (famille.id === familleNode.id) {
                return universNode;
              }
            }
          }
        }
      }
    }
    return null;
  }

  /**
   * Trouve la hiérarchie complète des parents d'un nœud sous-famille
   */
  private findParentHierarchy(sousFamilleNode: TrunkHierarchyNode): { univers: TrunkHierarchyNode | null, famille: TrunkHierarchyNode | null } {
    for (const rootNode of this.hierarchyNodes) {
      if (rootNode.children) {
        for (const universNode of rootNode.children) {
          if (universNode.children) {
            for (const familleNode of universNode.children) {
              if (familleNode.children) {
                for (const sousFamille of familleNode.children) {
                  if (sousFamille.id === sousFamilleNode.id) {
                    return { univers: universNode, famille: familleNode };
                  }
                }
              }
            }
          }
        }
      }
    }
    return { univers: null, famille: null };
  }

  /**
   * Applique le filtre actuel sur tous les articles
   */
  private applyCurrentFilter(): void {
    if (!this.currentFilter) {
      this.filteredArticles = [...this.allArticles];
    } else {
      this.filteredArticles = this.allArticles.filter(article => {
        // Filtrer par univers
        if (this.currentFilter!.univers && article.univers !== this.currentFilter!.univers) {
          return false;
        }
        
        // Filtrer par famille si spécifiée
        if (this.currentFilter!.famille && article.famille !== this.currentFilter!.famille) {
          return false;
        }
        
        // Filtrer par sous-famille si spécifiée
        if (this.currentFilter!.sousFamille && article.sousFamille !== this.currentFilter!.sousFamille) {
          return false;
        }
        
        return true;
      });
    }
    
    this.updateSelectAllState();
  }



  /**
   * Recherche d'articles
   */
  onSearchArticles(): void {
    if (this.searchQuery.trim()) {
      // Appliquer la recherche sur les articles filtrés actuels
      const searchTerm = this.searchQuery.toLowerCase();
      this.filteredArticles = this.getFilteredArticlesByHierarchy().filter(article =>
        article.libelle.toLowerCase().includes(searchTerm) ||
        article.code.toLowerCase().includes(searchTerm) ||
        article.univers.toLowerCase().includes(searchTerm) ||
        article.famille.toLowerCase().includes(searchTerm) ||
        (article.sousFamille && article.sousFamille.toLowerCase().includes(searchTerm))
      );
    } else {
      // Si pas de recherche, appliquer seulement le filtre hiérarchique
      this.applyCurrentFilter();
    }
    this.updateSelectAllState();
  }

  /**
   * Efface la recherche
   */
  clearSearch(): void {
    this.searchQuery = '';
    this.applyCurrentFilter();
  }

  /**
   * Obtient les articles filtrés par la hiérarchie (sans la recherche textuelle)
   */
  private getFilteredArticlesByHierarchy(): Article[] {
    if (!this.currentFilter) {
      return [...this.allArticles];
    }
    
    return this.allArticles.filter(article => {
      // Filtrer par univers
      if (this.currentFilter!.univers && article.univers !== this.currentFilter!.univers) {
        return false;
      }
      
      // Filtrer par famille si spécifiée
      if (this.currentFilter!.famille && article.famille !== this.currentFilter!.famille) {
        return false;
      }
      
      // Filtrer par sous-famille si spécifiée
      if (this.currentFilter!.sousFamille && article.sousFamille !== this.currentFilter!.sousFamille) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Actions sur les articles
   */
  addArticle(): void {
    console.log('Ajouter un article');
    // TODO: Implémenter l'ajout d'article
  }

  importExport(): void {
    console.log('Importer/Exporter');
    // TODO: Implémenter l'import/export
  }

  /**
   * Gère la sélection/désélection d'un article
   */
  onArticleSelect(articleCode: string, isSelected: boolean): void {
    if (isSelected) {
      this.selectedArticles.add(articleCode);
    } else {
      this.selectedArticles.delete(articleCode);
    }
    
    // Met à jour l'état "Tout sélectionner"
    this.updateSelectAllState();
  }

  /**
   * Vérifie si un article est sélectionné
   */
  isArticleSelected(articleCode: string): boolean {
    return this.selectedArticles.has(articleCode);
  }

  /**
   * Gère la sélection/désélection de tous les articles
   */
  onSelectAll(selectAll: boolean): void {
    this.selectAll = selectAll;
    
    if (selectAll) {
      // Sélectionner tous les articles visibles
      this.filteredArticles.forEach(article => {
        this.selectedArticles.add(article.code);
      });
    } else {
      // Désélectionner tous les articles visibles
      this.filteredArticles.forEach(article => {
        this.selectedArticles.delete(article.code);
      });
    }
  }

  /**
   * Met à jour l'état du checkbox "Tout sélectionner"
   */
  private updateSelectAllState(): void {
    const visibleArticleCodes = this.filteredArticles.map(article => article.code);
    const selectedVisibleArticles = visibleArticleCodes.filter(code => this.selectedArticles.has(code));
    
    this.selectAll = selectedVisibleArticles.length === visibleArticleCodes.length && visibleArticleCodes.length > 0;
  }

  /**
   * Retourne le nombre d'articles sélectionnés
   */
  getSelectedCount(): number {
    return this.selectedArticles.size;
  }

  /**
   * Obtient les articles sélectionnés
   */
  getSelectedArticles(): Article[] {
    return this.filteredArticles.filter(article => this.selectedArticles.has(article.code));
  }

  /**
   * Obtient le texte du filtre actif pour l'affichage
   */
  getActiveFilterText(): string {
    if (!this.currentFilter) {
      return 'Tous les articles';
    }

    let filterText = '';
    if (this.currentFilter.univers) {
      filterText = this.currentFilter.univers;
    }
    if (this.currentFilter.famille) {
      filterText += ` > ${this.currentFilter.famille}`;
    }
    if (this.currentFilter.sousFamille) {
      filterText += ` > ${this.currentFilter.sousFamille}`;
    }

    return filterText;
  }

  /**
   * Vérifie si un filtre est actif
   */
  hasActiveFilter(): boolean {
    return this.currentFilter !== null;
  }

  /**
   * Bascule vers la vue grille
   */
  setGridView(): void {
    this.viewMode = 'grid';
  }

  /**
   * Bascule vers la vue liste
   */
  setListView(): void {
    this.viewMode = 'list';
  }

  /**
   * Vérifie si le mode actuel est la vue grille
   */
  isGridView(): boolean {
    return this.viewMode === 'grid';
  }

  /**
   * Vérifie si le mode actuel est la vue liste
   */
  isListView(): boolean {
    return this.viewMode === 'list';
  }

  /**
   * Remet à zéro le filtre pour afficher tous les articles
   */
  resetFilter(): void {
    this.currentFilter = null;
    this.filteredArticles = [...this.allArticles];
    this.selectedNode = null;
    this.selectedNodeIds = [];
  }

  /**
   * Calcule le nombre d'articles sélectionnés pour une sous-famille donnée
   */
  getSelectedCountForSousFamille(sousFamilleName: string): number {
    const sousFamilleArticles = this.allArticles.filter(article => 
      article.sousFamille === sousFamilleName
    );
    
    return sousFamilleArticles.filter(article => 
      this.selectedArticles.has(article.code)
    ).length;
  }

  /**
   * Calcule le nombre d'articles sélectionnés pour une famille donnée (somme de toutes ses sous-familles)
   */
  getSelectedCountForFamille(familleName: string): number {
    const familleArticles = this.allArticles.filter(article => 
      article.famille === familleName
    );
    
    return familleArticles.filter(article => 
      this.selectedArticles.has(article.code)
    ).length;
  }

  /**
   * Calcule le nombre d'articles sélectionnés pour un univers donné (somme de toutes ses familles)
   */
  getSelectedCountForUnivers(universName: string): number {
    const universArticles = this.allArticles.filter(article => 
      article.univers === universName
    );
    
    return universArticles.filter(article => 
      this.selectedArticles.has(article.code)
    ).length;
  }

  /**
   * Détermine le nombre d'articles sélectionnés pour un nœud donné selon son type
   */
  getSelectedCountForNode(node: TrunkHierarchyNode): number {
    switch (node.type) {
      case 'trunk':
        // Pour le nœud racine "TRONC ACTUEL", retourner le total des articles sélectionnés
        return this.selectedArticles.size;
      case 'sub-family':
        return this.getSelectedCountForSousFamille(node.name);
      case 'family':
        return this.getSelectedCountForFamille(node.name);
      case 'department':
        return this.getSelectedCountForUnivers(node.name);
      default:
        return 0;
    }
  }
}