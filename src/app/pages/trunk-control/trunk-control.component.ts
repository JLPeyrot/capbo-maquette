import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { TreeViewComponent } from '../../components/tree-view/tree-view.component';
import { TrunkHierarchyNode, TreeViewConfig, TreeNodeAction } from '../../interfaces/trunk-hierarchy.interface';
import { ArticlesService, Article } from '../../services/articles.service';
import { ActivatedRoute } from '@angular/router';
import { TrunksService, TrunkOption } from '../../services/trunks.service';
import { combineLatest } from 'rxjs';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { AddToTrunkDialogComponent } from '../assortments-bulk-management/add-to-trunk-dialog.component';
import { ConfirmAddToTrunkDialogComponent } from '../assortments-bulk-management/confirm-add-to-trunk-dialog.component';
import { EditAttributesDialogComponent } from '../assortments-bulk-management/edit-attributes-dialog.component';
import { ConfirmAttributesDialogComponent } from '../assortments-bulk-management/confirm-attributes-dialog.component';

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
  trunkId?: string; // Identifiant du tronc sélectionné
  // Interface bulk: flags et mapping
  showAssignedOnly: boolean = false;
  showOnlyAssigned: boolean = false;
  trunkNameById: Record<string, string> = {};

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
    private trunksService: TrunksService,
    private route: ActivatedRoute,
    private dialog: MatDialog
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
    
    this.initTrunkData();

    // Charger le mapping des noms de troncs pour affichage des pills
    this.trunksService.getTrunkOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe((options: TrunkOption[]) => {
        const map: Record<string, string> = {};
        options.forEach(opt => { map[opt.id] = opt.name; });
        this.trunkNameById = map;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialise les données du tronc: identifiant, articles filtrés et hiérarchie dérivée
   */
  private initTrunkData(): void {
    combineLatest([
      this.trunksService.getTrunks(),
      this.articlesService.getArticles()
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([trunks, articles]) => {
        // Trouver le tronc par nom (insensible à la casse)
        const match = trunks.find(t => t.name.toLowerCase() === this.trunkName.toLowerCase());
        this.trunkId = match?.id;

        // Filtrer les articles rattachés à ce tronc (si trouvé), sinon aucun
        const trunkArticles = this.trunkId 
          ? articles.filter(a => a.trunkId === this.trunkId)
          : [];

        // Mettre à jour les listes d'articles
        this.allArticles = trunkArticles;
        this.filteredArticles = [...trunkArticles];

        // Construire la hiérarchie dérivée basée sur les articles du tronc
        this.hierarchyNodes = this.buildHierarchyFor(this.allArticles, this.trunkName);
        this.isLoading = false;
        this.updateSelectAllState();
      });
  }

  /**
   * Construit une hiérarchie à partir d'une liste d'articles et d'un nom de tronc
   */
  private buildHierarchyFor(articles: Article[], trunkDisplayName: string): TrunkHierarchyNode[] {
    const hierarchy: TrunkHierarchyNode[] = [];

    const trunkRoot: TrunkHierarchyNode = {
      id: 'trunk-root',
      name: trunkDisplayName,
      type: 'trunk',
      level: 0,
      children: []
    };

    const universByName = new Map<string, Article[]>();
    for (const a of articles) {
      const key = a.univers || '';
      universByName.set(key, [...(universByName.get(key) || []), a]);
    }

    universByName.forEach((universArticles, universName) => {
      const universNode: TrunkHierarchyNode = {
        id: `univers-${universName.toLowerCase().replace(/\s+/g, '-')}`,
        name: universName,
        type: 'department',
        level: 1,
        articlesCount: universArticles.length,
        children: []
      };

      const famillesByName = new Map<string, Article[]>();
      for (const a of universArticles) {
        const key = a.famille || '';
        famillesByName.set(key, [...(famillesByName.get(key) || []), a]);
      }

      famillesByName.forEach((familleArticles, familleName) => {
        const familleNode: TrunkHierarchyNode = {
          id: `famille-${universName.toLowerCase().replace(/\s+/g, '-')}-${familleName.toLowerCase().replace(/\s+/g, '-')}`,
          name: familleName,
          type: 'family',
          level: 2,
          articlesCount: familleArticles.length,
          children: []
        };

        const sousFamillesByName = new Map<string, Article[]>();
        for (const a of familleArticles) {
          const key = a.sousFamille || '';
          sousFamillesByName.set(key, [...(sousFamillesByName.get(key) || []), a]);
        }

        sousFamillesByName.forEach((sousFamilleArticles, sousFamilleName) => {
          const sousFamilleNode: TrunkHierarchyNode = {
            id: `sous-famille-${universName.toLowerCase().replace(/\s+/g, '-')}-${familleName.toLowerCase().replace(/\s+/g, '-')}-${sousFamilleName.toLowerCase().replace(/\s+/g, '-')}`,
            name: sousFamilleName,
            type: 'sub-family',
            level: 3,
            articlesCount: sousFamilleArticles.length
          };
          familleNode.children!.push(sousFamilleNode);
        });

        // Trier les sous-familles
        familleNode.children!.sort((a, b) => a.name.localeCompare(b.name));
        universNode.children!.push(familleNode);
      });

      // Trier les familles
      universNode.children!.sort((a, b) => a.name.localeCompare(b.name));
      trunkRoot.children!.push(universNode);
    });

    // Trier les univers
    trunkRoot.children!.sort((a, b) => a.name.localeCompare(b.name));

    hierarchy.push(trunkRoot);
    return hierarchy;
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
   * Met à jour la liste filtrée (arborescence + recherche) pour l'interface bulk
   * Dans le contexte tronc, allArticles est déjà limité au tronc courant.
   */
  private updateFilteredArticles(): void {
    // Base: filtre hiérarchique
    const base = this.getFilteredArticlesByHierarchy();
    const term = this.searchQuery.trim().toLowerCase();
    if (!term) {
      this.filteredArticles = base;
    } else {
      this.filteredArticles = base.filter(a =>
        a.libelle.toLowerCase().includes(term) ||
        a.code.toLowerCase().includes(term) ||
        a.univers.toLowerCase().includes(term) ||
        a.famille.toLowerCase().includes(term) ||
        (a.sousFamille || '').toLowerCase().includes(term)
      );
    }
    this.updateSelectAllState();
  }

  applySearch(): void {
    this.updateFilteredArticles();
  }

  toggleShowAssignedOnly(): void {
    // Sans effet ici (déjà sur un tronc), mais nécessaire pour la parité UI
    this.updateFilteredArticles();
  }

  toggleShowOnlyAssigned(): void {
    // Sans effet ici (déjà sur un tronc), mais nécessaire pour la parité UI
    this.updateFilteredArticles();
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

  // Interface bulk: bascule sélection globale
  toggleSelectAll(): void {
    this.onSelectAll(!this.selectAll);
    this.updateSelectAllState();
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
    // Parité avec bulk: compter seulement les visibles sélectionnés
    return this.filteredArticles.filter(a => this.selectedArticles.has(a.code)).length;
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
        // Pour le nœud racine, retourner le total des visibles sélectionnés
        return this.getSelectedCount();
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

  /**
   * Actions de la sidebar droite (parité avec l'interface bulk)
   */
  onAddToTrunk(): void {
    const dialogRef = this.dialog.open(AddToTrunkDialogComponent, {
      width: '460px',
      data: { selectedCount: this.selectedArticles.size }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const { trunkId, trunkName, trunkType, level, levelLabel } = result;
        const selectedCount = this.getSelectedCount();
        this.dialog.open(ConfirmAddToTrunkDialogComponent, {
          width: '520px',
          data: { selectedCount, trunkName, trunkType, level, levelLabel }
        }).afterClosed().subscribe(confirmed => {
          if (confirmed) {
            const articleCodes = Array.from(this.selectedArticles);
            this.articlesService.assignArticlesToTrunk(articleCodes, trunkId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (result) => {
                  this.allArticles = result.articles.filter(a => !this.trunkId || a.trunkId === this.trunkId);
                  this.updateFilteredArticles();
                },
                error: (err) => {
                  console.error('Erreur lors de l\'assignation au tronc:', err);
                }
              });
          }
        });
      }
    });
  }

  onAddAttributes(): void {
    const selectedArticleObjs = this.allArticles.filter(a => this.selectedArticles.has(a.code));
    let preSelectedStoreAttributeCodes: string[] = [];
    if (selectedArticleObjs.length === 1) {
      preSelectedStoreAttributeCodes = [...(selectedArticleObjs[0].attributes || [])];
    } else if (selectedArticleObjs.length > 1) {
      const attributeLists = selectedArticleObjs.map(a => a.attributes || []);
      if (attributeLists.length > 0) {
        preSelectedStoreAttributeCodes = attributeLists[0].filter(code => attributeLists.every(list => list.includes(code)));
      }
    }

    const dialogRef = this.dialog.open(EditAttributesDialogComponent, {
      width: '640px',
      data: { preSelectedStoreAttributeCodes, mode: 'add' }
    });
    dialogRef.afterClosed().subscribe(result => {
      const selectedCodes: string[] | undefined = result?.selectedStoreAttributeCodes;
      const articlesCount = this.getSelectedCount();

      if (selectedCodes && selectedCodes.length > 0 && articlesCount > 0) {
        const attributesCount = selectedCodes.length;
        this.dialog.open(ConfirmAttributesDialogComponent, {
          width: '560px',
          data: { attributesCount, articlesCount, mode: 'apply' }
        }).afterClosed().subscribe(confirmed => {
          if (confirmed) {
            const articleCodes = Array.from(this.selectedArticles);
            const codesSet = new Set(articleCodes);
            const addedSet = new Set(selectedCodes!);
            this.allArticles = this.allArticles.map(a => {
              if (!codesSet.has(a.code)) return a;
              const current = Array.isArray(a.attributes) ? a.attributes : [];
              const union = Array.from(new Set([...current, ...addedSet]));
              return { ...a, attributes: union };
            });
            this.updateFilteredArticles();
            this.articlesService.updateAttributesForArticles(articleCodes, selectedCodes!)
              .pipe(takeUntil(this.destroy$))
              .subscribe(() => {});
          }
        });
      }
    });
  }

  onRemoveAttributes(): void {
    const selectedArticleObjs = this.allArticles.filter(a => this.selectedArticles.has(a.code));
    let preSelectedStoreAttributeCodes: string[] = [];
    if (selectedArticleObjs.length === 1) {
      preSelectedStoreAttributeCodes = [...(selectedArticleObjs[0].attributes || [])];
    } else if (selectedArticleObjs.length > 1) {
      const attributeLists = selectedArticleObjs.map(a => a.attributes || []);
      if (attributeLists.length > 0) {
        preSelectedStoreAttributeCodes = attributeLists[0].filter(code => attributeLists.every(list => list.includes(code)));
      }
    }

    const dialogRef = this.dialog.open(EditAttributesDialogComponent, {
      width: '640px',
      data: { preSelectedStoreAttributeCodes, mode: 'remove' }
    });
    dialogRef.afterClosed().subscribe(result => {
      const deleteCodes: string[] | undefined = result?.deleteStoreAttributeCodes;
      const deleteAll: boolean | undefined = result?.deleteAllAttributes;
      const articlesCount = this.getSelectedCount();

      if (deleteCodes && deleteCodes.length > 0 && articlesCount > 0) {
        const attributesCount = deleteCodes.length;
        this.dialog.open(ConfirmAttributesDialogComponent, {
          width: '560px',
          data: { attributesCount, articlesCount, mode: 'remove' }
        }).afterClosed().subscribe(confirmed => {
          if (confirmed) {
            const articleCodes = Array.from(this.selectedArticles);
            const codesSet = new Set(articleCodes);
            const removeSet = new Set(deleteCodes!);
            this.allArticles = this.allArticles.map(a => {
              if (!codesSet.has(a.code)) return a;
              const current = Array.isArray(a.attributes) ? a.attributes : [];
              const filtered = current.filter(code => !removeSet.has(code));
              const copy = { ...a } as Article & { attributes?: string[] };
              if (filtered.length > 0) {
                copy.attributes = filtered;
              } else {
                delete copy.attributes;
              }
              return copy;
            });
            this.updateFilteredArticles();
            this.articlesService.removeAttributesForArticles(articleCodes, deleteCodes!)
              .pipe(takeUntil(this.destroy$))
              .subscribe(() => {});
          }
        });
      }

      if (deleteAll && articlesCount > 0) {
        this.dialog.open(ConfirmAttributesDialogComponent, {
          width: '560px',
          data: { attributesCount: 0, articlesCount, mode: 'remove_all' }
        }).afterClosed().subscribe(confirmed => {
          if (confirmed) {
            const articleCodes = Array.from(this.selectedArticles);
            const codesSet = new Set(articleCodes);
            this.allArticles = this.allArticles.map(a => {
              if (!codesSet.has(a.code)) return a;
              const copy = { ...a } as Article & { attributes?: string[] };
              delete copy.attributes;
              return copy;
            });
            this.updateFilteredArticles();
            this.articlesService.removeAllAttributesForArticles(articleCodes)
              .pipe(takeUntil(this.destroy$))
              .subscribe(() => {});
          }
        });
      }
    });
  }

  onPauseAssortments(): void {
    console.log('Mettre en pause', Array.from(this.selectedArticles));
  }

  onEditDates(): void {
    console.log('Modifier les dates', Array.from(this.selectedArticles));
  }
}
