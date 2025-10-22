import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { Router } from '@angular/router';

interface TrunkData {
  id: string;
  name: string;
  type: 'National' | 'Complémentaire';
  targetStore: string;
  status: 'Actif' | 'Brouillon' | 'Archivé';
  createdDate: string;
  lastModified: string;
  articlesCount: number;
  storesCount: number;
}

@Component({
  selector: 'app-assortment-trunk',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './assortment-trunk.component.html',
  styleUrls: ['./assortment-trunk.component.scss']
})
export class AssortmentTrunkComponent implements OnInit {

  // Données de recherche et filtres
  searchTerm: string = '';
  selectedTrunkType: string = 'all';
  selectedStatus: string = 'all';
  selectedArticles: string = 'all';

  // Options pour les filtres
  trunkTypes = [
    { value: 'all', label: 'Tous les types' },
    { value: 'national', label: 'National' },
    { value: 'complementaire', label: 'Complémentaire' }
  ];

  statusOptions = [
    { value: 'all', label: 'Toutes les enseignes' },
    { value: 'actif', label: 'Actif' },
    { value: 'brouillon', label: 'Brouillon' },
    { value: 'archive', label: 'Archivé' }
  ];

  articlesOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'low', label: 'Moins de 50 articles' },
    { value: 'medium', label: '50-100 articles' },
    { value: 'high', label: 'Plus de 100 articles' }
  ];

  // Données des troncs
  allTrunks: TrunkData[] = [
    {
      id: 'TRG-GUP-NATIONAL',
      name: 'TRG-GUP-NATIONAL',
      type: 'National',
      targetStore: 'Carrefour',
      status: 'Actif',
      createdDate: '15/01/2024',
      lastModified: '20/01/2024',
      articlesCount: 123,
      storesCount: 45
    },
    {
      id: 'TRG-COMP-SUD',
      name: 'TRG-COMP-SUD',
      type: 'Complémentaire',
      targetStore: 'Leclerc',
      status: 'Brouillon',
      createdDate: '12/01/2024',
      lastModified: '18/01/2024',
      articlesCount: 67,
      storesCount: 12
    },
    {
      id: 'TRG-COMP-NORD',
      name: 'TRG-COMP-NORD',
      type: 'Complémentaire',
      targetStore: 'Auchan',
      status: 'Actif',
      createdDate: '10/01/2024',
      lastModified: '19/01/2024',
      articlesCount: 89,
      storesCount: 18
    }
  ];

  filteredTrunks: TrunkData[] = [];
  
  // Statistiques
  stats = {
    activeAssortments: 2,
    drafts: 1,
    totalArticles: 123
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.applyFilters();
  }

  // Méthodes de filtrage
  applyFilters(): void {
    this.filteredTrunks = this.allTrunks.filter(trunk => {
      // Filtre par terme de recherche
      const matchesSearch = trunk.name.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      // Filtre par type de tronc
      const matchesType = this.selectedTrunkType === 'all' || 
        (this.selectedTrunkType === 'national' && trunk.type === 'National') ||
        (this.selectedTrunkType === 'complementaire' && trunk.type === 'Complémentaire');
      
      // Filtre par statut
      const matchesStatus = this.selectedStatus === 'all' || 
        trunk.status.toLowerCase() === this.selectedStatus;
      
      // Filtre par nombre d'articles
      const matchesArticles = this.selectedArticles === 'all' ||
        (this.selectedArticles === 'low' && trunk.articlesCount < 50) ||
        (this.selectedArticles === 'medium' && trunk.articlesCount >= 50 && trunk.articlesCount <= 100) ||
        (this.selectedArticles === 'high' && trunk.articlesCount > 100);
      
      return matchesSearch && matchesType && matchesStatus && matchesArticles;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  // Actions sur les troncs
  createTrunk(): void {
    // Navigation vers la page de création de tronc
    this.router.navigate(['/create-trunk']);
  }

  viewTrunk(trunk: TrunkData): void {
    console.log('Voir le tronc:', trunk);
    // Logique pour voir le tronc
  }

  viewTrunkAssortments(trunk: TrunkData): void {
    console.log('Voir les assortiments du tronc:', trunk);
    this.router.navigate(['/trunk-assortments', trunk.id]);
  }

  editTrunk(trunk: TrunkData): void {
    console.log('Modifier le tronc:', trunk);
    // Logique pour modifier le tronc
  }

  // Méthodes utilitaires
  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'actif': return 'active';
      case 'brouillon': return 'draft';
      case 'archivé': return 'inactive';
      default: return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'actif': return 'check_circle';
      case 'brouillon': return 'edit';
      case 'archivé': return 'archive';
      default: return 'help';
    }
  }

  getTypeClass(type: string): string {
    switch (type.toLowerCase()) {
      case 'national': return 'type-national';
      case 'complémentaire': return 'type-complementaire';
      default: return '';
    }
  }

  getStoreClass(store: string): string {
    switch (store.toLowerCase()) {
      case 'carrefour': return 'carrefour';
      case 'leclerc': return 'leclerc';
      case 'auchan': return 'auchan';
      default: return 'default';
    }
  }
}