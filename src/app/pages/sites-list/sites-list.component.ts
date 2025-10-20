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

export interface SiteFilters {
  search: string;
  type: string;
  city: string;
  country: string;
  is_active: boolean;
}

@Component({
  selector: 'app-sites-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, MatCheckboxModule],
  templateUrl: './sites-list.component.html',
  styleUrls: ['./sites-list.component.scss']
})
export class SitesListComponent implements OnInit, OnDestroy {
  @Input() isFocusMode: boolean = false;
  @Output() goBack = new EventEmitter<void>();
  @Output() createSite = new EventEmitter<void>();
  @Output() editSiteEvent = new EventEmitter<string>();
  
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
  selectedSites: Site[] = [];
  
  // Filtres
  filters: SiteFilters = {
    search: '',
    type: '',
    city: '',
    country: '',
    is_active: false
  };

  // Pagination
  pageSize = 25;
  currentPage = 0;
  totalSites = 0;
  pageSizeOptions = [10, 25, 50, 100];

  // Data
  sites: Site[] = [];
  filteredSites: Site[] = [];
  
  // Options pour les filtres
  typeOptions: string[] = [];
  cityOptions: string[] = [];
  countryOptions: string[] = [];
  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'true', label: 'Actif' },
    { value: 'false', label: 'Inactif' }
  ];

  // Colonnes affichées
  displayedColumns: string[] = [
    'select',
    'name',
    'address', 
    'type',
    'country',
    'phone',
    'is_active',
    'actions'
  ];

  ngOnInit(): void {
    this.loadSites();
    this.applyFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Chargement des sites
   */
  loadSites(): void {
    this.isLoading = true;
    
    // Simulation d'un appel API
    setTimeout(() => {
      this.sites = this.generateMockSites();
      this.applyFilters();
      
      // Extraction des options de filtres
      this.extractFilterOptions();
      
      this.isLoading = false;
    }, 800);
  }

  /**
   * Génération de données de test
   */
  generateMockSites(): Site[] {
    const siteTypes = ['Magasin', 'Entrepôt', 'Bureau', 'Usine', 'Centre commercial'];
    const cities = ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Lille', 'Toulouse', 'Nantes'];
    const countries = ['France', 'Belgique', 'Suisse', 'Espagne', 'Allemagne'];
    
    return Array(50).fill(0).map((_, index) => {
      const type = siteTypes[Math.floor(Math.random() * siteTypes.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const country = countries[Math.floor(Math.random() * countries.length)];
      const postalCode = Math.floor(Math.random() * 90000 + 10000).toString();
      
      return {
        id: `SITE-${index + 1000}`,
        name: `Site ${type} ${city} ${index + 1}`,
        address: `${Math.floor(Math.random() * 100) + 1} Rue de ${city}`,
        type,
        city,
        postal_code: postalCode,
        country,
        phone: `+33 ${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`,
        email: `contact.${city.toLowerCase()}${index + 1}@example.com`,
        is_active: Math.random() > 0.2 // 80% des sites sont actifs
      };
    });
  }

  /**
   * Extraction des options de filtres
   */
  extractFilterOptions(): void {
    // Extraction des types uniques
    this.typeOptions = Array.from(new Set(this.sites.map(site => site.type)));
    
    // Extraction des villes uniques
    this.cityOptions = Array.from(new Set(this.sites.map(site => site.city)));
    
    // Extraction des pays uniques
    this.countryOptions = Array.from(new Set(this.sites.map(site => site.country)));
  }

  /**
   * Application des filtres
   */
  applyFilters(): void {
    this.filteredSites = this.sites.filter(site => {
      // Filtre par recherche (nom, adresse, code postal, téléphone, email)
      const searchMatch = !this.filters.search || 
        site.name.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        site.address.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        site.postal_code.includes(this.filters.search) ||
        site.phone.includes(this.filters.search) ||
        site.email.toLowerCase().includes(this.filters.search.toLowerCase());
      
      // Filtre par type
      const typeMatch = !this.filters.type || site.type === this.filters.type;
      
      // Filtre par ville
      const cityMatch = !this.filters.city || site.city === this.filters.city;
      
      // Filtre par pays
      const countryMatch = !this.filters.country || site.country === this.filters.country;
      
      // Filtre par statut actif
      const activeMatch = !this.filters.is_active || site.is_active === true;
      
      return searchMatch && typeMatch && cityMatch && countryMatch && activeMatch;
    });
    
    this.totalSites = this.filteredSites.length;
    this.currentPage = 0; // Retour à la première page après filtrage
  }

  /**
   * Reset des filtres
   */
  resetFilters(): void {
    this.filters = {
      search: '',
      type: '',
      city: '',
      country: '',
      is_active: false
    };
    this.applyFilters();
  }

  /**
   * Actions rapides
   */
  editSite(site: Site): void {
    console.log('Édition du site:', site.name);
    this.editSiteEvent.emit(site.id);
  }

  viewDetails(site: Site): void {
    console.log('Affichage des détails du site:', site.name);
    // TODO: Implémenter l'affichage des détails du site
  }

  toggleActive(site: Site): void {
    console.log(`${site.is_active ? 'Désactivation' : 'Activation'} du site:`, site.name);
    // TODO: Implémenter l'activation/désactivation du site
  }

  /**
   * Gestion de la sélection
   */
  toggleSelection(site: Site): void {
    const index = this.selectedSites.findIndex(s => s.id === site.id);
    if (index > -1) {
      this.selectedSites.splice(index, 1);
    } else {
      this.selectedSites.push(site);
    }
  }

  isSelected(site: Site): boolean {
    return this.selectedSites.some(s => s.id === site.id);
  }

  /**
   * Sélection multiple
   */
  toggleAll(): void {
    const visibleSites = this.getPagedSites();
    const allSelected = visibleSites.every(site => this.isSelected(site));
    
    if (allSelected) {
      // Désélectionner tous les sites visibles
      visibleSites.forEach(site => {
        const index = this.selectedSites.findIndex(s => s.id === site.id);
        if (index > -1) {
          this.selectedSites.splice(index, 1);
        }
      });
    } else {
      // Sélectionner tous les sites visibles
      visibleSites.forEach(site => {
        if (!this.isSelected(site)) {
          this.selectedSites.push(site);
        }
      });
    }
  }

  /**
   * Sites pour la page courante
   */
  getPagedSites(): Site[] {
    const startIndex = this.currentPage * this.pageSize;
    return this.filteredSites.slice(startIndex, startIndex + this.pageSize);
  }

  /**
   * Vérifie si tous les sites de la page sont sélectionnés
   */
  areAllPagedSitesSelected(): boolean {
    const pagedSites = this.getPagedSites();
    return pagedSites.length > 0 && pagedSites.every(site => this.isSelected(site));
  }

  /**
   * Gestion de la pagination
   */
  onPageChange(event: any): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
  }

  /**
   * Retour à la page précédente
   */
  onGoBack(): void {
    this.goBack.emit();
  }

  onCreateSite(): void {
    this.createSite.emit();
  }
}