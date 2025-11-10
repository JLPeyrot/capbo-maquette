import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { ArticlesService, Article } from '../../services/articles.service';
import { TreeViewComponent } from '../../components/tree-view/tree-view.component';
import { TrunkHierarchyNode, TreeViewConfig, TreeNodeAction } from '../../interfaces/trunk-hierarchy.interface';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AddToTrunkDialogComponent } from './add-to-trunk-dialog.component';
import { EditAttributesDialogComponent } from './edit-attributes-dialog.component';
import { ConfirmAddToTrunkDialogComponent } from './confirm-add-to-trunk-dialog.component';
import { ConfirmAttributesDialogComponent } from './confirm-attributes-dialog.component';
import { takeUntil } from 'rxjs/operators';
import { TrunksService, TrunkOption } from '../../services/trunks.service';

@Component({
  selector: 'app-assortments-bulk-management',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, TreeViewComponent],
  templateUrl: './assortments-bulk-management.component.html',
  styleUrls: ['./assortments-bulk-management.component.scss']
})
export class AssortmentsBulkManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Arborescence
  hierarchyNodes: TrunkHierarchyNode[] = [];
  selectedNodeIds: string[] = [];
  selectedNode: TrunkHierarchyNode | null = null;
  treeConfig: TreeViewConfig = {
    showIcons: true,
    showArticleCount: true,
    allowMultipleSelection: false,
    expandOnClick: true,
    expandOnSelect: true,
    multiSelect: false
  };
  isLoading: boolean = true;

  allArticles: Article[] = [];
  filteredArticles: Article[] = [];
  selectedArticles: Set<string> = new Set();
  selectAll: boolean = false;
  viewMode: 'grid' | 'list' = 'grid';
  searchQuery: string = '';
  // Afficher uniquement les assortiments déjà rattachés (proxy: attributs présents)
  showAssignedOnly: boolean = false;
  // N'afficher que les assortiments rattachés
  showOnlyAssigned: boolean = false;
  currentFilter: { univers?: string; famille?: string; sousFamille?: string } | null = null;
  // Mapping nom de tronc par id pour affichage sur les tuiles
  trunkNameById: Record<string, string> = {};

  constructor(private articlesService: ArticlesService, private dialog: MatDialog, private trunksService: TrunksService) {}

  ngOnInit(): void {
    // Renommer le nœud racine pour cette page (au lieu de "TRONC ACTUEL")
    this.articlesService.setTrunkName('Univers');
    this.loadHierarchy();
    this.loadAllArticles();
    // Charger le mapping des noms de troncs pour affichage
    this.trunksService.getTrunkOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe((options: TrunkOption[]) => {
        this.trunkNameById = {};
        options.forEach(opt => { this.trunkNameById[opt.id] = opt.name; });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAllArticles(): void {
    this.articlesService.getArticles()
      .pipe(takeUntil(this.destroy$))
      .subscribe(articles => {
        this.allArticles = articles;
        this.updateFilteredArticles();
        this.updateSelectAllState();
      });
  }

  /**
   * Charge la hiérarchie pour la sidebar
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
   * Actions de l’arborescence
   */
  onNodeAction(action: TreeNodeAction): void {
    switch (action.action) {
      case 'select':
        this.onNodeSelect(action.node);
        break;
      case 'expand':
      case 'collapse':
        // Gestion par le composant tree-view
        break;
    }
  }

  onNodeSelect(node: TrunkHierarchyNode): void {
    this.selectedNode = node;
    this.selectedNodeIds = [node.id];
    this.applyFilterForNode(node);
  }

  private applyFilterForNode(node: TrunkHierarchyNode): void {
    if (node.type === 'department') {
      this.currentFilter = { univers: node.name };
    } else if (node.type === 'family') {
      const universParent = this.findParentUnivers(node);
      this.currentFilter = {
        univers: universParent?.name || '',
        famille: node.name
      };
    } else if (node.type === 'sub-family') {
      const parents = this.findParentHierarchy(node);
      this.currentFilter = {
        univers: parents.univers?.name || '',
        famille: parents.famille?.name || '',
        sousFamille: node.name
      };
    } else {
      this.currentFilter = null;
    }
    this.updateFilteredArticles();
  }

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
   * Met à jour la liste filtrée (arborescence + recherche)
   */
  private updateFilteredArticles(): void {
    // Base: filtre hiérarchique
    let base = [] as Article[];
    if (!this.currentFilter) {
      base = [...this.allArticles];
    } else {
      base = this.allArticles.filter(article => {
        if (this.currentFilter!.univers && article.univers !== this.currentFilter!.univers) return false;
        if (this.currentFilter!.famille && article.famille !== this.currentFilter!.famille) return false;
        if (this.currentFilter!.sousFamille && article.sousFamille !== this.currentFilter!.sousFamille) return false;
        return true;
      });
    }

    // Recherche textuelle
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

    // Filtre tronc:
    // - showOnlyAssigned: n'afficher que les assortiments rattachés
    // - sinon, par défaut (showAssignedOnly = false), exclure les assortiments rattachés
    // - si showAssignedOnly = true, inclure tous (pas de filtre supplémentaire)
    if (this.showOnlyAssigned) {
      this.filteredArticles = this.filteredArticles.filter(a => !!a.trunkId);
    } else if (!this.showAssignedOnly) {
      this.filteredArticles = this.filteredArticles.filter(a => !a.trunkId);
    }
    this.updateSelectAllState();
  }

  applySearch(): void {
    this.updateFilteredArticles();
  }

  toggleShowAssignedOnly(): void {
    this.updateFilteredArticles();
  }

  toggleShowOnlyAssigned(): void {
    this.updateFilteredArticles();
  }

  isGridView(): boolean { return this.viewMode === 'grid'; }
  isListView(): boolean { return this.viewMode === 'list'; }
  setGridView(): void { this.viewMode = 'grid'; }
  setListView(): void { this.viewMode = 'list'; }

  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    if (this.selectAll) {
      this.filteredArticles.forEach(article => this.selectedArticles.add(article.code));
    } else {
      // Désélectionner uniquement ceux présents dans la vue filtrée
      this.filteredArticles.forEach(article => this.selectedArticles.delete(article.code));
    }
  }

  isArticleSelected(code: string): boolean {
    return this.selectedArticles.has(code);
  }

  onArticleSelect(code: string, checked: boolean): void {
    if (checked) {
      this.selectedArticles.add(code);
    } else {
      this.selectedArticles.delete(code);
    }
    this.updateSelectAllState();
  }

  private updateSelectAllState(): void {
    const visibleCodes = new Set(this.filteredArticles.map(a => a.code));
    // SelectAll est vrai si tous les articles visibles sont sélectionnés
    this.selectAll = this.filteredArticles.length > 0 && this.filteredArticles.every(a => this.selectedArticles.has(a.code));
    // Ne pas nettoyer les sélections hors vue afin de conserver la sélection
    // quand on change d'univers / filtre. Les actions opèrent sur selectedArticles global.
  }

  getSelectedCount(): number {
    return this.filteredArticles.filter(a => this.selectedArticles.has(a.code)).length;
  }

  /**
   * Nombre sélectionné par nœud (pour badges dans l’arbre)
   */
  getSelectedCountForNode(node: TrunkHierarchyNode): number {
    switch (node.type) {
      case 'trunk':
        return this.selectedArticles.size;
      case 'sub-family':
        return this.allArticles.filter(a => a.sousFamille === node.name && this.selectedArticles.has(a.code)).length;
      case 'family':
        return this.allArticles.filter(a => a.famille === node.name && this.selectedArticles.has(a.code)).length;
      case 'department':
        return this.allArticles.filter(a => a.univers === node.name && this.selectedArticles.has(a.code)).length;
      default:
        return 0;
    }
  }

  /**
   * Actions de la sidebar droite
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
            console.log('Ajout au tronc validé', { trunkId, trunkName, trunkType, level, levelLabel, articles: articleCodes });
            // Appel du service pour écrire trunkId côté serveur et rafraîchir le store
            this.articlesService.assignArticlesToTrunk(articleCodes, trunkId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (result) => {
                  // Mettre à jour la vue avec les nouveaux articles depuis le store
                  this.allArticles = result.articles;
                  this.updateFilteredArticles();
                },
                error: (err) => {
                  console.error('Erreur lors de l\'assignation au tronc:', err);
                }
              });
          }
        });
      } else {
        // Fermeture sans action
      }
    });
  }

  onAddAttributes(): void {
    // Pré-sélectionner les attributs existants des articles sélectionnés
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

      // Ajout / modification d’attributs
      if (selectedCodes && selectedCodes.length > 0 && articlesCount > 0) {
        const attributesCount = selectedCodes.length;
        this.dialog.open(ConfirmAttributesDialogComponent, {
          width: '560px',
          data: { attributesCount, articlesCount, mode: 'apply' }
        }).afterClosed().subscribe(confirmed => {
          if (confirmed) {
            const articleCodes = Array.from(this.selectedArticles);
            // Mise à jour optimiste côté client pour retour visuel immédiat
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
              .subscribe(({ updated }) => {
                console.log(`Attributs appliqués sur ${updated} article(s)`, { attributes: selectedCodes, articleCodes });
                // Le service rafraîchit déjà le store; maintien de la vue
              });
          }
        });
      }
    });
  }

  onRemoveAttributes(): void {
    // Pré-sélectionner les attributs existants des articles sélectionnés
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

      // Suppression d’attributs (set-difference)
      if (deleteCodes && deleteCodes.length > 0 && articlesCount > 0) {
        const attributesCount = deleteCodes.length;
        this.dialog.open(ConfirmAttributesDialogComponent, {
          width: '560px',
          data: { attributesCount, articlesCount, mode: 'remove' }
        }).afterClosed().subscribe(confirmed => {
          if (confirmed) {
            const articleCodes = Array.from(this.selectedArticles);
            // Mise à jour optimiste côté client pour que les tuiles se mettent à jour tout de suite
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
                // Supprime la clé pour refléter le JSON attendu
                delete copy.attributes;
              }
              return copy;
            });
            this.updateFilteredArticles();
            this.articlesService.removeAttributesForArticles(articleCodes, deleteCodes!)
              .pipe(takeUntil(this.destroy$))
              .subscribe(({ updated }) => {
                console.log(`Attributs supprimés de ${updated} article(s)`, { attributesToRemove: deleteCodes, articleCodes });
                // Le service met à jour le store et la hiérarchie; maintien de la vue
              });
          }
        });
      }

      // Suppression totale des attributs
      if (deleteAll && articlesCount > 0) {
        this.dialog.open(ConfirmAttributesDialogComponent, {
          width: '560px',
          data: { attributesCount: 0, articlesCount, mode: 'remove_all' }
        }).afterClosed().subscribe(confirmed => {
          if (confirmed) {
            const articleCodes = Array.from(this.selectedArticles);
            const codesSet = new Set(articleCodes);
            // Mise à jour optimiste: retirer complètement la clé attributes
            this.allArticles = this.allArticles.map(a => {
              if (!codesSet.has(a.code)) return a;
              const copy = { ...a } as Article & { attributes?: string[] };
              delete copy.attributes;
              return copy;
            });
            this.updateFilteredArticles();

            this.articlesService.removeAllAttributesForArticles(articleCodes)
              .pipe(takeUntil(this.destroy$))
              .subscribe(({ updated }) => {
                console.log(`Tous les attributs supprimés pour ${updated} article(s)`, { articleCodes });
              });
          }
        });
      }
    });
  }

  onPauseAssortments(): void {
    // TODO: appliquer un statut "pause" aux assortiments sélectionnés
    console.log('Mettre en pause', Array.from(this.selectedArticles));
  }

  onEditDates(): void {
    // TODO: ouvrir un formulaire pour définir date début/fin en masse
    console.log('Modifier les dates', Array.from(this.selectedArticles));
  }
}
