import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { ArticlesService, Article } from '../../services/articles.service';
import { GlobalTreeViewComponent } from '../../components/global-tree-view/global-tree-view.component';
import { TrunkTreeViewComponent } from '../../components/trunk-tree-view/trunk-tree-view.component';
import { ArticleListOneComponent } from '../../components/article-list-one/article-list-one.component';
import { ArticleListTwoComponent } from '../../components/article-list-two/article-list-two.component';
import { TrunkHierarchyNode, TreeViewConfig, TreeNodeAction } from '../../interfaces/trunk-hierarchy.interface';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AddToTrunkDialogComponent } from './add-to-trunk-dialog.component';
import { EditAttributesDialogComponent } from './edit-attributes-dialog.component';
import { ConfirmAddToTrunkDialogComponent } from './confirm-add-to-trunk-dialog.component';
import { ConfirmAttributesDialogComponent } from './confirm-attributes-dialog.component';
import { AssortmentOptionsDialogComponent, AssortmentOptionsResult } from './assortment-options-dialog.component';
import { DeploymentTypologyDialogComponent } from './deployment-typology-dialog.component';
import { takeUntil } from 'rxjs/operators';
import { TrunksService, TrunkOption } from '../../services/trunks.service';
import { AssortimentsService } from '../../services/assortiments.service';
import { HttpClient } from '@angular/common/http';
import { of, catchError } from 'rxjs';

