import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MaterialModule } from '../../shared/material-module';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorIntl } from '@angular/material/paginator';

export interface Site {
  id: string;
  name: string;
  address: string;
  type: string;
  city: string;
  postal_code: string;
  country: string;
  phone: string;
  email: string;
  is_active: boolean;
}

export interface GroupSites {
  id: string;
  nom: string;
  type: 'Groupe' | 'Assortiments' | 'Collection' | 'Thématique';
  sites: Site[];
  is_active: boolean;
}

export interface GroupSitesFilters {
  search: string;
  is_active: boolean;
}

@Component({
  selector: 'app-group-sites-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, MatCheckboxModule],
  templateUrl: './group-sites-list.component.html',
  styleUrls: ['./group-sites-list.component.scss']
})
export class GroupSitesListComponent implements OnInit, OnDestroy {
  @Input() isFocusMode: boolean = false;
  @Output() goBack = new EventEmitter<void>();
  @Output() createGroupSites = new EventEmitter<void>();
  @Output() editGroupSitesEvent = new EventEmitter<string>();
  
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
  selectedGroupSites: GroupSites[] = [];
  
  // Filtres
  filters: GroupSitesFilters = {
    search: '',
    is_active: false
  };

  // Pagination
  pageSize = 25;
  currentPage = 0;
  totalGroupSites = 0;
  pageSizeOptions = [10, 25, 50, 100];

  // Data
  groupSites: GroupSites[] = [];
  filteredGroupSites: GroupSites[] = [];
  
