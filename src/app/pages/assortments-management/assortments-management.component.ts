import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter } from '@angular/material/core';
import { ArticlesService, Article } from '../../services/articles.service';
import { TrunksService, TrunkOption } from '../../services/trunks.service';
import { TrunkHierarchyNode, TreeNodeAction, TreeViewConfig } from '../../interfaces/trunk-hierarchy.interface';
import { GlobalTreeViewComponent } from '../../components/global-tree-view/global-tree-view.component';
import { ArticleListOneComponent } from '../../components/article-list-one/article-list-one.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-assortments-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, GlobalTreeViewComponent, ArticleListOneComponent, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './assortments-management.component.html',
  styleUrls: ['./assortments-management.component.scss']
})
export class AssortmentsManagementComponent implements OnInit {
  hierarchyNodes: TrunkHierarchyNode[] = [];
  treeConfig: TreeViewConfig = {
    showIcons: true,
    showArticleCount: true,
    allowMultipleSelection: false,
    expandOnClick: true,
    expandOnSelect: true,
    multiSelect: false
  };
  isLoading = true;
  allArticles: Article[] = [];
  filteredArticles: Article[] = [];
  selectedArticles = new Set<string>();
  pageSizeList = 30;
  currentPageList = 0;
  searchTerm = '';
  selectedNodeId: string | null = null;
  filterCommandable = false;
  filterVendable = false;
  includeAssignedToTrunk = false;
  onlyNonAssorted = false;
  selectedAssortTypes: string[] = [];

  trunkNameById: Record<string, string> = {};
  @ViewChild('deploymentTypologyDialog') deploymentTypologyDialog!: TemplateRef<any>;
  deploymentTypology: 'Ouvert' | 'Mixte' | 'Fermé' = 'Fermé';
  private typologyDialogRef: MatDialogRef<any> | undefined;
  @ViewChild('assortTypeDialog') assortTypeDialog!: TemplateRef<any>;
  private typeDialogRef: MatDialogRef<any> | undefined;
  assortmentType: 'permanent' | 'promotionnel' | 'catalogue' = 'permanent';
  @ViewChild('levelDialog') levelDialog!: TemplateRef<any>;
  private levelDialogRef: MatDialogRef<any> | undefined;
  selectedLevel?: number;
  trunkLevelLabels: Record<number, string> = {};
  @ViewChild('startDateDialog') startDateDialog!: TemplateRef<any>;
  @ViewChild('endDateDialog') endDateDialog!: TemplateRef<any>;
  private startDateDialogRef: MatDialogRef<any> | undefined;
  private endDateDialogRef: MatDialogRef<any> | undefined;
  startDate: Date | null = null;
  endDate: Date | null = null;
  @ViewChild('deliveryCadenceDialog') deliveryCadenceDialog!: TemplateRef<any>;
  private deliveryCadenceDialogRef: MatDialogRef<any> | undefined;
  deliveryCadence: { lundi: boolean; mardi: boolean; mercredi: boolean; jeudi: boolean; vendredi: boolean; samedi: boolean; dimanche: boolean } = { lundi: false, mardi: false, mercredi: false, jeudi: false, vendredi: false, samedi: false, dimanche: false };
  @ViewChild('stockThresholdDialog') stockThresholdDialog!: TemplateRef<any>;
  private stockThresholdDialogRef: MatDialogRef<any> | undefined;
  stockMin: number = 0;
  stockMax: number = 0;
  stockBackup: number = 0;

  constructor(private articles: ArticlesService, private snackBar: MatSnackBar, private trunks: TrunksService, private dialog: MatDialog, private http: HttpClient, private dateAdapter: DateAdapter<Date>) {}

  ngOnInit(): void {
    this.articles.setTrunkName('Boulanger');
    this.articles.getHierarchy().subscribe(nodes => {
      this.hierarchyNodes = nodes || [];
      this.isLoading = false;
    });
    this.articles.getArticles().subscribe(list => {
      this.allArticles = list || [];
      this.applyFilters();
    });
    this.trunks.getTrunkOptions().subscribe((options: TrunkOption[]) => {
      const map: Record<string, string> = {};
      (options || []).forEach(opt => { map[opt.id] = opt.name; });
      this.trunkNameById = map;
    });
    this.loadTrunkLevelLabels();
    this.dateAdapter.setLocale('fr-FR');
  }

  onNodeAction(evt: TreeNodeAction): void {
    if (evt.action === 'select') {
      this.selectedNodeId = evt.nodeId;
    } else if (evt.action === 'deselect') {
      this.selectedNodeId = null;
    }
    this.currentPageList = 0;
    this.applyFilters();
  }

  private getNodePathById(id: string | null): TrunkHierarchyNode[] {
    if (!id) return [];
    const path: TrunkHierarchyNode[] = [];
    const dfs = (nodes: TrunkHierarchyNode[], acc: TrunkHierarchyNode[]): boolean => {
      for (const n of nodes) {
        const nextAcc = [...acc, n];
        if (n.id === id) {
          path.push(...nextAcc);
          return true;
        }
        if (n.children && dfs(n.children, nextAcc)) return true;
      }
      return false;
    };
    dfs(this.hierarchyNodes, []);
    return path;
  }