@Component({
  selector: 'app-assortments-bulk-management',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, GlobalTreeViewComponent, TrunkTreeViewComponent, ArticleListOneComponent, ArticleListTwoComponent],
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
  filteredArticles1: Article[] = [];
  filteredArticles2: Article[] = [];
  selectedArticles: Set<string> = new Set();
  selectAll: boolean = false;
  viewMode: 'grid' | 'list' = 'list';
  searchQuery: string = '';
  pageSizeList: number = 30;
  currentPageList: number = 0;
  pageSizeList2: number = 30;
  currentPageList2: number = 0;
  // Afficher uniquement les assortiments déjà rattachés (proxy: attributs présents)
  showAssignedOnly: boolean = false;
  // N'afficher que les assortiments rattachés
  showOnlyAssigned: boolean = false;
  currentFilter: { univers?: string; famille?: string; sousFamille?: string } | null = null; // alias pour gauche
  currentFilterLeft: { univers?: string; famille?: string; sousFamille?: string } | null = null;
  currentFilterRight: { univers?: string; famille?: string; sousFamille?: string } | null = null;
  // Mapping nom de tronc par id pour affichage sur les tuiles
  trunkNameById: Record<string, string> = {};
  // Mapping des sous-familles par famille (chargé depuis /data/sous-familles.json)
  private subFamiliesByFamily: Record<string, string[]> = {};
  private assortmentFlagsByCode: Record<string, ('V'|'C')[]> = {};

  trunkLevelLabels: Record<number, string> = {};
  trunkOptions: TrunkOption[] = [];
  selectedTrunkIdRight: string | null = null;
  rightHierarchyNodes: TrunkHierarchyNode[] = [];

  constructor(
    private articlesService: ArticlesService,
    private dialog: MatDialog,
    private trunksService: TrunksService,
    private http: HttpClient,
    private assortimentsService: AssortimentsService
  ) {}

  ngOnInit(): void {
    // Renommer le nœud racine pour cette page (au lieu de "TRONC ACTUEL")
    this.articlesService.setTrunkName('Univers');
    // Charger l'arborescence immédiatement pour éviter le spinner bloquant
    this.loadHierarchy();
    // Charger la taxonomie des sous-familles et enrichir l'arbre une fois disponible
    this.loadSubFamilies(() => {
      if (this.hierarchyNodes && this.hierarchyNodes.length > 0) {
        this.hierarchyNodes = this.pruneHierarchy(this.addMissingSubFamiliesToHierarchy(this.hierarchyNodes));
        this.buildLeftHierarchyFromUnassigned();
      }
    });
    this.loadAllArticles();
    this.loadTrunkLevelLabels();
    // Charger le mapping des noms de troncs pour affichage
    this.trunksService.getTrunkOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe((options: TrunkOption[]) => {
        this.trunkNameById = {};
        this.trunkOptions = options;
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
      .subscribe((articles: Article[]) => {
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
      .subscribe((hierarchy: TrunkHierarchyNode[]) => {
        // Ajouter les sous-familles taxonomiques puis élaguer les nœuds vides pour l’arbo globale
        this.hierarchyNodes = this.pruneHierarchy(this.addMissingSubFamiliesToHierarchy(hierarchy));
        this.updateLeftHierarchyCounts();
        this.isLoading = false;
      });
  }

  /**
   * Charge le mapping sous-familles par famille depuis les chemins connus
   */
  private loadSubFamilies(onDone: () => void): void {
    const tryPaths = [
      '/assets/data/sous-familles.json',
      '/data/sous-familles.json',
      '/data/familles.json'
    ];
    const tryNext = (idx: number) => {
      if (idx >= tryPaths.length) { onDone(); return; }
      fetch(tryPaths[idx])
        .then(r => r.ok ? r.text() : Promise.reject(new Error('HTTP ' + r.status)))
        .then((text) => {
          let raw: any = null;
          try { raw = JSON.parse(text); } catch { raw = null; }
          if (!raw) { tryNext(idx + 1); return; }
          const map: Record<string, string[]> = {};
          if (Array.isArray(raw.sousFamilles)) {
            for (const entry of raw.sousFamilles) {
              if (Array.isArray(entry.sousFamilles)) {
                const labels = entry.sousFamilles
                  .map((sf: any) => sf?.libelle)
                  .filter((lbl: any): lbl is string => typeof lbl === 'string' && lbl.length > 0);
                map[entry.famille] = labels;
              }
            }
          } else if (Array.isArray(raw.familles)) {
            for (const entry of raw.familles) {
              const fams = Array.isArray(entry.familles) ? entry.familles : [];
              for (const f of fams) {
                const labels = Array.isArray(f.sousFamilles) ? f.sousFamilles.filter((lbl: any) => typeof lbl === 'string' && lbl.length > 0) : [];
                if (labels.length) {
                  map[f.libelle] = labels;
                }
              }
            }
          }
          this.subFamiliesByFamily = map;
          onDone();
        })
        .catch(() => tryNext(idx + 1));
    };
    tryNext(0);
  }

  /**
   * Complète l'arborescence en ajoutant les sous-familles définies par la taxonomie
   * pour chaque famille absente. Les sous-familles ajoutées ont un compteur à 0.
   */
  private addMissingSubFamiliesToHierarchy(hierarchy: TrunkHierarchyNode[]): TrunkHierarchyNode[] {
    const clone = JSON.parse(JSON.stringify(hierarchy)) as TrunkHierarchyNode[];

    const visit = (node: TrunkHierarchyNode) => {
      if (node.type === 'famille' || node.type === 'family') {
        const known = this.subFamiliesByFamily[node.name] || [];
        const existingNames = new Set((node.children || []).map(c => c.name));
        for (const label of known) {
          if (!existingNames.has(label)) {
            const id = `${node.id}-sf-${label.toLowerCase().replace(/\s+/g, '-')}`;
            (node.children = node.children || []).push({
              id,
              name: label,
              type: 'sous-famille',
              level: (node.level || 0) + 1,
              articlesCount: 0
            } as any);
          }
        }
        if (node.children) {
          node.children.sort((a, b) => a.name.localeCompare(b.name));
        }
      }
      if (node.children) node.children.forEach(visit);
    };

    clone.forEach(root => visit(root));
    return clone;
  }
  private pruneHierarchy(arr: TrunkHierarchyNode[]): TrunkHierarchyNode[] {
    const prune = (nodes: TrunkHierarchyNode[]): TrunkHierarchyNode[] => {
      const out: TrunkHierarchyNode[] = [];
      for (const n of nodes) {
        const children = n.children ? prune(n.children) : undefined;
        const count = typeof n.articlesCount === 'number'
          ? n.articlesCount
          : (children ? children.reduce((acc, c) => acc + (c.articlesCount || 0), 0) : 0);
        if (count > 0 || n.type === 'trunk') {
          const nn = { ...n } as TrunkHierarchyNode;
          if (children) nn.children = children;
          nn.articlesCount = count;
          out.push(nn);
        }
      }
      return out;
    };
    return prune(arr);
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
    // Supporter les types FR et EN, la hiérarchie ne contient pas d'univers explicite
    if (node.type === 'department') {
      this.currentFilter = { univers: node.name };
      this.currentFilterLeft = { univers: node.name };
    } else if (node.type === 'famille' || node.type === 'family') {
      const univ = this.findParentUnivers(node);
      const universName = univ?.name || '';
      this.currentFilter = { univers: universName, famille: node.name };
      this.currentFilterLeft = { univers: universName, famille: node.name };
    } else if (node.type === 'sous-famille' || node.type === 'sub-family') {
      const parents = this.findParentHierarchy(node);
      this.currentFilter = { univers: parents.univers?.name || '', famille: parents.famille?.name || '', sousFamille: node.name };
      this.currentFilterLeft = { univers: parents.univers?.name || '', famille: parents.famille?.name || '', sousFamille: node.name };
    } else {
      this.currentFilter = null;
      this.currentFilterLeft = null;
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
    const apply = (filter: { univers?: string; famille?: string; sousFamille?: string } | null, trunkId?: string | null): Article[] => {
      let base = [] as Article[];
      if (trunkId) {
        base = this.allArticles.filter(a => String(a.trunkId || '') === String(trunkId));
      } else {
        base = [...this.allArticles];
      }
      let arr = [] as Article[];
      if (!filter) {
        arr = trunkId ? base : [];
      } else {
        arr = base.filter(article => {
          if (filter.univers && article.univers !== filter.univers) return false;
          if (filter.famille && article.famille !== filter.famille) return false;
          if (filter.sousFamille && article.sousFamille !== filter.sousFamille) return false;
          return true;
        });
      }
      const term = this.searchQuery.trim().toLowerCase();
      if (term) {
        arr = arr.filter(a =>
          a.libelle.toLowerCase().includes(term) ||
          a.code.toLowerCase().includes(term) ||
          a.univers.toLowerCase().includes(term) ||
          a.famille.toLowerCase().includes(term) ||
          (a.sousFamille || '').toLowerCase().includes(term)
        );
      }
      if (this.showOnlyAssigned) {
        arr = arr.filter(a => !!a.trunkId);
      } else if (!trunkId) {
        arr = arr.filter(a => !a.trunkId);
      }
      arr.forEach(a => this.ensureAssortmentFlagsFor(a.code));
      return arr;
    };

    this.filteredArticles1 = apply(this.currentFilterLeft ?? this.currentFilter, null);
    this.filteredArticles2 = apply(this.currentFilterRight, this.selectedTrunkIdRight);
    this.filteredArticles = this.filteredArticles1; // compatibilité avec anciennes méthodes
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

  areAllPagedSelected(): boolean {
    const start = this.currentPageList * this.pageSizeList;
    const slice = this.filteredArticles.slice(start, start + this.pageSizeList);
    return slice.length > 0 && slice.every(a => this.selectedArticles.has(a.code));
  }

  areSomePagedSelected(): boolean {
    const start = this.currentPageList * this.pageSizeList;
    const slice = this.filteredArticles.slice(start, start + this.pageSizeList);
    const some = slice.some(a => this.selectedArticles.has(a.code));
    return some && !this.areAllPagedSelected();
  }

  toggleAllPaged(): void {
    const start = this.currentPageList * this.pageSizeList;
    const slice = this.filteredArticles.slice(start, start + this.pageSizeList);
    const allSelected = slice.length > 0 && slice.every(a => this.selectedArticles.has(a.code));
    if (allSelected) {
      slice.forEach(a => this.selectedArticles.delete(a.code));
    } else {
      slice.forEach(a => this.selectedArticles.add(a.code));
    }
  }

  firstPageList(): void { this.currentPageList = 0; }
  prevPageList(): void { this.currentPageList = Math.max(0, this.currentPageList - 1); }
  nextPageList(): void {
    const hasNext = (this.currentPageList + 1) * this.pageSizeList < this.filteredArticles.length;
    if (hasNext) this.currentPageList += 1;
  }
  lastPageList(): void {
    const last = Math.max(0, Math.floor((this.filteredArticles.length - 1) / this.pageSizeList));
    this.currentPageList = last;
  }

  areAllPagedSelected2(): boolean {
    const start = this.currentPageList2 * this.pageSizeList2;
    const slice = this.filteredArticles2.slice(start, start + this.pageSizeList2);
    return slice.length > 0 && slice.every(a => this.selectedArticles.has(a.code));
  }

  areSomePagedSelected2(): boolean {
    const start = this.currentPageList2 * this.pageSizeList2;
    const slice = this.filteredArticles2.slice(start, start + this.pageSizeList2);
    const some = slice.some(a => this.selectedArticles.has(a.code));
    return some && !this.areAllPagedSelected2();
  }

  toggleAllPaged2(): void {
    const start = this.currentPageList2 * this.pageSizeList2;
    const slice = this.filteredArticles2.slice(start, start + this.pageSizeList2);
    const allSelected = slice.length > 0 && slice.every(a => this.selectedArticles.has(a.code));
    if (allSelected) {
      slice.forEach(a => this.selectedArticles.delete(a.code));
    } else {
      slice.forEach(a => this.selectedArticles.add(a.code));
    }
  }

  firstPageList2(): void { this.currentPageList2 = 0; }
  prevPageList2(): void { this.currentPageList2 = Math.max(0, this.currentPageList2 - 1); }
  nextPageList2(): void {
    const hasNext = (this.currentPageList2 + 1) * this.pageSizeList2 < this.filteredArticles2.length;
    if (hasNext) this.currentPageList2 += 1;
  }
  lastPageList2(): void {
    const last = Math.max(0, Math.floor((this.filteredArticles2.length - 1) / this.pageSizeList2));
    this.currentPageList2 = last;
  }

  /**
   * Nombre sélectionné par nœud (pour badges dans l’arbre)
   */
  getSelectedCountForNode(node: TrunkHierarchyNode): number {
    switch (node.type) {
      case 'trunk':
        return this.selectedArticles.size;
      case 'sous-famille':
      case 'sub-family':
        return this.allArticles.filter(a => a.sousFamille === node.name && this.selectedArticles.has(a.code)).length;
      case 'famille':
      case 'family':
        return this.allArticles.filter(a => a.famille === node.name && this.selectedArticles.has(a.code)).length;
      case 'department':
      case 'rayon':
        return this.allArticles.filter(a => a.univers === node.name && this.selectedArticles.has(a.code)).length;
      case 'niveau': {
        const m = /rt-niveau-(\d+)/.exec(node.id || '');
        const lvl = m ? parseInt(m[1], 10) : NaN;
        if (!isNaN(lvl)) {
          return this.allArticles.filter(a => a.level === lvl && this.selectedArticles.has(a.code)).length;
        }
        return 0;
      }
      default:
        return 0;
    }
  }

  /**
   * Actions de la sidebar droite
   */
  onAddToTrunk(): void {
    if (!this.selectedNode) {
      this.dialog.open(ConfirmAddToTrunkDialogComponent, {
        width: '520px',
        data: { customTitle: 'Ajouter au tronc', customMessage: 'Veuillez sélectionner un nœud dans l’arborescence globale.' }
      });
      return;
    }

    let selectedTrunkId = this.selectedTrunkIdRight;
    if (!selectedTrunkId) {
      this.dialog.open(ConfirmAddToTrunkDialogComponent, {
        width: '520px',
        data: { customTitle: 'Ajouter au tronc', customMessage: 'Veuillez choisir un tronc dans la liste avant de continuer.' }
      });
      return;
    }
    const trunkOpt = this.trunkOptions.find(t => String(t.id) === String(selectedTrunkId));
    const trunkId = String(selectedTrunkId);
    const trunkName = trunkOpt?.name || 'Tronc';
    const trunkType = trunkOpt?.type || 'TAC';
    const level = 1;
    const levelLabel = this.getLevelLabel(level);

    this.selectedTrunkIdRight = trunkId || null;
      this.buildRightHierarchy();
      this.updateFilteredArticles();

      const selectedCount = this.getSelectedCount();
      const typeLabel = trunkType === 'TAN' ? 'National' : 'Complémentaire';
      const msg = `${selectedCount} élément${selectedCount > 1 ? 's' : ''} vont être ajoutés au tronc <strong>${typeLabel}</strong> <em>${trunkName}</em>`;
      this.dialog.open(ConfirmAddToTrunkDialogComponent, {
        width: '520px',
        data: { customTitle: 'Ajouter au tronc', customMessage: msg }
      }).afterClosed().subscribe((preConfirmed: boolean) => {
        if (!preConfirmed) return;
        let articleCodes = Array.from(this.selectedArticles);
        if (articleCodes.length === 0) {
          articleCodes = this.filteredArticles1.map(a => a.code);
        }
        const codesSet = new Set(articleCodes);
        this.allArticles = this.allArticles.map(a => codesSet.has(a.code) ? { ...a, trunkId: trunkId, level: 1 } : a);
      this.updateFilteredArticles();
      this.buildRightHierarchy();
      this.buildLeftHierarchyFromUnassigned();
      this.selectedArticles.clear();
      this.updateSelectAllState();

        this.dialog.open(AssortmentOptionsDialogComponent, {
          width: '520px',
          data: { showDates: true }
        }).afterClosed().subscribe((opts: AssortmentOptionsResult | undefined) => {
          if (!opts) return;
          const { commandableEnabled, vendableEnabled, commandableStart, commandableEnd, vendableStart, vendableEnd } = opts;
          if (!commandableEnabled && !vendableEnabled) return;

          const codesSet2 = new Set(articleCodes);
          this.allArticles = this.allArticles.map(a => {
            if (!codesSet2.has(a.code)) return a;
            const copy = { ...a } as Article;
            if (commandableEnabled) {
              copy.commandable = { dateDebut: commandableStart ?? null, dateFin: commandableEnd ?? null, actif: true };
              const flags = this.assortmentFlagsByCode[a.code] || [];
              if (!flags.includes('C')) this.assortmentFlagsByCode[a.code] = [...flags, 'C'];
            }
            if (vendableEnabled) {
              copy.vendable = { dateDebut: vendableStart ?? null, dateFin: vendableEnd ?? null, actif: true };
              const flags = this.assortmentFlagsByCode[a.code] || [];
              if (!flags.includes('V')) this.assortmentFlagsByCode[a.code] = [...flags, 'V'];
            }
            return copy;
          });
          this.updateFilteredArticles();

          articleCodes.forEach(code => {
            if (commandableEnabled) {
              this.assortimentsService.createAssortiment({
                articleId: code,
                metatype: 'commandable',
                type: 'permanent',
                dateDebut: commandableStart ?? null,
                dateFin: commandableEnd ?? null,
                actif: true
              }).pipe(takeUntil(this.destroy$)).subscribe();
            }
            if (vendableEnabled) {
              this.assortimentsService.createAssortiment({
                articleId: code,
                metatype: 'vendable',
                type: 'permanent',
                dateDebut: vendableStart ?? null,
                dateFin: vendableEnd ?? null,
                actif: true
              }).pipe(takeUntil(this.destroy$)).subscribe();
            }
          });
          const selectedCountForLevel = articleCodes.length;
          this.dialog.open(AddToTrunkDialogComponent, {
            width: '520px',
            data: { selectedCount: selectedCountForLevel, selectedTrunkId: trunkId, mode: 'levelOnly' }
          }).afterClosed().subscribe((levelResult: { level?: number } | undefined) => {
            const chosenLevel = levelResult?.level;
            if (typeof chosenLevel === 'number' && chosenLevel > 0) {
              const set3 = new Set(articleCodes);
              this.allArticles = this.allArticles.map(a => set3.has(a.code) ? { ...a, level: chosenLevel } : a);
              this.updateFilteredArticles();
              this.buildRightHierarchy();
              this.articlesService.updateLevelForArticles(articleCodes, chosenLevel)
                .pipe(takeUntil(this.destroy$))
                .subscribe(() => {});
            }
            this.articlesService.refreshData();
          });
        });

        this.articlesService.assignArticlesToTrunk(articleCodes, trunkId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
              next: (assignResult: { updated: number; articles: Article[] }) => {
                const normalized = (assignResult.articles || []).map((a: any) => {
                  const tid = a.trunkId ?? a.trunk_id;
                  const levelFromJson = typeof a.trunk_level !== 'undefined' ? a.trunk_level : a.level;
                  const levelVal = typeof levelFromJson !== 'undefined' ? Number(levelFromJson) : undefined;
                  return tid ? { ...a, trunkId: tid, level: levelVal ?? 1 } : { ...a, level: levelVal };
                }) as Article[];
                this.allArticles = normalized;
                this.updateFilteredArticles();
                this.buildRightHierarchy();
                this.buildLeftHierarchyFromUnassigned();
              },
              error: (err: unknown) => {
                console.error('Erreur lors de l\'assignation au tronc:', err);
              }
          });
      });
    }

  private rightHierarchyHasSelectedNode(): boolean {
    if (!this.selectedNode || !this.rightHierarchyNodes || this.rightHierarchyNodes.length === 0) return false;
    let universName = '';
    let familleName = '';
    let sousName = '';
    if (this.selectedNode.type === 'department') {
      universName = this.selectedNode.name;
    } else if (this.selectedNode.type === 'famille' || this.selectedNode.type === 'family') {
      universName = this.findParentUnivers(this.selectedNode)?.name || '';
      familleName = this.selectedNode.name;
    } else if (this.selectedNode.type === 'sous-famille' || this.selectedNode.type === 'sub-family') {
      const parents = this.findParentHierarchy(this.selectedNode);
      universName = parents.univers?.name || '';
      familleName = parents.famille?.name || '';
      sousName = this.selectedNode.name;
    }
    const universNode = this.rightHierarchyNodes.find(n => n.type === 'department' && n.name === universName);
    if (!universNode) return false;
    if (!familleName) return true;
    const famNode = (universNode.children || []).find(n => (n.type === 'famille' || n.type === 'family') && n.name === familleName);
    if (!famNode) return false;
    if (!sousName) return true;
    const sfNode = (famNode.children || []).find(n => (n.type === 'sous-famille' || n.type === 'sub-family') && n.name === sousName);
    return !!sfNode;
  }

  private updateLeftHierarchyCounts(): void {
    const unassigned = this.allArticles.filter(a => !a.trunkId);
    const universCount = new Map<string, number>();
    const familleCount = new Map<string, Map<string, number>>();
    const sousCount = new Map<string, Map<string, Map<string, number>>>();
    unassigned.forEach(a => {
      const u = String(a.univers || '');
      const f = String(a.famille || '');
      const s = String(a.sousFamille || '');
      universCount.set(u, (universCount.get(u) || 0) + 1);
      if (!familleCount.has(u)) familleCount.set(u, new Map());
      const fm = familleCount.get(u)!;
      fm.set(f, (fm.get(f) || 0) + 1);
      if (!sousCount.has(u)) sousCount.set(u, new Map());
      const smFam = sousCount.get(u)!;
      if (!smFam.has(f)) smFam.set(f, new Map());
      const sm = smFam.get(f)!;
      if (s) sm.set(s, (sm.get(s) || 0) + 1);
    });
    const applyCounts = (node: TrunkHierarchyNode) => {
      if (node.type === 'department') {
        node.articlesCount = universCount.get(String(node.name)) || 0;
      } else if (node.type === 'famille' || node.type === 'family') {
        const univ = this.findParentUnivers(node);
        const uName = String(univ?.name || '');
        const fm = familleCount.get(uName);
        node.articlesCount = fm ? (fm.get(String(node.name)) || 0) : 0;
      } else if (node.type === 'sous-famille' || node.type === 'sub-family') {
        const parents = this.findParentHierarchy(node);
        const uName = String(parents.univers?.name || '');
        const fName = String(parents.famille?.name || '');
        const smFam = sousCount.get(uName);
        const sm = smFam ? smFam.get(fName) : undefined;
        node.articlesCount = sm ? (sm.get(String(node.name)) || 0) : 0;
      }
      if (node.children) node.children.forEach(applyCounts);
    };
    this.hierarchyNodes.forEach(applyCounts);
    this.hierarchyNodes = this.pruneHierarchy(this.hierarchyNodes);
  }

  private buildLeftHierarchyFromUnassigned(): void {
    const arts = this.allArticles.filter(a => !a.trunkId);
    const universMap = new Map<string, { families: Map<string, Map<string, number>>; count: number }>();
    arts.forEach(a => {
      const univ = String(a.univers || 'Sans univers');
      const fam = String(a.famille || 'Sans famille');
      const sf = String(a.sousFamille || 'Sans sous-famille');
      if (!universMap.has(univ)) universMap.set(univ, { families: new Map(), count: 0 });
      const u = universMap.get(univ)!;
      u.count += 1;
      if (!u.families.has(fam)) u.families.set(fam, new Map<string, number>());
      const famMap = u.families.get(fam)!;
      famMap.set(sf, (famMap.get(sf) || 0) + 1);
    });
    const root: TrunkHierarchyNode = { id: 'trunk-root', name: 'Univers', type: 'trunk', level: 0, children: [] } as any;
    universMap.forEach((u, univ) => {
      const universId = `lg-univ-${univ.toLowerCase().replace(/\s+/g,'-')}`;
      const universNode: TrunkHierarchyNode = { id: universId, name: univ, type: 'department', level: 1, articlesCount: u.count, children: [] } as any;
      u.families.forEach((sfMap, fam) => {
        const famId = `${universId}-fam-${fam.toLowerCase().replace(/\s+/g,'-')}`;
        const famCount = Array.from(sfMap.values()).reduce((acc, n) => acc + n, 0);
        const famNode: TrunkHierarchyNode = { id: famId, name: fam, type: 'famille', level: 2, articlesCount: famCount, children: [] } as any;
        Array.from(sfMap.entries()).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))).forEach(([sf, cnt]) => {
          const sfId = `${famId}-sf-${sf.toLowerCase().replace(/\s+/g,'-')}`;
          const sfNode: TrunkHierarchyNode = { id: sfId, name: sf, type: 'sous-famille', level: 3, articlesCount: cnt } as any;
          (famNode.children = famNode.children || []).push(sfNode);
        });
        (universNode.children = universNode.children || []).push(famNode);
      });
      (root.children = root.children || []).push(universNode);
    });
    let nodes = [root];
    nodes = this.addMissingSubFamiliesToHierarchy(nodes);
    this.hierarchyNodes = this.pruneHierarchy(nodes);
  }

  onModifyDeploymentTypology(): void {
    const selectedCount = this.getSelectedCount();
    if (selectedCount === 0) { return; }

    const dialogRef = this.dialog.open(DeploymentTypologyDialogComponent, {
      width: '420px'
    });
    dialogRef.afterClosed().subscribe((result: { typology: 'ferme' | 'mixte' | 'ouvert' } | undefined) => {
      const typology = result?.typology;
      if (!typology) return;
      const articleCodes = Array.from(this.selectedArticles);

      // Mise à jour optimiste côté client
      const codesSet = new Set(articleCodes);
      this.allArticles = this.allArticles.map(a => {
        if (!codesSet.has(a.code)) return a;
        return { ...a, deployment_typology: typology };
      });
      this.updateFilteredArticles();

      // Persistance côté serveur
      this.articlesService.updateDeploymentTypologyForArticles(articleCodes, typology)
        .pipe(takeUntil(this.destroy$))
        .subscribe(({ updated }) => {
          console.log(`Typologie '${typology}' appliquée à ${updated} article(s)`);
        });
    });
  }

  formatDeploymentTypology(val?: 'ferme' | 'mixte' | 'ouvert'): string {
    if (!val) return '';
    switch (val) {
      case 'ferme': return 'Fermé';
      case 'mixte': return 'Mixte';
      case 'ouvert': return 'Ouvert';
      default: return String(val);
    }
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
    dialogRef.afterClosed().subscribe((result: { selectedStoreAttributeCodes?: string[] } | undefined) => {
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
              .subscribe(({ updated }: { updated: number }) => {
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
              .subscribe(({ updated }: { updated: number }) => {
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
              .subscribe(({ updated }: { updated: number }) => {
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

  onCreateAssortments(): void {
    const selectedCount = this.getSelectedCount();
    if (selectedCount === 0 && this.filteredArticles1.length === 0) { return; }

    const dialogRef = this.dialog.open(AssortmentOptionsDialogComponent, {
      width: '560px'
    });
    dialogRef.afterClosed().subscribe((result: AssortmentOptionsResult | undefined) => {
      if (!result) return;
      const { commandableEnabled, commandableStart, commandableEnd, vendableEnabled, vendableStart, vendableEnd } = result;
      if (!commandableEnabled && !vendableEnabled) return;

      let articleCodes = Array.from(this.selectedArticles);
      if (articleCodes.length === 0) {
        articleCodes = this.filteredArticles1.map(a => a.code);
      }

      const codesSet = new Set(articleCodes);
      this.allArticles = this.allArticles.map(a => {
        if (!codesSet.has(a.code)) return a;
        const copy = { ...a } as Article;
        if (commandableEnabled) {
          copy.commandable = { dateDebut: commandableStart ?? null, dateFin: commandableEnd ?? null, actif: true };
          const flags = this.assortmentFlagsByCode[a.code] || [];
          if (!flags.includes('C')) this.assortmentFlagsByCode[a.code] = [...flags, 'C'];
        }
        if (vendableEnabled) {
          copy.vendable = { dateDebut: vendableStart ?? null, dateFin: vendableEnd ?? null, actif: true };
          const flags = this.assortmentFlagsByCode[a.code] || [];
          if (!flags.includes('V')) this.assortmentFlagsByCode[a.code] = [...flags, 'V'];
        }
        return copy;
      });
      this.updateFilteredArticles();

      const tasks: Array<Promise<void>> = [];
      articleCodes.forEach(code => {
        if (commandableEnabled) {
          tasks.push(new Promise<void>(resolve => {
            this.assortimentsService.createAssortiment({
              articleId: code,
              metatype: 'commandable',
              type: 'permanent',
              dateDebut: commandableStart ?? null,
              dateFin: commandableEnd ?? null,
              actif: true
            }).pipe(takeUntil(this.destroy$)).subscribe({ next: () => resolve(), error: () => resolve() });
          }));
        }
        if (vendableEnabled) {
          tasks.push(new Promise<void>(resolve => {
            this.assortimentsService.createAssortiment({
              articleId: code,
              metatype: 'vendable',
              type: 'permanent',
              dateDebut: vendableStart ?? null,
              dateFin: vendableEnd ?? null,
              actif: true
            }).pipe(takeUntil(this.destroy$)).subscribe({ next: () => resolve(), error: () => resolve() });
          }));
        }
      });

      Promise.all(tasks).then(() => {
        this.articlesService.refreshData();
      });
    });
  }

  private loadTrunkLevelLabels(): void {
    this.http.get<{ trunkLevels: { level: number; label: string }[] }>("/data/trunk-levels.json")
      .pipe(catchError(() => of({ trunkLevels: [] })))
      .subscribe(({ trunkLevels }) => {
        const map: Record<number, string> = {};
        trunkLevels.forEach(({ level, label }) => { map[level] = label.toLowerCase(); });
        this.trunkLevelLabels = map;
      });
  }

  getLevelLabel(level?: number): string {
    if (typeof level !== 'number') return '';
    return this.trunkLevelLabels[level] || `niveau ${level}`;
  }

  private ensureAssortmentFlagsFor(code: string): void {
    if (this.assortmentFlagsByCode[code]) return;
    const flags: ('V'|'C')[] = [];
    if (Math.random() > 0.5) flags.push('V');
    if (Math.random() > 0.5) flags.push('C');
    if (flags.length === 0) flags.push('V');
    this.assortmentFlagsByCode[code] = flags;
  }

  hasVendable(code: string): boolean {
    const f = this.assortmentFlagsByCode[code] || [];
    return f.includes('V');
  }

  hasCommandable(code: string): boolean {
    const f = this.assortmentFlagsByCode[code] || [];
    return f.includes('C');
  }

  onRightTrunkSelect(trunkId: string): void {
    this.selectedTrunkIdRight = trunkId || null;
    this.buildRightHierarchy();
    this.currentFilterRight = null;
    this.updateFilteredArticles();
  }

  private buildRightHierarchy(): void {
    if (!this.selectedTrunkIdRight) { this.rightHierarchyNodes = []; return; }
    const arts = this.allArticles.filter(a => String(a.trunkId || '') === String(this.selectedTrunkIdRight));
    const levelsMap = new Map<number, Article[]>();
    for (const a of arts) {
      const rawLevel = (a as any).trunk_level ?? a.level;
      const lvl = typeof rawLevel !== 'undefined' ? Number(rawLevel) : 1;
      levelsMap.set(lvl, [...(levelsMap.get(lvl) || []), { ...a, level: lvl }]);
    }

    const levelNodes: TrunkHierarchyNode[] = [];
    Array.from(levelsMap.entries())
      .sort((a, b) => a[0] - b[0])
      .forEach(([lvl, levelArticles]) => {
        const levelNode: TrunkHierarchyNode = {
          id: `rt-niveau-${lvl}`,
          name: this.getLevelLabel(lvl),
          type: 'niveau',
          level: 1,
          articlesCount: levelArticles.length,
          children: []
        } as any;

        const universMap = new Map<string, { families: Map<string, Set<string>>; count: number }>();
        levelArticles.forEach(a => {
          const univ = String(a.univers || '');
          const fam = String(a.famille || '');
          const sf = String(a.sousFamille || '');
          if (!univ) return;
          if (!universMap.has(univ)) universMap.set(univ, { families: new Map(), count: 0 });
          const u = universMap.get(univ)!;
          u.count += 1;
          if (!!fam) {
            if (!u.families.has(fam)) u.families.set(fam, new Set<string>());
            if (sf) u.families.get(fam)!.add(sf);
          }
        });

        let uid = 0;
        universMap.forEach((u, univ) => {
          const universId = `rt-univ-${lvl}-${uid++}-${univ.toLowerCase().replace(/\s+/g,'-')}`;
          const universNode: TrunkHierarchyNode = { id: universId, name: univ, type: 'rayon', level: 2, articlesCount: u.count, children: [] } as any;
          u.families.forEach((sfSet, fam) => {
            const famId = `${universId}-fam-${fam.toLowerCase().replace(/\s+/g,'-')}`;
            const famCount = levelArticles.filter(a => a.univers === univ && a.famille === fam).length;
            const famNode: TrunkHierarchyNode = { id: famId, name: fam, type: 'famille', level: 3, articlesCount: famCount, children: [] } as any;
            Array.from(sfSet).sort((a,b)=>a.localeCompare(b)).forEach(sf => {
              const sfId = `${famId}-sf-${sf.toLowerCase().replace(/\s+/g,'-')}`;
              const sfCount = levelArticles.filter(a => a.univers === univ && a.famille === fam && a.sousFamille === sf).length;
              const sfNode: TrunkHierarchyNode = { id: sfId, name: sf, type: 'sous-famille', level: 4, articlesCount: sfCount } as any;
              (famNode.children = famNode.children || []).push(sfNode);
            });
            (universNode.children = universNode.children || []).push(famNode);
          });
          (levelNode.children = levelNode.children || []).push(universNode);
        });

        const prune = (arr: TrunkHierarchyNode[]): TrunkHierarchyNode[] => {
          const out: TrunkHierarchyNode[] = [];
          for (const n of arr) {
            const children = n.children ? prune(n.children) : undefined;
            const count = typeof n.articlesCount === 'number' ? n.articlesCount : (children ? children.reduce((acc, c) => acc + (c.articlesCount || 0), 0) : 0);
            if (count > 0) {
              const nn = { ...n } as TrunkHierarchyNode;
              if (children) nn.children = children;
              out.push(nn);
            }
          }
          return out;
        };
        levelNode.children = prune(levelNode.children || []);
        const levelCount = levelNode.articlesCount || 0;
        if (levelCount > 0) {
          levelNodes.push(levelNode);
        }
      });

    this.rightHierarchyNodes = levelNodes;
  }

  onRightNodeAction(action: TreeNodeAction): void {
    if (action.action === 'select') {
      const node = action.node;
      if (node.type === 'famille' || node.type === 'family') {
        this.currentFilterRight = { famille: node.name };
      } else if (node.type === 'sous-famille' || node.type === 'sub-family') {
        this.currentFilterRight = { sousFamille: node.name };
      } else if (node.type === 'department' || node.type === 'rayon') {
        this.currentFilterRight = { univers: node.name };
      } else if (node.type === 'niveau') {
        const byName = /\d+/.exec(node.id);
        const lvl = byName ? Number(byName[0]) : undefined;
        this.currentFilterRight = typeof lvl === 'number' ? { ...(this.currentFilterRight || {}), univers: undefined, famille: undefined, sousFamille: undefined } : null;
      } else {
        this.currentFilterRight = null;
      }
      this.updateFilteredArticles();
    }
  }

  private generateRandomArticles(filter: { univers?: string; famille?: string; sousFamille?: string }, count: number): Article[] {
    const uni = filter.univers || 'Univers';
    const fam = filter.famille || 'Famille';
    const sf = filter.sousFamille || 'SousFamille';
    const attrs = ['A1', 'A2', 'A3', 'A4'];
    const typos: Array<'ferme'|'mixte'|'ouvert'> = ['ferme','mixte','ouvert'];
    const res: Article[] = [];
    for (let i = 0; i < count; i++) {
      const code = `SIM-${uni.slice(0,2).toUpperCase()}-${fam.slice(0,2).toUpperCase()}-${sf.slice(0,2).toUpperCase()}-${String(i+1).padStart(4,'0')}`;
      const a = Math.random();
      const attrPick = a > 0.6 ? [attrs[Math.floor(Math.random()*attrs.length)]] : [];
      const trunkAssigned = a > 0.8 ? `T-${uni.slice(0,3).toUpperCase()}` : undefined;
      const level = trunkAssigned ? 1 : undefined;
      const deployment = typos[Math.floor(Math.random()*typos.length)];
      res.push({
        code,
        libelle: `${fam} ${sf} ${i+1}`,
        univers: uni,
        famille: fam,
        sousFamille: sf,
        attributes: attrPick.length ? attrPick : undefined,
        trunkId: trunkAssigned,
        level,
        deployment_typology: deployment
      });
    }
    return res;
  }
}
