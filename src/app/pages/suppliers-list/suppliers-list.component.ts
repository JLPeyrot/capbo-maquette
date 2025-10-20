import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MaterialModule } from '../../shared/material-module';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorIntl } from '@angular/material/paginator';

export interface Supplier {
  id: string;
  nom: string;
  contact: string;
  is_active: boolean;
  type: string;
}

export interface SupplierFilters {
  search: string;
  is_active: boolean | string | null;
  type: string;
}

@Component({
  selector: 'app-suppliers-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, MatCheckboxModule],
  templateUrl: './suppliers-list.component.html',
  styleUrls: ['./suppliers-list.component.scss']
})
export class SuppliersListComponent implements OnInit, OnDestroy {
  @Input() isFocusMode: boolean = false;
  @Output() goBack = new EventEmitter<void>();
  @Output() createSupplier = new EventEmitter<void>();
  @Output() editSupplierEvent = new EventEmitter<string>();
  
  private destroy$ = new Subject<void>();

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

  // États du composant
  isLoading = false;
  selectedSuppliers: Supplier[] = [];
  
  // Filtres
  filters: SupplierFilters = {
    search: '',
    is_active: false,
    type: ''
  };

  // Pagination
  pageSize = 25;
  currentPage = 0;
  totalSuppliers = 0;
  pageSizeOptions = [10, 25, 50, 100];

  // Data
  suppliers: Supplier[] = [];
  filteredSuppliers: Supplier[] = [];
  
  // Options pour les filtres
  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'true', label: 'Actif' },
    { value: 'false', label: 'Inactif' }
  ];

  typeOptions = [
    { value: '', label: 'Tous les types' },
    { value: 'fournisseur', label: 'Fournisseur' },
    { value: 'prestataire', label: 'Prestataire' },
    { value: 'transporteur', label: 'Transporteur' }
  ];

  // Colonnes affichées
  displayedColumns: string[] = [
    'select',
    'nom',
    'type',
    'contact',
    'is_active',
    'actions'
  ];

  ngOnInit(): void {
    this.loadSuppliers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge la liste des fournisseurs
   */
  loadSuppliers(): void {
    this.isLoading = true;
    
    // Simulation d'un appel API
    setTimeout(() => {
      this.suppliers = this.generateMockSuppliers();
      this.applyFilters();
      this.isLoading = false;
    }, 500);
  }

  /**
   * Génère des données de test pour les fournisseurs
   */
  generateMockSuppliers(): Supplier[] {
    return [
      { id: '1', nom: 'Fournisseur Alpha', contact: 'contact@alpha.com', is_active: true, type: 'fournisseur' },
      { id: '2', nom: 'Beta Solutions', contact: 'info@beta.fr', is_active: true, type: 'prestataire' },
      { id: '3', nom: 'Gamma Industries', contact: 'commercial@gamma.com', is_active: false, type: 'fournisseur' },
      { id: '4', nom: 'Delta Services', contact: 'service@delta.fr', is_active: true, type: 'prestataire' },
      { id: '5', nom: 'Epsilon Corp', contact: 'contact@epsilon.com', is_active: true, type: 'fournisseur' },
      { id: '6', nom: 'Zeta Partners', contact: 'partners@zeta.fr', is_active: false, type: 'prestataire' },
      { id: '7', nom: 'Eta Logistics', contact: 'logistics@eta.com', is_active: true, type: 'transporteur' },
      { id: '8', nom: 'Theta Tech', contact: 'tech@theta.fr', is_active: true, type: 'prestataire' },
      { id: '9', nom: 'Iota Systems', contact: 'systems@iota.com', is_active: false, type: 'fournisseur' },
      { id: '10', nom: 'Kappa Group', contact: 'group@kappa.fr', is_active: true, type: 'transporteur' }
    ];
  }

  /**
   * Applique les filtres sur la liste des fournisseurs
   */
  applyFilters(): void {
    let filtered = [...this.suppliers];

    // Filtre de recherche
    if (this.filters.search) {
      const searchTerm = this.filters.search.toLowerCase();
      filtered = filtered.filter(supplier => 
        supplier.nom.toLowerCase().includes(searchTerm) ||
        supplier.contact.toLowerCase().includes(searchTerm)
      );
    }

    // Filtre de statut
    if (this.filters.is_active !== null && this.filters.is_active !== undefined && this.filters.is_active !== '') {
      const isActive = this.filters.is_active === true || this.filters.is_active === 'true';
      filtered = filtered.filter(supplier => supplier.is_active === isActive);
    }

    // Filtre de type
    if (this.filters.type && this.filters.type !== '') {
      filtered = filtered.filter(supplier => supplier.type === this.filters.type);
    }

    this.filteredSuppliers = filtered;
    this.totalSuppliers = filtered.length;
    this.currentPage = 0;
  }

  /**
   * Remet à zéro tous les filtres
   */
  resetFilters(): void {
    this.filters = {
      search: '',
      is_active: false,
      type: ''
    };
    this.applyFilters();
  }

  /**
   * Édite un fournisseur
   */
  editSupplier(supplier: Supplier): void {
    this.editSupplierEvent.emit(supplier.id);
  }

  viewDetails(supplier: Supplier): void {
    console.log('Voir détails du fournisseur:', supplier);
  }

  toggleActive(supplier: Supplier): void {
    supplier.is_active = !supplier.is_active;
  }

  /**
   * Gestion de la sélection
   */
  toggleSelection(supplier: Supplier): void {
    const index = this.selectedSuppliers.findIndex(s => s.id === supplier.id);
    if (index > -1) {
      this.selectedSuppliers.splice(index, 1);
    } else {
      this.selectedSuppliers.push(supplier);
    }
  }

  isSelected(supplier: Supplier): boolean {
    return this.selectedSuppliers.some(s => s.id === supplier.id);
  }

  /**
   * Sélectionne/désélectionne tous les fournisseurs de la page courante
   */
  toggleAll(): void {
    const pagedSuppliers = this.getPagedSuppliers();
    const allSelected = this.areAllPagedSuppliersSelected();
    
    if (allSelected) {
      // Désélectionner tous les fournisseurs de la page
      pagedSuppliers.forEach(supplier => {
        const index = this.selectedSuppliers.findIndex(s => s.id === supplier.id);
        if (index > -1) {
          this.selectedSuppliers.splice(index, 1);
        }
      });
    } else {
      // Sélectionner tous les fournisseurs de la page
      pagedSuppliers.forEach(supplier => {
        if (!this.isSelected(supplier)) {
          this.selectedSuppliers.push(supplier);
        }
      });
    }
  }

  /**
   * Retourne les fournisseurs de la page courante
   */
  getPagedSuppliers(): Supplier[] {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredSuppliers.slice(startIndex, endIndex);
  }

  /**
   * Vérifie si tous les fournisseurs de la page courante sont sélectionnés
   */
  areAllPagedSuppliersSelected(): boolean {
    const pagedSuppliers = this.getPagedSuppliers();
    return pagedSuppliers.length > 0 && pagedSuppliers.every(supplier => this.isSelected(supplier));
  }

  /**
   * Gestion de la pagination
   */
  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  /**
   * Navigation
   */
  onGoBack(): void {
    this.goBack.emit();
  }

  onCreateSupplier(): void {
    this.createSupplier.emit();
  }

  /**
   * Importe des partenaires depuis un fichier
   */
  onImportSuppliers(): void {
    console.log('Import des partenaires');
    // TODO: Implémenter la logique d'import
  }
}