  private applyFilters(): void {
    let list = this.allArticles;
    const path = this.getNodePathById(this.selectedNodeId);
    const leaf = path.length ? path[path.length - 1] : null;
    if (leaf) {
      if (leaf.type === 'department') {
        list = list.filter(a => a.univers === leaf.name);
      } else if (leaf.type === 'famille') {
        const dept = path.find(p => p.type === 'department');
        if (dept) list = list.filter(a => a.univers === dept.name && a.famille === leaf.name);
        else list = list.filter(a => a.famille === leaf.name);
      } else if (leaf.type === 'sous-famille') {
        const dept = path.find(p => p.type === 'department');
        const fam = path.find(p => p.type === 'famille');
        if (dept && fam) list = list.filter(a => a.univers === dept.name && a.famille === fam.name && a.sousFamille === leaf.name);
        else list = list.filter(a => a.sousFamille === leaf.name);
      }
    }
    if (this.searchTerm && this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(a =>
        a.libelle.toLowerCase().includes(term) ||
        a.code.toLowerCase().includes(term) ||
        a.univers.toLowerCase().includes(term) ||
        a.famille.toLowerCase().includes(term) ||
        a.sousFamille.toLowerCase().includes(term)
      );
    }
    if (!this.includeAssignedToTrunk) {
      list = list.filter(a => !a.trunkId);
    }
    if (this.filterCommandable) {
      list = list.filter(a => !!a.commandable?.actif);
    }
    if (this.filterVendable) {
      list = list.filter(a => !!a.vendable?.actif);
    }
    if (this.onlyNonAssorted) {
      list = list.filter(a => !a.commandable?.actif && !a.vendable?.actif);
    }
    if (this.selectedAssortTypes && this.selectedAssortTypes.length > 0) {
      list = list.filter(a => {
        const t = this.getAssortType(a);
        return t ? this.selectedAssortTypes.includes(t) : false;
      });
    }
    this.filteredArticles = list;
  }

  areAllPagedSelected(): boolean {
    const pageArticles = this.getCurrentPageArticles();
    return pageArticles.length > 0 && pageArticles.every(a => this.selectedArticles.has(a.code));
  }

  areSomePagedSelected(): boolean {
    const pageArticles = this.getCurrentPageArticles();
    const count = pageArticles.filter(a => this.selectedArticles.has(a.code)).length;
    return count > 0 && count < pageArticles.length;
  }

  isArticleSelected(code: string): boolean {
    return this.selectedArticles.has(code);
  }

  onArticleSelect(code: string, checked: boolean): void {
    if (checked) this.selectedArticles.add(code);
    else this.selectedArticles.delete(code);
  }

  hasVendable(code: string): boolean {
    const a = this.allArticles.find(x => x.code === code);
    return !!a?.vendable?.actif;
  }

  hasCommandable(code: string): boolean {
    const a = this.allArticles.find(x => x.code === code);
    return !!a?.commandable?.actif;
  }

  firstPage(): void { this.currentPageList = 0; }
  prevPage(): void { if (this.currentPageList > 0) this.currentPageList--; }
  nextPage(): void {
    const maxPage = Math.max(0, Math.floor((this.filteredArticles.length - 1) / this.pageSizeList));
    if (this.currentPageList < maxPage) this.currentPageList++;
  }
  lastPage(): void {
    this.currentPageList = Math.max(0, Math.floor((this.filteredArticles.length - 1) / this.pageSizeList));
  }

  toggleAllPaged(): void {
    const page = this.getCurrentPageArticles();
    const allSelected = page.every(a => this.selectedArticles.has(a.code));
    if (allSelected) {
      page.forEach(a => this.selectedArticles.delete(a.code));
    } else {
      page.forEach(a => this.selectedArticles.add(a.code));
    }
  }

  onSearchChange(term: string): void {
    this.searchTerm = term || '';
    this.currentPageList = 0;
    this.applyFilters();
  }

  onFiltersChange(): void {
    this.currentPageList = 0;
    this.applyFilters();
  }

  private getAssortType(a: Article): string | null {
    const c = a.commandable;
    const v = a.vendable;
    const isCmd = !!c?.actif;
    const isVend = !!v?.actif;
    const hasDates = !!(c?.dateDebut || c?.dateFin || v?.dateDebut || v?.dateFin);
    if (isCmd && !isVend) return hasDates ? 'promotionnel' : 'catalogue';
    if (isVend || isCmd) return hasDates ? 'promotionnel' : 'permanent';
    return null;
  }

  getAssortTypeShort(a: Article): string {
    const t = this.getAssortType(a);
    if (!t) return '';
    if (t === 'permanent') return 'perma';
    if (t === 'promotionnel') return 'promo';
    if (t === 'catalogue') return 'cata';
    return t;
  }

