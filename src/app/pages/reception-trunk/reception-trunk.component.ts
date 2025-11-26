import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { TextboxList1Component } from '../../components/textbox-list1/textbox-list1.component';
import { TextboxList2Component } from '../../components/textbox-list2/textbox-list2.component';

interface Article {
  reference: string;
  libelle: string;
  famille: string;
  sousFamille: string;
  checked?: boolean;
  checkedCommandable?: boolean;
  checkedVendable?: boolean;
  type: 'ferme' | 'mixte' | 'ouvert';
}

@Component({
  selector: 'app-reception-trunk',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, TextboxList1Component, TextboxList2Component],
  templateUrl: './reception-trunk.component.html',
  styleUrls: ['./reception-trunk.component.scss']
})
export class ReceptionTrunkComponent implements OnInit {
  
  selectedMeta: 'commandable' | 'vendable' = 'commandable';
  outerTabIndex: number = 0;
  selectedTab: 'ferme' | 'mixte' | 'ouvert' | 'niveau_superieur' = 'ferme';
  selectedTabIndex: number = 0;
  filterText: string = '';
  displayedColumns: string[] = ['checkbox', 'reference', 'libelle'];
  trunkName: string = 'TAC Accessoire cuisine';
  
  articles: Article[] = [
    // Articles Fermés
    { reference: 'ART001', libelle: 'Spatule en silicone', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'ferme' },
    { reference: 'ART002', libelle: 'Fouet inox', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'ferme' },
    { reference: 'ART003', libelle: 'Louche inox', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'ferme' },
    { reference: 'ART004', libelle: 'Écumoire inox', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'ferme' },
    { reference: 'ART005', libelle: 'Maryse pâtisserie', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'ferme' },
    { reference: 'ART006', libelle: 'Cuillère en bois', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'ferme' },
    { reference: 'ART007', libelle: 'Pinces de cuisine', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'ferme' },
    { reference: 'ART008', libelle: 'Rouleau à pâtisserie', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'ferme' },
    { reference: 'ART009', libelle: 'Balance de cuisine', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'ferme' },
    { reference: 'ART010', libelle: 'Thermomètre de cuisine', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'ferme' },
    { reference: 'ART011', libelle: 'Minuteur mécanique', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'ferme' },
    { reference: 'ART012', libelle: 'Set de cuillères doseuses', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'ferme' },
    { reference: 'ART013', libelle: 'Passoire inox', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'ferme' },
    { reference: 'ART014', libelle: 'Tamis pâtisserie', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'ferme' },
    { reference: 'ART015', libelle: 'Râpe multi-usages', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'ferme' },
    { reference: 'ART016', libelle: 'Mandoline de cuisine', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'ferme' },
    { reference: 'ART017', libelle: 'Ouvre-boîte métal', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'ferme' },
    { reference: 'ART018', libelle: 'Tire-bouchon inox', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'ferme' },
    { reference: 'ART019', libelle: 'Planche à découper', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'ferme' },
    { reference: 'ART020', libelle: 'Entonnoir cuisine', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'ferme' },

    // Articles Mixtes
    { reference: 'ART021', libelle: 'Saladier inox', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'mixte' },
    { reference: 'ART022', libelle: 'Bol mélangeur gradué', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'mixte' },
    { reference: 'ART023', libelle: 'Boîte hermétique 1L', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'mixte' },
    { reference: 'ART024', libelle: 'Range épices (12 pcs)', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'mixte' },
    { reference: 'ART025', libelle: 'Carafe filtrante', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'mixte' },
    { reference: 'ART026', libelle: 'Bec verseur huile', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'mixte' },
    { reference: 'ART027', libelle: 'Entonnoir inox', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'mixte' },
    { reference: 'ART028', libelle: 'Porte-couteaux magnétique', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'mixte' },
    { reference: 'ART029', libelle: 'Égouttoir vaisselle', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'mixte' },
    { reference: 'ART030', libelle: 'Support casseroles', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'mixte' },
    { reference: 'ART031', libelle: 'Gants anti-chaleur', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'mixte' },
    { reference: 'ART032', libelle: 'Sous-verres liège (6)', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'mixte' },
    { reference: 'ART033', libelle: 'Huilier verre', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'mixte' },
    { reference: 'ART034', libelle: 'Essoreuse à salade', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'mixte' },
    { reference: 'ART035', libelle: 'Presse-ail inox', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: true, type: 'mixte' },

    // Articles Ouverts
    { reference: 'ART036', libelle: 'Moule à cake anti-adhésif', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: false, type: 'ouvert' },
    { reference: 'ART037', libelle: 'Moule à tarte perforé', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: false, type: 'ouvert' },
    { reference: 'ART038', libelle: 'Plaque de four', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: false, type: 'ouvert' },
    { reference: 'ART039', libelle: 'Tapis silicone pâtisserie', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: false, type: 'ouvert' },
    { reference: 'ART040', libelle: 'Papier cuisson (lot)', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: false, type: 'ouvert' },
    { reference: 'ART041', libelle: 'Emporte-pièces (10 pcs)', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: false, type: 'ouvert' },
    { reference: 'ART042', libelle: 'Poches pâtisserie (jetables)', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: false, type: 'ouvert' },
    { reference: 'ART043', libelle: 'Douilles pâtisserie (12)', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: false, type: 'ouvert' },
    { reference: 'ART044', libelle: 'Pinceau de cuisine', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: false, type: 'ouvert' },
    { reference: 'ART045', libelle: 'Torchons cuisine (lot)', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: false, type: 'ouvert' },
    { reference: 'ART046', libelle: 'Sets de table (4)', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: false, type: 'ouvert' },
    { reference: 'ART047', libelle: 'Bouteille isotherme', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: false, type: 'ouvert' },
    { reference: 'ART048', libelle: 'Gants de four', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: false, type: 'ouvert' },
    { reference: 'ART049', libelle: 'Set de maniques', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: false, type: 'ouvert' },
    { reference: 'ART050', libelle: 'Dessous-de-plat métal', famille: 'Électroménager', sousFamille: 'Accessoires de cuisine', checked: false, type: 'ouvert' }
  ];

