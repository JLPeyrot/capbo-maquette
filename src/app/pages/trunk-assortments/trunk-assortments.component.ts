import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { Router, ActivatedRoute } from '@angular/router';

interface AssortmentData {
  id: string;
  name: string;
  category: string;
  status: 'Actif' | 'Brouillon' | 'Archivé';
  articlesCount: number;
  addedDate: string;
  startDate: string | null;
  endDate: string | null;
  description?: string;
}

interface TrunkInfo {
  id: string;
  name: string;
  type: string;
  targetStore: string;
}

@Component({
  selector: 'app-trunk-assortments',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './trunk-assortments.component.html',
  styleUrls: ['./trunk-assortments.component.scss']
})
export class TrunkAssortmentsComponent implements OnInit {
  
  // Informations du tronc
  trunkInfo: TrunkInfo = {
    id: '',
    name: '',
    type: '',
    targetStore: ''
  };

  // Filtres et recherche
  searchTerm: string = '';
  selectedStatus: string = 'all';
  selectedCategory: string = 'all';

  // Options de filtres
  statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'actif', label: 'Actif' },
    { value: 'brouillon', label: 'Brouillon' },
    { value: 'archive', label: 'Archivé' }
  ];

  categoryOptions = [
    { value: 'all', label: 'Toutes les catégories' },
    { value: 'alimentaire', label: 'Alimentaire' },
    { value: 'textile', label: 'Textile' },
    { value: 'electromenager', label: 'Électroménager' },
    { value: 'multimedia', label: 'Multimédia' }
  ];

  // Colonnes du tableau
  displayedColumns: string[] = ['name', 'category', 'status', 'addedDate', 'startDate', 'endDate', 'actions'];

  // Données des assortiments
  allAssortments: AssortmentData[] = [
    {
      id: 'ASS-001',
      name: 'Assortiment Fruits & Légumes Bio',
      category: 'Alimentaire',
      status: 'Actif',
      articlesCount: 45,
      addedDate: '15/01/2024',
      startDate: '20/01/2024',
      endDate: '31/12/2024',
      description: 'Assortiment de produits bio fruits et légumes'
    },
    {
      id: 'ASS-002',
      name: 'Assortiment Vêtements Été',
      category: 'Textile',
      status: 'Brouillon',
      articlesCount: 78,
      addedDate: '12/01/2024',
      startDate: null,
      endDate: null,
      description: 'Collection été textile'
    },
    {
      id: 'ASS-003',
      name: 'Assortiment Électroménager Cuisine',
      category: 'Électroménager',
      status: 'Actif',
      articlesCount: 23,
      addedDate: '10/01/2024',
      startDate: '15/01/2024',
      endDate: '30/06/2024',
      description: 'Appareils électroménagers pour la cuisine'
    },
    {
      id: 'ASS-004',
      name: 'Assortiment TV & Audio',
      category: 'Multimédia',
      status: 'Archivé',
      articlesCount: 12,
      addedDate: '08/01/2024',
      startDate: '10/01/2024',
      endDate: '15/01/2024',
      description: 'Produits TV et audio'
    }
  ];

  filteredAssortments: AssortmentData[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Récupération de l'ID du tronc depuis l'URL
    const trunkId = this.route.snapshot.paramMap.get('id');
    this.loadTrunkInfo(trunkId);
    this.applyFilters();
  }

  loadTrunkInfo(trunkId: string | null): void {
    // Simulation du chargement des informations du tronc
    // En réalité, cela viendrait d'un service
    if (trunkId) {
      this.trunkInfo = {
        id: trunkId,
        name: 'TRG-GUP-NATIONAL',
        type: 'National',
        targetStore: 'Carrefour'
      };
    }
  }

  // Méthodes de filtrage
  applyFilters(): void {
    this.filteredAssortments = this.allAssortments.filter(assortment => {
      // Filtre par terme de recherche
      const matchesSearch = assortment.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           assortment.category.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      // Filtre par statut
      const matchesStatus = this.selectedStatus === 'all' || 
        assortment.status.toLowerCase() === this.selectedStatus;
      
      // Filtre par catégorie
      const matchesCategory = this.selectedCategory === 'all' || 
        assortment.category.toLowerCase() === this.selectedCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  // Actions
  goBack(): void {
    this.router.navigate(['/trunk-list']);
  }

  viewAssortment(assortment: AssortmentData): void {
    console.log('Voir assortiment:', assortment);
    // Navigation vers le détail de l'assortiment
  }

  editAssortment(assortment: AssortmentData): void {
    console.log('Modifier assortiment:', assortment);
    // Navigation vers l'édition de l'assortiment
  }

  deleteAssortment(assortment: AssortmentData): void {
    console.log('Supprimer assortiment:', assortment);
    // Logique de suppression avec confirmation
  }

  addAssortment(): void {
    console.log('Ajouter un nouvel assortiment au tronc');
    // Navigation vers l'ajout d'assortiment
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

  getCategoryClass(category: string): string {
    switch (category.toLowerCase()) {
      case 'alimentaire': return 'category-food';
      case 'textile': return 'category-textile';
      case 'électroménager': return 'category-appliance';
      case 'multimédia': return 'category-multimedia';
      default: return 'category-default';
    }
  }

  getCategoryIcon(category: string): string {
    switch (category.toLowerCase()) {
      case 'alimentaire': return 'restaurant';
      case 'textile': return 'checkroom';
      case 'électroménager': return 'kitchen';
      case 'multimédia': return 'tv';
      default: return 'category';
    }
  }
}
