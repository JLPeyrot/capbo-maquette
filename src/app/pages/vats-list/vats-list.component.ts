import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MaterialModule } from '../../shared/material-module';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { SelectionModel } from '@angular/cdk/collections';

export interface Vat {
  id: string;
  nom: string;
  taux: number;
  description?: string;
  type: string;
  is_active: boolean;
}

export interface VatFilters {
  search: string;
  is_active: boolean | string | null;
}

@Component({
  selector: 'app-vats-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, MatCheckboxModule],
  templateUrl: './vats-list.component.html',
  styleUrls: ['./vats-list.component.scss']
})
export class VatsListComponent implements OnInit, OnDestroy {
  @Input() isFocusMode: boolean = false;
  @Output() goBack = new EventEmitter<void>();
  @Output() createVat = new EventEmitter<void>();
  @Output() editVatEvent = new EventEmitter<string>();
  
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

  // Données
  vats: Vat[] = [];
  filteredVats: Vat[] = [];
  
  // États du composant
  isLoading = false;
  currentPage = 0;
  totalVats = 0;
  pageSizeOptions = [5, 10, 25, 50];
  
  // Filtres
  filters: VatFilters = {
    search: '',
    is_active: null
  };

  // Options pour les filtres




  // Sélection
  selection = new SelectionModel<Vat>(true, []);
  selectedVats: Vat[] = [];

  // Pagination
  pageSize = 10;
  
  // Colonnes du tableau
  displayedColumns: string[] = ['select', 'nom', 'taux', 'statut', 'actions'];

  ngOnInit(): void {
    this.loadVats();
    this.applyFilters();
    
    // Écouter les changements de sélection
    this.selection.changed
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.selectedVats = this.selection.selected;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadVats(): void {
    this.isLoading = true;
    // TODO: Remplacer par un appel au service réel
    setTimeout(() => {
      this.vats = this.getMockVats();
      this.totalVats = this.vats.length;
      this.applyFilters();
      this.isLoading = false;
    }, 500);
  }

  getMockVats(): Vat[] {
    return [
      {
        id: '1',
        nom: 'TVA Standard',
        taux: 20,
        description: 'Taux de TVA standard français',
        type: 'standard',
        is_active: true
      },
      {
        id: '2',
        nom: 'TVA Réduite',
        taux: 10,
        description: 'Taux de TVA réduit pour certains produits',
        type: 'reduite',
        is_active: true
      },
      {
        id: '3',
        nom: 'TVA Super Réduite',
        taux: 5.5,
        description: 'Taux de TVA super réduit',
        type: 'super_reduite',
        is_active: true
      },
      {
        id: '4',
        nom: 'TVA Particulière',
        taux: 2.1,
        description: 'Taux de TVA particulier pour la presse',
        type: 'particuliere',
        is_active: false
      },
      {
        id: '5',
        nom: 'TVA Export',
        taux: 0,
        description: 'TVA pour les exportations',
        type: 'particuliere',
        is_active: true
      }
    ];
  }

  // Filtrage
  onFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.vats];

    // Filtre par recherche
    if (this.filters.search) {
      const searchTerm = this.filters.search.toLowerCase();
      filtered = filtered.filter(vat => 
        vat.nom.toLowerCase().includes(searchTerm) ||
        vat.description?.toLowerCase().includes(searchTerm) ||
        vat.taux.toString().includes(searchTerm)
      );
    }

    // Filtre par statut actif
    if (this.filters.is_active !== null && this.filters.is_active !== '') {
      filtered = filtered.filter(vat => vat.is_active === this.filters.is_active);
    }

    this.filteredVats = filtered;
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.search || 
             (this.filters.is_active !== null && this.filters.is_active !== ''));
  }

  // Sélection
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.filteredVats.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    this.isAllSelected() ?
      this.selection.clear() :
      this.filteredVats.forEach(row => this.selection.select(row));
  }

  // Actions
  onCreateVat(): void {
    this.createVat.emit();
  }

  onImportVats(): void {
    // TODO: Implémenter la logique d'import
    console.log('Import des TVA');
  }

  editVat(vatId: string): void {
    this.editVatEvent.emit(vatId);
  }

  viewDetails(vat: Vat): void {
    // TODO: Implémenter la vue détaillée
    console.log('Voir détails TVA:', vat);
  }

  toggleActive(vat: Vat): void {
    vat.is_active = !vat.is_active;
    // TODO: Appeler le service pour sauvegarder
    console.log('Toggle statut TVA:', vat);
  }

  deleteVat(vat: Vat): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la TVA "${vat.nom}" ?`)) {
      this.vats = this.vats.filter(v => v.id !== vat.id);
      this.applyFilters();
      // TODO: Appeler le service pour supprimer
      console.log('Supprimer TVA:', vat);
    }
  }

  // Actions de masse
  bulkActivate(): void {
    this.selectedVats.forEach(vat => vat.is_active = true);
    // TODO: Appeler le service pour sauvegarder
    console.log('Activation en masse:', this.selectedVats);
    this.selection.clear();
  }

  bulkDeactivate(): void {
    this.selectedVats.forEach(vat => vat.is_active = false);
    // TODO: Appeler le service pour sauvegarder
    console.log('Désactivation en masse:', this.selectedVats);
    this.selection.clear();
  }

  bulkDelete(): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${this.selectedVats.length} TVA(s) ?`)) {
      const selectedIds = this.selectedVats.map(vat => vat.id);
      this.vats = this.vats.filter(vat => !selectedIds.includes(vat.id));
      this.applyFilters();
      this.selection.clear();
      // TODO: Appeler le service pour supprimer
      console.log('Suppression en masse:', this.selectedVats);
    }
  }

  // Utilitaires


  resetFilters(): void {
    this.filters = {
      search: '',
      is_active: null
    };
    this.onFilterChange();
  }

  isSelected(vat: Vat): boolean {
    return this.selection.isSelected(vat);
  }

  onGoBack(): void {
    this.goBack.emit();
  }
}