  superiorLevelArticles: Article[] = [];

  ngOnInit(): void {
    for (let i = 1; i <= 30; i++) {
      const ref = `ELM${String(i).padStart(3, '0')}`;
      this.superiorLevelArticles.push({
        reference: ref,
        libelle: `Article Électroménager ${i}`,
        famille: 'Électroménager',
        sousFamille: 'Divers',
        checked: false,
        type: 'mixte'
      });
    }
    // Initialiser les états de sélection par métatype
    this.articles.forEach(a => {
      const base = !!a.checked;
      a.checkedCommandable = base;
      a.checkedVendable = base;
    });
    this.superiorLevelArticles.forEach(a => {
      const base = !!a.checked;
      a.checkedCommandable = base;
      a.checkedVendable = base;
    });
    this.rebuildLists();
  }

  private buildTreeFrom(articles: Article[]): Record<string, string[]> {
    const tree: Record<string, string[]> = {};
    for (const a of articles) {
      const fam = a.famille || '';
      const sf = a.sousFamille || '';
      if (!fam) continue;
      tree[fam] = tree[fam] || [];
      if (sf && !tree[fam].includes(sf)) tree[fam].push(sf);
    }
    return tree;
  }

  get trunkTree(): Record<string, string[]> {
    return this.buildTreeFrom(this.articles);
  }

  get storeTree(): Record<string, string[]> {
    const store = this.articles.filter(a => !!a.checked);
    return this.buildTreeFrom(store);
  }

  // États d'interaction des arborescences
  expandedTrunkFamilies = new Set<string>();
  expandedStoreFamilies = new Set<string>();
  selectedTrunkNode: { famille: string; sousFamille?: string } | null = null;
  selectedStoreNode: { famille: string; sousFamille?: string } | null = null;
  isSuperiorSelected: boolean = false;

  isTrunkFamilyExpanded(famille: string): boolean {
    return this.expandedTrunkFamilies.has(famille);
  }

  toggleTrunkFamily(famille: string, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (this.expandedTrunkFamilies.has(famille)) {
      this.expandedTrunkFamilies.delete(famille);
    } else {
      this.expandedTrunkFamilies.add(famille);
    }
  }

  onSelectTrunkNode(famille: string, sousFamille?: string): void {
    this.selectedTrunkNode = { famille, sousFamille };
    if (famille === 'Niveau supérieur') {
      this.isSuperiorSelected = true;
      this.selectTab('niveau_superieur');
    } else {
      if (this.isSuperiorSelected) {
        this.isSuperiorSelected = false;
        if (this.selectedTab === 'niveau_superieur') {
          this.selectTab('mixte');
        }
      }
    }
  }

  isStoreFamilyExpanded(famille: string): boolean {
    return this.expandedStoreFamilies.has(famille);
  }

  toggleStoreFamily(famille: string, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (this.expandedStoreFamilies.has(famille)) {
      this.expandedStoreFamilies.delete(famille);
    } else {
      this.expandedStoreFamilies.add(famille);
    }
  }

  onSelectStoreNode(famille: string, sousFamille?: string): void {
    this.selectedStoreNode = { famille, sousFamille };
  }

