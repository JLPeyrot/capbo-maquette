import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { TreeViewComponent } from '../../components/tree-view/tree-view.component';
import { TrunkHierarchyNode, TreeViewConfig, TreeNodeAction } from '../../interfaces/trunk-hierarchy.interface';
import { ArticlesService, Article } from '../../services/articles.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TrunksService, TrunkOption } from '../../services/trunks.service';
import { combineLatest } from 'rxjs';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { DeploymentTypologyDialogComponent } from '../assortments-bulk-management/deployment-typology-dialog.component';
import { EditAttributesDialogComponent } from '../assortments-bulk-management/edit-attributes-dialog.component';
import { ChangeLevelDialogComponent, ChangeLevelDialogResult } from './change-level-dialog.component';
import { ChangeLevelConfirmDialogComponent } from './change-level-confirm-dialog.component';
import { ConfirmAttributesDialogComponent } from '../assortments-bulk-management/confirm-attributes-dialog.component';
import { StartDateDialogComponent, StartDateDialogResult } from './start-date-dialog.component';
import { StartDateConfirmDialogComponent } from './start-date-confirm-dialog.component';
import { EndDateDialogComponent, EndDateDialogResult } from './end-date-dialog.component';
import { EndDateConfirmDialogComponent } from './end-date-confirm-dialog.component';
import { HttpClient } from '@angular/common/http';

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
  currentFilter: { univers?: string; famille?: string; sousFamille?: string; level?: number } | null = null;
  searchQuery: string = '';
  isLoading: boolean = true;
  selectedArticles: Set<string> = new Set(); // Pour stocker les codes des articles sélectionnés
  selectAll: boolean = false;
  viewMode: 'list' | 'grid' = 'grid'; // Mode d'affichage par défaut
  trunkName: string = 'TRONC ACTUEL'; // Nom du tronc, par défaut "TRONC ACTUEL"
  trunkId?: string; // Identifiant du tronc sélectionné
  trunkOptions: TrunkOption[] = [];
  // Interface bulk: flags et mapping
  showAssignedOnly: boolean = false;
  showOnlyAssigned: boolean = false;
  trunkNameById: Record<string, string> = {};
  trunkLevelLabels: Record<number, string> = {};
  // Filtres assortiments
  filterVendable: boolean = false;
  filterCommandable: boolean = false;

  // Mapping des sous-familles par famille (chargé depuis /data/sous-familles.json)
  private subFamiliesByFamily: Record<string, string[]> = {};
  // Mapping des familles par univers (chargé depuis /data/familles.json)
  private familiesByUnivers: Record<string, string[]> = {};

  treeConfig: TreeViewConfig = {
    showIcons: true,
    showArticleCount: true,
    allowMultipleSelection: false,
    expandOnClick: false,
    expandOnSelect: false,
    multiSelect: false
  };

  /**
   * Développe tous les nœuds de l'arborescence
   */
  expandAllTree(): void {
    this.setExpandedForAll(this.hierarchyNodes, true);
  }

  /**
   * Réduit tous les nœuds de l'arborescence
   */
  collapseAllTree(): void {
    this.setExpandedForAll(this.hierarchyNodes, false);
  }

  /**
   * Applique expanded = value récursivement sur tous les nœuds
   */
  private setExpandedForAll(nodes: TrunkHierarchyNode[], value: boolean): void {
    for (const node of nodes) {
      (node as any).expanded = value;
      if (node.children && node.children.length) {
        this.setExpandedForAll(node.children, value);
      }
    }
  }

  constructor(
    private articlesService: ArticlesService,
    private trunksService: TrunksService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router,
    private http: HttpClient
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
    // Charger les taxonomies (familles et sous-familles) puis initialiser
    this.loadTaxonomies();

    // Charger le mapping des noms de troncs pour affichage des pills
    this.trunksService.getTrunkOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe((options: TrunkOption[]) => {
        this.trunkOptions = options;
        const map: Record<string, string> = {};
        options.forEach(opt => { map[opt.id] = opt.name; });
        this.trunkNameById = map;
      });

    this.loadTrunkLevelLabels();
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
        // Développer par défaut l’arborescence pour rendre visibles les sous-familles
        this.setExpandedForAll(this.hierarchyNodes, true);
        this.isLoading = false;
        this.updateSelectAllState();
      });
  }

  private loadTrunkLevelLabels(): void {
    this.http.get<{ trunkLevels: { level: number; label: string }[] }>("/data/trunk-levels.json")
      .subscribe({
        next: ({ trunkLevels }) => {
          const map: Record<number, string> = {};
          (trunkLevels || []).forEach(({ level, label }) => { map[level] = label.toLowerCase(); });
          this.trunkLevelLabels = map;
        },
        error: () => {
          this.trunkLevelLabels = {};
        }
      });
  }

  getLevelLabel(level?: number): string {
    if (typeof level !== 'number') return '';
    return this.trunkLevelLabels[level] || `niveau ${level}`;
  }

  /**
   * Change le tronc sélectionné via la navigation pour recharger les données
   */
  onTrunkSelect(trunkId: string): void {
    const selected = this.trunkOptions.find(t => t.id === trunkId);
    if (!selected) return;
    const encoded = encodeURIComponent(selected.name);
    this.router.navigate(['/trunk-control', encoded]);
  }

  /**
   * Options de niveau disponibles (dérivées des articles du tronc)
   */
  getLevelOptions(): number[] {
    const set = new Set<number>();
    for (const a of this.allArticles) {
      const lvl = typeof a.level === 'number' && !isNaN(a.level as number) ? (a.level as number) : undefined;
      if (typeof lvl === 'number') set.add(lvl);
    }
    return Array.from(set).sort((a, b) => a - b);
  }

  /**
   * Compte d'articles par niveau
   */
  getLevelCount(level: number): number {
    return this.allArticles.filter(a => {
      const lvl = typeof a.level === 'number' ? (a.level as number) : undefined;
      return typeof lvl === 'number' && lvl === level;
    }).length;
  }

  /**
   * Options d'univers disponibles
   */
  getUniversOptions(): string[] {
    const set = new Set<string>();
    for (const a of this.allArticles) {
      if (a.univers) set.add(a.univers);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  /**
   * Compte d'articles par univers
   */
  getUniversCount(univers: string): number {
    return this.allArticles.filter(a => a.univers === univers).length;
  }

  /**
   * Options de familles disponibles
   */
  getFamilleOptions(): string[] {
    const set = new Set<string>();
    for (const a of this.allArticles) {
      if (a.famille) set.add(a.famille);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  /**
   * Compte d'articles par famille
   */
  getFamilleCount(famille: string): number {
    return this.allArticles.filter(a => a.famille === famille).length;
  }

  /**
   * Options de sous-familles disponibles
   */
  getSousFamilleOptions(): string[] {
    const set = new Set<string>();
    for (const a of this.allArticles) {
      if (a.sousFamille) set.add(a.sousFamille);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  /**
   * Compte d'articles par sous-famille
   */
  getSousFamilleCount(sousFamille: string): number {
    return this.allArticles.filter(a => a.sousFamille === sousFamille).length;
  }

  onLevelFilterChange(level: number | null): void {
    this.currentFilter = { ...(this.currentFilter || {}), level: level ?? undefined };
    this.updateFilteredArticles();
  }

  onUniversFilterChange(univers: string | null): void {
    this.currentFilter = { ...(this.currentFilter || {}), univers: univers || undefined };
    this.updateFilteredArticles();
  }

  onFamilleFilterChange(famille: string | null): void {
    this.currentFilter = { ...(this.currentFilter || {}), famille: famille || undefined };
    this.updateFilteredArticles();
  }

  onSousFamilleFilterChange(sousFamille: string | null): void {
    this.currentFilter = { ...(this.currentFilter || {}), sousFamille: sousFamille || undefined };
    this.updateFilteredArticles();
  }

  /**
   * Construit une hiérarchie à partir d'une liste d'articles et d'un nom de tronc
   */
  private buildHierarchyFor(articles: Article[], trunkDisplayName: string): TrunkHierarchyNode[] {
    const hierarchy: TrunkHierarchyNode[] = [];

    // Recréer l'arborescence complète limitée aux articles du tronc courant:
    // Tronc > Niveau > Univers > Famille > Sous-famille
    const trunkRoot: TrunkHierarchyNode = {
      id: 'trunk-root',
      name: trunkDisplayName,
      type: 'trunk',
      level: 0,
      children: []
    };

    // 1) Groupes par niveau (en utilisant trunk_level si présent), pas d'injection de valeurs vides
    const levelsMap = new Map<number, Article[]>();
    for (const a of articles) {
      const rawLevel = (a as any).trunk_level ?? a.level;
      const lvl = typeof rawLevel !== 'undefined' ? Number(rawLevel) : 1;
      levelsMap.set(lvl, [...(levelsMap.get(lvl) || []), { ...a, level: lvl }]);
    }

    Array.from(levelsMap.entries())
      .sort((a, b) => a[0] - b[0])
      .forEach(([lvl, levelArticles]) => {
        const niveauNode: TrunkHierarchyNode = {
          id: `niveau-${lvl}`,
          name: `Niveau ${lvl}`,
          type: 'niveau',
          level: 1,
          articlesCount: levelArticles.length,
          children: []
        };

        // 2) Groupes par univers dans ce niveau
        const universByName = new Map<string, Article[]>();
        for (const a of levelArticles) {
          const key = a.univers || '';
          if (!key) continue; // ignorer univers vide
          universByName.set(key, [...(universByName.get(key) || []), a]);
        }

        Array.from(universByName.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .forEach(([universName, universArticles]) => {
            const universNode: TrunkHierarchyNode = {
              id: `rayon-lvl-${lvl}-${universName.toLowerCase().replace(/\s+/g, '-')}`,
              name: universName,
              type: 'rayon',
              level: 2,
              articlesCount: universArticles.length,
              children: []
            };

            // 3) Groupes par famille dans cet univers
            const famillesByName = new Map<string, Article[]>();
            for (const a of universArticles) {
              const key = a.famille || '';
              if (!key) continue; // ignorer familles vides
              famillesByName.set(key, [...(famillesByName.get(key) || []), a]);
            }

            Array.from(famillesByName.entries())
              .sort((a, b) => a[0].localeCompare(b[0]))
              .forEach(([familleName, familleArticles]) => {
                const familleNode: TrunkHierarchyNode = {
                  id: `famille-lvl-${lvl}-${universName.toLowerCase().replace(/\s+/g, '-')}-${familleName.toLowerCase().replace(/\s+/g, '-')}`,
                  name: familleName,
                  type: 'famille',
                  level: 3,
                  articlesCount: familleArticles.length,
                  children: []
                };

                // 4) Groupes par sous-famille
                const sousFamillesByName = new Map<string, Article[]>();
                for (const a of familleArticles) {
                  const key = a.sousFamille || '';
                  if (!key) continue; // ignorer sous-familles vides
                  sousFamillesByName.set(key, [...(sousFamillesByName.get(key) || []), a]);
                }

                Array.from(sousFamillesByName.entries())
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .forEach(([sousFamilleName, sousFamilleArticles]) => {
                    const sousFamilleNode: TrunkHierarchyNode = {
                      id: `sous-famille-lvl-${lvl}-${universName.toLowerCase().replace(/\s+/g, '-')}-${familleName.toLowerCase().replace(/\s+/g, '-')}-${sousFamilleName.toLowerCase().replace(/\s+/g, '-')}`,
                      name: sousFamilleName,
                      type: 'sous-famille',
                      level: 4,
                      articlesCount: sousFamilleArticles.length
                    };
                    (familleNode.children = familleNode.children || []).push(sousFamilleNode);
                  });

                if (familleNode.children && familleNode.children.length) {
                  universNode.children!.push(familleNode);
                }
              });

            if (universNode.children && universNode.children.length) {
              niveauNode.children!.push(universNode);
            }
          });

        if (niveauNode.children && niveauNode.children.length) {
          trunkRoot.children!.push(niveauNode);
        }
      });

    hierarchy.push(trunkRoot);
    return hierarchy;
  }

  // Charge les taxonomies (familles et sous-familles) avec fallback de chemins
  private loadTaxonomies(): void {
    const loadSubFamilies = (onDone: () => void) => {
      const tryPaths = [
        '/assets/data/sous-famille.json',
        '/assets/data/sous-familles.json',
        '/data/sous-familles.json'
      ];
      // Ajout de chemins fallback supplémentaires
      tryPaths.push('/data/sousfamille.json');
      tryPaths.push('/assets/data/sousfamille.json');
      const tryNext = (idx: number) => {
        if (idx >= tryPaths.length) {
          onDone();
          return;
        }
        this.http
          .get<{ sousFamilles: { famille: string; sousFamilles: { code: string; libelle: string }[] }[] }>(tryPaths[idx])
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (sf) => {
              const subMap: Record<string, string[]> = {};
              if (sf && Array.isArray(sf.sousFamilles)) {
                for (const entry of sf.sousFamilles) {
                  subMap[entry.famille] = entry.sousFamilles.map(x => x.libelle);
                }
              }
              this.subFamiliesByFamily = subMap;
              onDone();
            },
            error: () => tryNext(idx + 1)
          });
      };
      tryNext(0);
    };

    const loadFamilies = (onDone: () => void) => {
      const tryPaths = [
        '/assets/data/familles.json',
        '/data/familles.json'
      ];
      const tryNext = (idx: number) => {
        if (idx >= tryPaths.length) {
          onDone();
          return;
        }
        this.http
          .get<{ familles: { univers: string; familles: { code: string; libelle: string; sousFamilles?: string[] }[] }[] }>(tryPaths[idx])
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (f) => {
              const famMap: Record<string, string[]> = {};
              if (f && Array.isArray(f.familles)) {
                for (const entry of f.familles) {
                  famMap[entry.univers] = entry.familles.map(x => x.libelle);
                  // Merge sous-familles from familles.json if provided
                  for (const x of entry.familles) {
                    if (Array.isArray(x.sousFamilles) && x.sousFamilles.length) {
                      const existing = this.subFamiliesByFamily[x.libelle] || [];
                      const merged = Array.from(new Set([...
                        existing,
                        ...x.sousFamilles
                      ]));
                      this.subFamiliesByFamily[x.libelle] = merged;
                    }
                  }
                }
              }
              this.familiesByUnivers = famMap;
              onDone();
            },
            error: () => tryNext(idx + 1)
          });
      };
      tryNext(0);
    };

    // Charger les deux jeux de taxonomies puis initialiser
    let subDone = false;
    let famDone = false;
    const maybeInit = () => {
      if (subDone && famDone) {
        this.initTrunkData();
      }
    };
    loadSubFamilies(() => { subDone = true; maybeInit(); });
    loadFamilies(() => { famDone = true; maybeInit(); });
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
    // Nouvelle hiérarchie: tronc > niveau > univers > famille > sous-famille
    if (node.type === 'niveau') {
      const lvl = this.parseLevelFromNodeName(node.name);
      this.currentFilter = { level: lvl || undefined, univers: undefined, famille: undefined, sousFamille: undefined };
    } else if (node.type === 'rayon') { // univers
      const parentLevelNode = this.findParentLevelForUnivers(node);
      const lvl = parentLevelNode ? this.parseLevelFromNodeName(parentLevelNode.name) : null;
      this.currentFilter = { level: lvl || undefined, univers: node.name, famille: undefined, sousFamille: undefined };
    } else if (node.type === 'famille') {
      const parents = this.findParentPathForFamily(node);
      const lvl = parents.levelNode ? this.parseLevelFromNodeName(parents.levelNode.name) : null;
      this.currentFilter = { level: lvl || undefined, univers: parents.universNode?.name || undefined, famille: node.name, sousFamille: undefined };
    } else if (node.type === 'sous-famille') {
      const parents = this.findParentPathForSubFamily(node);
      const lvl = parents.levelNode ? this.parseLevelFromNodeName(parents.levelNode.name) : null;
      this.currentFilter = { level: lvl || undefined, univers: parents.universNode?.name || undefined, famille: parents.familleNode?.name || '', sousFamille: node.name };
    } else {
      this.currentFilter = null;
    }
    
    this.applyCurrentFilter();
  }

  /**
   * Trouve le nœud univers parent d'un nœud famille
   */
  // Nouveau: trouve le parent niveau d'un nœud famille
  private findParentLevelForUnivers(universNode: TrunkHierarchyNode): TrunkHierarchyNode | null {
    for (const rootNode of this.hierarchyNodes) {
      if (rootNode.children) {
        for (const levelNode of rootNode.children) {
          if (levelNode.children) {
            for (const univers of levelNode.children) {
              if (univers.id === universNode.id) {
                return levelNode;
              }
            }
          }
        }
      }
    }
    return null;
  }

  private findParentPathForFamily(familleNode: TrunkHierarchyNode): { levelNode: TrunkHierarchyNode | null, universNode: TrunkHierarchyNode | null } {
    for (const rootNode of this.hierarchyNodes) {
      if (rootNode.children) {
        for (const levelNode of rootNode.children) {
          if (levelNode.children) {
            for (const universNode of levelNode.children) {
              if (universNode.children) {
                for (const famille of universNode.children) {
                  if (famille.id === familleNode.id) {
                    return { levelNode, universNode };
                  }
                }
              }
            }
          }
        }
      }
    }
    return { levelNode: null, universNode: null };
  }

  // Nouveau: trouve la chaîne de parents (niveau, famille) pour un nœud sous-famille
  private findParentPathForSubFamily(sousFamilleNode: TrunkHierarchyNode): { levelNode: TrunkHierarchyNode | null, universNode: TrunkHierarchyNode | null, familleNode: TrunkHierarchyNode | null } {
    for (const rootNode of this.hierarchyNodes) {
      if (rootNode.children) {
        for (const levelNode of rootNode.children) {
          if (levelNode.children) {
            for (const universNode of levelNode.children) {
              if (universNode.children) {
                for (const familleNode of universNode.children) {
                  if (familleNode.children) {
                    for (const child of familleNode.children) {
                      if (child.id === sousFamilleNode.id) {
                        return { levelNode, universNode, familleNode };
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return { levelNode: null, universNode: null, familleNode: null };
  }

  /**
   * Trouve la hiérarchie complète des parents d'un nœud sous-famille
   */
  // Ancienne recherche de hiérarchie univers/famille remplacée par findParentPathForSubFamily

  /**
   * Applique le filtre actuel sur tous les articles
   */
  private applyCurrentFilter(): void {
    if (!this.currentFilter) {
      this.filteredArticles = [...this.allArticles];
    } else {
      this.filteredArticles = this.allArticles.filter(article => {
        // Filtrer par niveau
        if (this.currentFilter!.level !== undefined && article.level !== this.currentFilter!.level) {
          return false;
        }

        // Filtrer par univers si spécifié
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
  updateFilteredArticles(): void {
    // Base: filtre hiérarchique
    let base = this.getFilteredArticlesByHierarchy();
    // Appliquer filtres Vendable / Commandable (OR lorsque les deux sont cochés)
    base = base.filter(a => {
      if (this.filterVendable && this.filterCommandable) {
        return !!(a.vendable?.actif) || !!(a.commandable?.actif);
      } else if (this.filterVendable) {
        return !!(a.vendable?.actif);
      } else if (this.filterCommandable) {
        return !!(a.commandable?.actif);
      }
      return true;
    });
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
      // Filtrer par niveau si spécifié
      if (this.currentFilter!.level !== undefined && article.level !== this.currentFilter!.level) {
        return false;
      }

      // Filtrer par univers si spécifié
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

      const codesSet = new Set(articleCodes);
      this.allArticles = this.allArticles.map(a => {
        if (!codesSet.has(a.code)) return a;
        return { ...a, deployment_typology: typology };
      });
      this.updateFilteredArticles();

      this.articlesService.updateDeploymentTypologyForArticles(articleCodes, typology)
        .pipe(takeUntil(this.destroy$))
        .subscribe();
    });
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

    let parts: string[] = [];
    if (this.currentFilter.level !== undefined) {
      parts.push(`Niveau ${this.currentFilter.level}`);
    }
    if (this.currentFilter.univers) {
      parts.push(this.currentFilter.univers);
    }
    if (this.currentFilter.famille) {
      parts.push(this.currentFilter.famille);
    }
    if (this.currentFilter.sousFamille) {
      parts.push(this.currentFilter.sousFamille);
    }
    return parts.join(' > ');
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
        return this.getSelectedCount();
      case 'sous-famille':
        return this.getSelectedCountForSousFamille(node.name);
      case 'famille':
        return this.getSelectedCountForFamille(node.name);
      case 'rayon':
        return this.getSelectedCountForUnivers(node.name);
      case 'niveau': {
        const lvl = this.parseLevelFromNodeName(node.name);
        if (!lvl) return 0;
        const articlesAtLevel = this.allArticles.filter(a => a.level === lvl);
        return articlesAtLevel.filter(a => this.selectedArticles.has(a.code)).length;
      }
      default:
        return 0;
    }
  }

  private parseLevelFromNodeName(name: string): number | null {
    const match = /Niveau\s+(\d+)/i.exec(name);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Actions de la sidebar droite (parité avec l'interface bulk)
   */

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


  onEditStartDate(): void {
    const selectedCount = this.getSelectedCount();
    if (selectedCount === 0) {
      return;
    }
    const dialogRef = this.dialog.open(StartDateDialogComponent, {
      width: '520px',
      data: { selectedCount }
    });
    dialogRef.afterClosed().subscribe((result: StartDateDialogResult | undefined) => {
      if (!result || !result.date || !result.metatype) return;
      const metatype = result.metatype; // 'commandable' | 'vendable'
      const dateStr = this.formatDateFR(result.date);

      this.dialog.open(StartDateConfirmDialogComponent, {
        width: '520px',
        data: {
          selectedCount,
          metatypeLabel: metatype === 'commandable' ? 'Commandable' : 'Vendable',
          dateLabel: dateStr
        }
      }).afterClosed().subscribe(confirmed => {
        if (!confirmed) return;
        const articleCodes = Array.from(this.selectedArticles);
        const trunkId = this.trunkId || this.currentTrunkIdGuess(articleCodes);

        // Mise à jour optimiste côté client
        const codesSet = new Set(articleCodes);
        this.allArticles = this.allArticles.map(a => {
          if (!codesSet.has(a.code)) return a;
          const block = a[metatype] || { dateDebut: null, dateFin: null, actif: metatype === 'vendable' };
          return { ...a, [metatype]: { ...block, dateDebut: dateStr } } as Article;
        });
        this.updateFilteredArticles();

        // Persistance côté serveur puis refresh des données pour refléter article_assorti.json
        this.articlesService.updateStartDateForArticles(articleCodes, trunkId!, metatype, dateStr)
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {});
      });
    });
  }

  onEditEndDate(): void {
    const selectedCount = this.getSelectedCount();
    if (selectedCount === 0) {
      return;
    }
    const dialogRef = this.dialog.open(EndDateDialogComponent, {
      width: '520px',
      data: { selectedCount }
    });
    dialogRef.afterClosed().subscribe((result: EndDateDialogResult | undefined) => {
      if (!result) return;
      const metatype = result.metatype; // 'commandable' | 'vendable'
      const dateStr = this.formatDateFR(new Date(result.dateFin));

      this.dialog.open(EndDateConfirmDialogComponent, {
        width: '520px',
        data: {
          selectedCount,
          metatype,
          dateFin: dateStr
        }
      }).afterClosed().subscribe(confirmed => {
        if (!confirmed) return;
        const articleCodes = Array.from(this.selectedArticles);
        const trunkId = this.trunkId || this.currentTrunkIdGuess(articleCodes);

        // Mise à jour optimiste côté client
        const codesSet = new Set(articleCodes);
        this.allArticles = this.allArticles.map(a => {
          if (!codesSet.has(a.code)) return a;
          const block = a[metatype] || { dateDebut: null, dateFin: null, actif: metatype === 'vendable' };
          return { ...a, [metatype]: { ...block, dateFin: dateStr } } as Article;
        });
        this.updateFilteredArticles();

        // Persistance côté serveur puis refresh des données pour refléter article_assorti.json
        this.articlesService.updateEndDateForArticles(articleCodes, trunkId!, metatype, dateStr)
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {});
      });
    });
  }

  onChangeLevel(): void {
    const selectedCount = this.getSelectedCount();
    if (selectedCount === 0) {
      return;
    }
    const articleCodes = Array.from(this.selectedArticles);
    const selectedArticles = this.allArticles.filter(a => this.selectedArticles.has(a.code));
    const currentLevelCandidate = selectedArticles.length === 1 ? selectedArticles[0].level : undefined;
    const dialogRef = this.dialog.open(ChangeLevelDialogComponent, {
      width: '480px',
      data: { currentLevel: currentLevelCandidate }
    });
    dialogRef.afterClosed().subscribe((result: ChangeLevelDialogResult | undefined) => {
      const selectedLevel = result?.selectedLevel;
      if (typeof selectedLevel === 'number' && selectedLevel >= 1) {
        // Demander confirmation avant d’appliquer et persister
        this.dialog.open(ChangeLevelConfirmDialogComponent, {
          width: '520px',
          data: { selectedCount, level: selectedLevel }
        }).afterClosed().subscribe(confirmed => {
          if (!confirmed) return;
          // Mise à jour optimiste côté client
          const codesSet = new Set(articleCodes);
          this.allArticles = this.allArticles.map(a => codesSet.has(a.code) ? { ...a, level: selectedLevel } : a);
          this.updateFilteredArticles();
          // Persist via service (écrit trunk_level dans le fichier)
          this.articlesService.updateLevelForArticles(articleCodes, selectedLevel)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {});
        });
      }
    });
  }

  private formatDateFR(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  private currentTrunkIdGuess(articleCodes: string[]): string | undefined {
    // Essaie de deviner un trunkId commun pour les articles sélectionnés
    const set = new Set<string>();
    for (const a of this.allArticles) {
      if (articleCodes.includes(a.code) && a.trunkId) set.add(a.trunkId);
    }
    return set.size === 1 ? Array.from(set)[0] : this.trunkId;
  }

  // plus de méthode locale; on passe par ArticlesService

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
