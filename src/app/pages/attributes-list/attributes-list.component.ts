import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { MaterialModule } from '../../shared/material-module';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorIntl, PageEvent } from '@angular/material/paginator';

export interface Attribute {
  id: string;
  code: string;
  libelle: string;
  type: string;
  declinable: boolean;
  enum: boolean;
  optionnel: boolean;
  statut: 'actif' | 'inactif' | 'suspendu';
  dateCreation: Date;
  derniereMaj: Date;
}

export interface AttributeFilters {
  search: string;
  type: string;
  declinable: string;
}

@Component({
  selector: 'app-attributes-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, MatCheckboxModule],
  templateUrl: './attributes-list.component.html',
  styleUrls: ['./attributes-list.component.scss']
})
export class AttributesListComponent implements OnInit, OnDestroy {
  @Input() isFocusMode: boolean = false;
  @Output() goBack = new EventEmitter<void>();
  @Output() createAttribute = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  isLoading = false;
  selectedAttributes: Attribute[] = [];

  filters: AttributeFilters = {
    search: '',
    type: '',
    declinable: ''
  };

  pageSize = 25;
  currentPage = 0;
  totalAttributes = 0;
  pageSizeOptions = [10, 25, 50, 100];

  attributes: Attribute[] = [];
  filteredAttributes: Attribute[] = [];
  pagedAttributes: Attribute[] = [];

  typesOptions: string[] = [];
  declinableOptions = [
    { value: '', label: 'Tous' },
    { value: 'true', label: 'Oui' },
    { value: 'false', label: 'Non' }
  ];

  displayedColumns: string[] = [
    'select',
    'code',
    'type',
    'declinable',
    'enum',
    'optionnel',
    'actions'
  ];

  constructor(private paginatorIntl: MatPaginatorIntl) {
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

  ngOnInit(): void {
    this.loadAttributes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBackToDashboard(): void { this.goBack.emit(); }
  onCreateAttribute(): void { this.createAttribute.emit(); }
  onImportAttributes(): void { console.log('Importer attributs'); }

  private loadAttributes(): void {
    this.isLoading = true;
    this.attributes = this.generateMockAttributes();
    this.filteredAttributes = [...this.attributes];
    this.totalAttributes = this.attributes.length;
    this.extractFilterOptions();
    this.currentPage = 0;
    this.updatePagedAttributes();
    this.isLoading = false;
  }

  private generateMockAttributes(): Attribute[] {
    const types = ['int', 'float', 'decimal', 'string'];
    const statuts: ('actif' | 'inactif' | 'suspendu')[] = ['actif', 'inactif', 'suspendu'];
    return Array.from({ length: 60 }, (_, i) => {
      const type = types[Math.floor(Math.random() * types.length)];
      const declinable = Math.random() < 0.5;
      const enumValue = Math.random() < 0.5;
      const optionnel = Math.random() < 0.5;
      const statut = statuts[Math.floor(Math.random() * statuts.length)];
      return {
        id: `ATT-${String(i + 1).padStart(6, '0')}`,
        code: `ATTR-${String(i + 1).padStart(3, '0')}`,
        libelle: `Attribut ${i + 1}`,
        type,
        declinable,
        enum: enumValue,
        optionnel,
        statut,
        dateCreation: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        derniereMaj: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      };
    });
  }

  private extractFilterOptions(): void {
    this.typesOptions = [...new Set(this.attributes.map(a => a.type))].sort();
  }

  applyFilters(): void {
    this.filteredAttributes = this.attributes.filter(attr => {
      const search = this.filters.search?.toLowerCase() || '';
      const matchSearch = !search || attr.libelle.toLowerCase().includes(search) || attr.code.toLowerCase().includes(search) || attr.type.toLowerCase().includes(search);
      const matchType = !this.filters.type || attr.type === this.filters.type;
      const matchDeclinable = !this.filters.declinable || attr.declinable === (this.filters.declinable === 'true');
      return matchSearch && matchType && matchDeclinable;
    });
    this.totalAttributes = this.filteredAttributes.length;
    this.currentPage = 0;
    this.updatePagedAttributes();
  }

  resetFilters(): void {
    this.filters = { search: '', type: '', declinable: '' };
    this.applyFilters();
  }

  toggleSelection(attr: Attribute): void {
    const index = this.selectedAttributes.findIndex(a => a.id === attr.id);
    if (index >= 0) { this.selectedAttributes.splice(index, 1); } else { this.selectedAttributes.push(attr); }
  }
  isSelected(attr: Attribute): boolean { return this.selectedAttributes.some(a => a.id === attr.id); }

  toggleAll(): void {
    const pageItems = this.pagedAttributes;
    const allSelected = pageItems.every(item => this.isSelected(item));
    if (allSelected) {
      this.selectedAttributes = this.selectedAttributes.filter(sel => !pageItems.some(p => p.id === sel.id));
    } else {
      const toAdd = pageItems.filter(item => !this.isSelected(item));
      this.selectedAttributes = [...this.selectedAttributes, ...toAdd];
    }
  }

  areAllPagedAttributesSelected(): boolean {
    const pageItems = this.pagedAttributes;
    return pageItems.length > 0 && pageItems.every(item => this.isSelected(item));
  }
  areSomePagedAttributesSelected(): boolean {
    const pageItems = this.pagedAttributes;
    const selectedCount = pageItems.filter(item => this.isSelected(item)).length;
    return selectedCount > 0 && selectedCount < pageItems.length;
  }

  private updatePagedAttributes(): void {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    this.pagedAttributes = this.filteredAttributes.slice(start, end);
  }
  onPageChange(event: PageEvent): void { this.pageSize = event.pageSize; this.currentPage = event.pageIndex; this.updatePagedAttributes(); }

  editAttribute(attr: Attribute): void { console.log('Éditer attribut:', attr.code); }
  openUsage(attr: Attribute): void { console.log('Voir usages pour:', attr.code); }
  deleteAttribute(attr: Attribute): void { console.log('Supprimer attribut:', attr.code); }

  // Icônes d’actions alignées sur la page Articles
  openTarifs(attr: Attribute): void {
    console.log('Ouvrir tarifs pour attribut:', attr.code);
    // TODO: Implémenter l’ouverture/édition des tarifs liés à l’attribut
  }

  openAssortiment(attr: Attribute): void {
    console.log('Ouvrir détail/assortiment pour attribut:', attr.code);
    // TODO: Implémenter l’ouverture de l’assortiment/détail de l’attribut
  }

  openReassort(attr: Attribute): void {
    console.log('Activer/Désactiver (réassort) pour attribut:', attr.code);
    // TODO: Implémenter le toggle d’activation/désactivation et la logique de réassort si applicable
  }
}