  // Listes centrales (format Référencement 2)
  listItemsLeft: { id: string; code: string; designation: string; state?: 'brouillon' | 'référencé' }[] = [];
  listItemsRight: { id: string; code: string; designation: string; state?: 'brouillon' | 'référencé' }[] = [];
  leftFilterText: string = '';
  rightFilterText: string = '';
  pageSizeLeft: number = 20;
  pageSizeRight: number = 20;
  currentPageLeft: number = 0;
  currentPageRight: number = 0;
  selectedIds = new Set<string>();
  selectedRightIds = new Set<string>();
  movedIdsRight = new Set<string>();

  private rebuildLists(): void {
    this.listItemsLeft = this.articles.map(a => ({ id: a.reference, code: a.reference, designation: a.libelle, state: 'brouillon' }));
    this.listItemsRight = this.articles.filter(a => !!a.checked).map(a => ({ id: a.reference, code: a.reference, designation: a.libelle, state: 'référencé' }));
    this.movedIdsRight = new Set(this.listItemsRight.map(it => it.id));
    this.currentPageLeft = 0;
    this.currentPageRight = 0;
  }


  onFilterLeftChange(term: string): void {
    this.leftFilterText = term || '';
  }

  onFilterRightChange(term: string): void {
    this.rightFilterText = term || '';
  }

  pagedLeftItems(): { id: string; code: string; designation: string; state?: 'brouillon' | 'référencé' }[] {
    const start = this.currentPageLeft * this.pageSizeLeft;
    const src = this.listItemsLeft.filter(it => !this.leftFilterText || it.code.toLowerCase().includes(this.leftFilterText.toLowerCase()) || it.designation.toLowerCase().includes(this.leftFilterText.toLowerCase()));
    return src.slice(start, start + this.pageSizeLeft);
  }

  pagedRightItems(): { id: string; code: string; designation: string; state?: 'brouillon' | 'référencé' }[] {
    const start = this.currentPageRight * this.pageSizeRight;
    const src = this.listItemsRight.filter(it => !this.rightFilterText || it.code.toLowerCase().includes(this.rightFilterText.toLowerCase()) || it.designation.toLowerCase().includes(this.rightFilterText.toLowerCase()));
    return src.slice(start, start + this.pageSizeRight);
  }

  areAllPagedSelectedLeft(): boolean {
    const ids = this.pagedLeftItems().map(it => it.id);
    return ids.length > 0 && ids.every(id => this.selectedIds.has(id));
  }

  areSomePagedSelectedLeft(): boolean {
    const ids = this.pagedLeftItems().map(it => it.id);
    return ids.some(id => this.selectedIds.has(id)) && !this.areAllPagedSelectedLeft();
  }

  areAllPagedSelectedRight(): boolean {
    const ids = this.pagedRightItems().map(it => it.id).filter(id => this.movedIdsRight.has(id));
    return ids.length > 0 && ids.every(id => this.selectedRightIds.has(id));
  }

  areSomePagedSelectedRight(): boolean {
    const ids = this.pagedRightItems().map(it => it.id).filter(id => this.movedIdsRight.has(id));
    return ids.some(id => this.selectedRightIds.has(id)) && !this.areAllPagedSelectedRight();
  }

  toggleAllLeft(): void {
    const ids = this.pagedLeftItems().map(it => it.id);
    const allSelected = ids.length > 0 && ids.every(id => this.selectedIds.has(id));
    if (allSelected) ids.forEach(id => this.selectedIds.delete(id));
    else ids.forEach(id => this.selectedIds.add(id));
  }

  toggleAllRight(): void {
    const ids = this.pagedRightItems().map(it => it.id).filter(id => this.movedIdsRight.has(id));
    const allSelected = ids.length > 0 && ids.every(id => this.selectedRightIds.has(id));
    if (allSelected) ids.forEach(id => this.selectedRightIds.delete(id));
    else ids.forEach(id => this.selectedRightIds.add(id));
  }

  firstPageLeft(): void { this.currentPageLeft = 0; }
  prevPageLeft(): void { this.currentPageLeft = Math.max(0, this.currentPageLeft - 1); }
  nextPageLeft(): void {
    const hasNext = (this.currentPageLeft + 1) * this.pageSizeLeft < this.listItemsLeft.length;
    if (hasNext) this.currentPageLeft += 1;
  }
  lastPageLeft(): void {
    const last = Math.max(0, Math.floor((this.listItemsLeft.length - 1) / this.pageSizeLeft));
    this.currentPageLeft = last;
  }

  firstPageRight(): void { this.currentPageRight = 0; }
  prevPageRight(): void { this.currentPageRight = Math.max(0, this.currentPageRight - 1); }
  nextPageRight(): void {
    const hasNext = (this.currentPageRight + 1) * this.pageSizeRight < this.listItemsRight.length;
    if (hasNext) this.currentPageRight += 1;
  }
  lastPageRight(): void {
    const last = Math.max(0, Math.floor((this.listItemsRight.length - 1) / this.pageSizeRight));
    this.currentPageRight = last;
  }