  // Options pour les filtres
  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'true', label: 'Actif' },
    { value: 'false', label: 'Inactif' }
  ];

  // Colonnes affichées
  displayedColumns: string[] = [
    'select',
    'nom',
    'type',
    'sites_count',
    'sites_list',
    'actions'
  ];

  ngOnInit(): void {
    this.loadGroupSites();
    this.applyFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Chargement des groupes de sites
   */
  loadGroupSites(): void {
    this.isLoading = true;
    
    // Simulation d'un appel API
    setTimeout(() => {
      this.groupSites = this.generateMockGroupSites();
      this.applyFilters();
      this.isLoading = false;
    }, 800);
  }

  /**
   * Génération de données de test
   */
  generateMockGroupSites(): GroupSites[] {
    const groupNames = [
      'Groupe Paris Centre',
      'Groupe Lyon Métropole',
      'Groupe Marseille Sud',
      'Groupe Bordeaux Ouest',
      'Groupe Lille Nord',
      'Groupe Toulouse Centre',
      'Groupe Nantes Atlantique',
      'Groupe Strasbourg Est',
      'Groupe Nice Côte d\'Azur',
      'Groupe Montpellier Hérault'
    ];

    const groupTypes: ('Groupe' | 'Assortiments' | 'Collection' | 'Thématique')[] = [
      'Groupe',
      'Assortiments',
      'Collection',
      'Thématique',
      'Groupe',
      'Assortiments',
      'Collection',
      'Thématique',
      'Groupe',
      'Assortiments'
    ];

    const mockSites: Site[] = [
      { id: '1', name: 'Site Paris 1', address: '123 Rue de Rivoli', type: 'Magasin', city: 'Paris', postal_code: '75001', country: 'France', phone: '01 42 60 30 30', email: 'paris1@example.com', is_active: true },
      { id: '2', name: 'Site Paris 2', address: '456 Avenue des Champs-Élysées', type: 'Bureau', city: 'Paris', postal_code: '75008', country: 'France', phone: '01 42 60 30 31', email: 'paris2@example.com', is_active: true },
      { id: '3', name: 'Site Lyon 1', address: '789 Rue de la République', type: 'Entrepôt', city: 'Lyon', postal_code: '69002', country: 'France', phone: '04 78 42 30 30', email: 'lyon1@example.com', is_active: true },
      { id: '4', name: 'Site Marseille 1', address: '321 La Canebière', type: 'Magasin', city: 'Marseille', postal_code: '13001', country: 'France', phone: '04 91 54 30 30', email: 'marseille1@example.com', is_active: false },
      { id: '5', name: 'Site Bordeaux 1', address: '654 Cours de l\'Intendance', type: 'Bureau', city: 'Bordeaux', postal_code: '33000', country: 'France', phone: '05 56 44 30 30', email: 'bordeaux1@example.com', is_active: true }
    ];
    
    return Array(10).fill(0).map((_, index) => {
      const sitesCount = Math.floor(Math.random() * 5) + 1;
      const selectedSites = mockSites.slice(0, sitesCount);
      
      return {
        id: `group-${index + 1}`,
        nom: groupNames[index],
        type: groupTypes[index],
        sites: selectedSites,
        is_active: Math.random() > 0.2
      };
    });
  }

  /**
   * Application des filtres
   */
  applyFilters(): void {
    let filtered = [...this.groupSites];

    // Filtre de recherche
    if (this.filters.search.trim()) {
      const searchTerm = this.filters.search.toLowerCase().trim();
      filtered = filtered.filter(group => 
        group.nom.toLowerCase().includes(searchTerm) ||
        group.sites.some(site => 
          site.name.toLowerCase().includes(searchTerm) ||
          site.address.toLowerCase().includes(searchTerm) ||
          site.city.toLowerCase().includes(searchTerm)
        )
      );
    }

    // Filtre de statut
    if (this.filters.is_active !== null && this.filters.is_active !== undefined) {
      filtered = filtered.filter(group => group.is_active === this.filters.is_active);
    }

    this.filteredGroupSites = filtered;
    this.totalGroupSites = filtered.length;
    this.currentPage = 0;
  }

  /**
   * Réinitialisation des filtres
   */
  resetFilters(): void {
    this.filters = {
      search: '',
      is_active: false
    };
    this.applyFilters();
  }

  /**
   * Gestion de la sélection
   */
  isAllSelected(): boolean {
    const numSelected = this.selectedGroupSites.length;
    const numRows = this.getPagedData().length;
    return numSelected === numRows && numRows > 0;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selectedGroupSites = [];
    } else {
      this.selectedGroupSites = [...this.getPagedData()];
    }
  }

  toggleSelection(group: GroupSites): void {
    const index = this.selectedGroupSites.findIndex(s => s.id === group.id);
    if (index > -1) {
      this.selectedGroupSites.splice(index, 1);
    } else {
      this.selectedGroupSites.push(group);
    }
  }

  isSelected(group: GroupSites): boolean {
    return this.selectedGroupSites.some(s => s.id === group.id);
  }

  /**
   * Pagination
   */
  getPagedData(): GroupSites[] {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredGroupSites.slice(startIndex, endIndex);
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  /**
   * Actions
   */
  onGoBack(): void {
    this.goBack.emit();
  }

  onCreateGroupSites(): void {
    this.createGroupSites.emit();
  }

  onEditGroupSites(groupId: string): void {
    this.editGroupSitesEvent.emit(groupId);
  }

  onViewGroupSites(groupId: string): void {
    // TODO: Implement view details functionality
    console.log('Viewing group sites details for ID:', groupId);
    // This could navigate to a details view or open a modal
  }

  onDeleteGroupSites(groupId: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce groupe de sites ?')) {
      this.groupSites = this.groupSites.filter(g => g.id !== groupId);
      this.applyFilters();
    }
  }

  onDeleteSelected(): void {
    if (this.selectedGroupSites.length === 0) return;
    
    const count = this.selectedGroupSites.length;
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${count} groupe(s) de sites ?`)) {
      const selectedIds = this.selectedGroupSites.map(g => g.id);
      this.groupSites = this.groupSites.filter(g => !selectedIds.includes(g.id));
      this.selectedGroupSites = [];
      this.applyFilters();
    }
  }

  /**
   * Utilitaires
   */
  getSitesNames(sites: Site[]): string {
    return sites.map(site => site.name).join(', ');
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'Actif' : 'Inactif';
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'status-active' : 'status-inactive';
  }
}