  private getCurrentPageArticles(): Article[] {
    const start = this.currentPageList * this.pageSizeList;
    const end = start + this.pageSizeList;
    return this.filteredArticles.slice(start, end);
  }

  changeStartDate(): void {
    this.startDate = null;
    this.startDateDialogRef = this.dialog.open(this.startDateDialog, { width: '420px' });
  }
  applyStartDate(): void {
    this.startDateDialogRef?.close();
    this.startDateDialogRef = undefined;
  }
  cancelStartDate(): void {
    this.startDateDialogRef?.close();
    this.startDateDialogRef = undefined;
  }

  changeEndDate(): void {
    this.endDate = null;
    this.endDateDialogRef = this.dialog.open(this.endDateDialog, { width: '420px' });
  }
  applyEndDate(): void {
    this.endDateDialogRef?.close();
    this.endDateDialogRef = undefined;
  }
  cancelEndDate(): void {
    this.endDateDialogRef?.close();
    this.endDateDialogRef = undefined;
  }

  changeDeploymentTypology(): void {
    this.typologyDialogRef = this.dialog.open(this.deploymentTypologyDialog, { width: '420px' });
  }

  applyDeploymentTypology(): void {
    this.typologyDialogRef?.close();
    this.typologyDialogRef = undefined;
  }

  cancelDeploymentTypology(): void {
    this.typologyDialogRef?.close();
    this.typologyDialogRef = undefined;
  }

  changeType(): void {
    this.typeDialogRef = this.dialog.open(this.assortTypeDialog, { width: '420px' });
  }
  applyChangeType(): void {
    this.typeDialogRef?.close();
    this.typeDialogRef = undefined;
  }
  cancelChangeType(): void {
    this.typeDialogRef?.close();
    this.typeDialogRef = undefined;
  }

  editLevel(): void {
    if (!Object.keys(this.trunkLevelLabels).length) this.loadTrunkLevelLabels();
    const items = this.getLevelItems();
    this.selectedLevel = items[0]?.level;
    this.levelDialogRef = this.dialog.open(this.levelDialog, { width: '420px' });
  }
  applyEditLevel(): void {
    this.levelDialogRef?.close();
    this.levelDialogRef = undefined;
  }
  cancelEditLevel(): void {
    this.levelDialogRef?.close();
    this.levelDialogRef = undefined;
  }

  private loadTrunkLevelLabels(): void {
    this.http.get<{ trunkLevels: { level: number; label: string }[] }>("/data/trunk-levels.json").subscribe(json => {
      const map: Record<number, string> = {};
      const items = (json?.trunkLevels || []).slice().sort((a, b) => a.level - b.level);
      items.forEach(i => { map[Number(i.level)] = String(i.label); });
      if (!Object.keys(map).length) {
        [1,2,3,4,5].forEach(l => { map[l] = this.getFallbackLabel(l); });
      }
      this.trunkLevelLabels = map;
    }, () => {
      const map: Record<number, string> = {};
      [1,2,3,4,5].forEach(l => { map[l] = this.getFallbackLabel(l); });
      this.trunkLevelLabels = map;
    });
  }

  private getFallbackLabel(level: number): string {
    if (level === 1) return 'Mini';
    if (level === 2) return 'classic';
    if (level === 3) return 'grand';
    if (level === 4) return 'géant';
    if (level === 5) return 'maxi';
    return `Niveau ${level}`;
  }

  getLevelItems(): { level: number; label: string }[] {
    const entries = Object.entries(this.trunkLevelLabels).map(([k, v]) => ({ level: Number(k), label: String(v) }));
    return entries.sort((a, b) => a.level - b.level);
  }

  editPurchaseConditions(): void {
    this.snackBar.open("Conditions d'achat", undefined, { duration: 2000 });
  }

  editDeliveryCadence(): void {
    this.deliveryCadenceDialogRef = this.dialog.open(this.deliveryCadenceDialog, { width: '420px' });
  }
  applyDeliveryCadence(): void {
    this.deliveryCadenceDialogRef?.close();
    this.deliveryCadenceDialogRef = undefined;
  }
  cancelDeliveryCadence(): void {
    this.deliveryCadenceDialogRef?.close();
    this.deliveryCadenceDialogRef = undefined;
  }

  editStockThreshold(): void {
    this.stockThresholdDialogRef = this.dialog.open(this.stockThresholdDialog, { width: '420px' });
  }

  applyStockThreshold(): void {
    this.stockThresholdDialogRef?.close();
    this.stockThresholdDialogRef = undefined;
  }

  cancelStockThreshold(): void {
    this.stockThresholdDialogRef?.close();
    this.stockThresholdDialogRef = undefined;
  }

  toInt(x: any): number {
    const n = Number(x);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.floor(n));
  }

  editSellStatus(): void {
    this.snackBar.open('Gestion du statut', undefined, { duration: 2000 });
  }

  createCommandable(): void {
    this.snackBar.open('Créer Commandable', undefined, { duration: 2000 });
  }

  createVendable(): void {
    this.snackBar.open('Créer Vendable', undefined, { duration: 2000 });
  }
}