  toggleSelection(it: { id: string }): void {
    if (this.selectedIds.has(it.id)) this.selectedIds.delete(it.id);
    else this.selectedIds.add(it.id);
  }

  toggleSelectionRight(it: { id: string }): void {
    if (!this.movedIdsRight.has(it.id)) return;
    if (this.selectedRightIds.has(it.id)) this.selectedRightIds.delete(it.id);
    else this.selectedRightIds.add(it.id);
  }

  isMovedRight(id: string): boolean { return this.movedIdsRight.has(id); }
  isRightItemSelectable(id: string): boolean { return this.movedIdsRight.has(id); }

  

  get filteredArticles(): Article[] {
    const base = this.selectedTab === 'niveau_superieur'
      ? this.superiorLevelArticles
      : this.articles.filter(article => article.type === this.selectedTab);
    return base.filter(article => 
      !this.filterText || 
      article.reference.toLowerCase().includes(this.filterText.toLowerCase()) ||
      article.libelle.toLowerCase().includes(this.filterText.toLowerCase()) ||
      article.famille.toLowerCase().includes(this.filterText.toLowerCase())
    );
  }

  selectTab(tab: 'ferme' | 'mixte' | 'ouvert' | 'niveau_superieur'): void {
    this.selectedTab = tab;
  }

  toggleAll(checked: boolean): void {
    this.filteredArticles.forEach(article => {
      this.setChecked(article, checked);
    });
  }

  isCheckboxDisabled(): boolean {
    return this.selectedTab === 'ferme'; // Verrouiller les checkboxes dans l'onglet fermé
  }

  exportList(): void {
    const selectedArticles = this.filteredArticles.filter(article => this.getChecked(article));
    console.log('Articles sélectionnés pour export:', selectedArticles);
    // Ici vous pouvez ajouter la logique d'export
  }

  getTabIcon(tab: string): string {
    switch(tab) {
      case 'ferme': return 'lock';
      case 'mixte': return 'settings';
      case 'ouvert': return 'check_circle';
      default: return '';
    }
  }

  getTabLabel(tab: string): string {
    switch(tab) {
      case 'ferme': return 'Fermé';
      case 'mixte': return 'Mixte';
      case 'ouvert': return 'Ouvert';
      default: return '';
    }
  }

  onTabChange(event: any): void {
    const tabs: Array<'ferme' | 'mixte' | 'ouvert' | 'niveau_superieur'> = ['ferme', 'mixte', 'ouvert', 'niveau_superieur'];
    this.selectedTab = tabs[event.index];
    this.selectedTabIndex = event.index;
  }

  onOuterTabChange(event: any): void {
    const metas: Array<'commandable' | 'vendable'> = ['commandable', 'vendable'];
    this.selectedMeta = metas[event.index];
    this.outerTabIndex = event.index;
  }

  areAllSelected(): boolean {
    const filtered = this.filteredArticles;
    return filtered.length > 0 && filtered.every(article => this.getChecked(article));
  }

  isIndeterminate(): boolean {
    const filtered = this.filteredArticles;
    const checkedCount = filtered.filter(article => this.getChecked(article)).length;
    return checkedCount > 0 && checkedCount < filtered.length;
  }

  getSelectedCount(): number {
    return this.filteredArticles.filter(article => this.getChecked(article)).length;
  }

  getTotalSelectedCount(): number {
    return this.articles.filter(article => this.getChecked(article)).length;
  }

  // Nombre d'articles sélectionnés par onglet
  getSelectedCountByTab(tab: 'ferme' | 'mixte' | 'ouvert' | 'niveau_superieur'): number {
    if (tab === 'niveau_superieur') {
      return this.superiorLevelArticles.filter(article => this.getChecked(article)).length;
    }
    return this.articles.filter(article => article.type === tab && this.getChecked(article)).length;
  }

  masterToggle(): void {
    const filtered = this.filteredArticles;
    const allSelected = this.areAllSelected();
    
    filtered.forEach(article => {
      this.setChecked(article, !allSelected);
    });
  }

  // Helpers sélection par métatype
  getChecked(article: Article): boolean {
    return this.selectedMeta === 'commandable' ? !!article.checkedCommandable : !!article.checkedVendable;
  }

  setChecked(article: Article, value: boolean): void {
    if (this.selectedMeta === 'commandable') {
      article.checkedCommandable = value;
    } else {
      article.checkedVendable = value;
    }
  }
  
  getMetaSelectedCount(meta: 'commandable' | 'vendable'): number {
    const inMain = this.articles.filter(a => meta === 'commandable' ? !!a.checkedCommandable : !!a.checkedVendable).length;
    const inSuperior = this.superiorLevelArticles.filter(a => meta === 'commandable' ? !!a.checkedCommandable : !!a.checkedVendable).length;
    return inMain + inSuperior;
  }
}
