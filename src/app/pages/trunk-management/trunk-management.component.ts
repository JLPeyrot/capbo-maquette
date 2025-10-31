import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

interface Trunk {
  id: string;
  name: string;
  type: 'TAC' | 'TAN' | 'complementaire';
  status: 'actif' | 'brouillon' | 'archive';
  articlesCount: number;
  storesCount: number;
  createdDate: Date;
  lastModified: Date;
  groups: string[];
  attributes: string[];
}

@Component({
  selector: 'app-trunk-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MaterialModule],
  templateUrl: './trunk-management.component.html',
  styleUrls: ['./trunk-management.component.scss']
})
export class TrunkManagementComponent implements OnInit {
  
  searchForm: FormGroup;
  
  // Données de démonstration
  trunks: Trunk[] = [
    {
      id: '1',
      name: 'Tronc Atelier Urbain',
      type: 'TAC',
      status: 'actif',
      articlesCount: 145,
      storesCount: 12,
      createdDate: new Date('2024-01-15'),
      lastModified: new Date('2024-12-20'),
      groups: ['URBAIN', 'ZONE À FORTE FRÉQUENTATION', 'PILOTE'],
      attributes: ['ATELIER_REPARATION']
    },
    {
      id: '2',
      name: 'Tronc Gaming',
      type: 'TAC',
      status: 'actif',
      articlesCount: 89,
      storesCount: 8,
      createdDate: new Date('2024-02-10'),
      lastModified: new Date('2024-12-18'),
      groups: ['URBAIN', 'PERIURBAIN', 'ZONE ÉTUDIANTE'],
      attributes: ['EXPERTISE_GAMING']
    },
    {
      id: '3',
      name: 'Tronc Cinema Ouest',
      type: 'TAC',
      status: 'actif',
      articlesCount: 67,
      storesCount: 6,
      createdDate: new Date('2024-03-05'),
      lastModified: new Date('2024-12-15'),
      groups: ['OUEST', 'LITTORAL'],
      attributes: ['EXPERTISE_CINEMA']
    },
    {
      id: '4',
      name: 'Tronc Services Centre',
      type: 'TAC',
      status: 'actif',
      articlesCount: 123,
      storesCount: 15,
      createdDate: new Date('2024-04-12'),
      lastModified: new Date('2024-12-10'),
      groups: ['URBAIN', 'PERIURBAIN', 'RURAL', 'ZONE TOURISTIQUE'],
      attributes: ['B2B', 'RETRAIT_1H']
    },
    {
      id: '5',
      name: 'Tronc Cuisine Nord',
      type: 'TAC',
      status: 'actif',
      articlesCount: 78,
      storesCount: 9,
      createdDate: new Date('2024-05-20'),
      lastModified: new Date('2024-12-08'),
      groups: ['NORD', 'PERIURBAIN', 'ZONE À FORTE FRÉQUENTATION'],
      attributes: ['CUISINE_PRO']
    },
    {
      id: '6',
      name: 'Tronc National',
      type: 'TAN',
      status: 'actif',
      articlesCount: 0,
      storesCount: 0,
      createdDate: new Date('2024-06-01'),
      lastModified: new Date('2024-12-22'),
      groups: [],
      attributes: []
    }
  ];

  filteredTrunks: Trunk[] = [];
  
  // Options de filtres
  trunkTypes = [
    { value: '', label: 'Tous les types' },
    { value: 'TAC', label: 'TAC' },
    { value: 'TAN', label: 'TAN' },
    { value: 'complementaire', label: 'Complémentaire' }
  ];

  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'actif', label: 'Actif' },
    { value: 'brouillon', label: 'Brouillon' },
    { value: 'archive', label: 'Archivé' }
  ];

  // Statistiques
  stats = {
    totalTrunks: 0,
    activeTrunks: 0,
    draftTrunks: 0,
    totalArticles: 0
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.searchForm = this.fb.group({
      searchTerm: [''],
      trunkType: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.filteredTrunks = [...this.trunks];
    this.calculateStats();
    
    // Écouter les changements du formulaire de recherche
    this.searchForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  calculateStats(): void {
    this.stats.totalTrunks = this.trunks.length;
    this.stats.activeTrunks = this.trunks.filter(t => t.status === 'actif').length;
    this.stats.draftTrunks = this.trunks.filter(t => t.status === 'brouillon').length;
    this.stats.totalArticles = this.trunks.reduce((sum, trunk) => sum + trunk.articlesCount, 0);
  }

  applyFilters(): void {
    const formValue = this.searchForm.value;
    
    this.filteredTrunks = this.trunks.filter(trunk => {
      const matchesSearch = !formValue.searchTerm || 
        trunk.name.toLowerCase().includes(formValue.searchTerm.toLowerCase()) ||
        trunk.groups.some(group => group.toLowerCase().includes(formValue.searchTerm.toLowerCase()));
      
      const matchesType = !formValue.trunkType || trunk.type === formValue.trunkType;
      const matchesStatus = !formValue.status || trunk.status === formValue.status;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }

  clearFilters(): void {
    this.searchForm.reset();
    this.filteredTrunks = [...this.trunks];
  }

  createTrunk(): void {
    this.router.navigate(['/create-trunk']);
  }

  editTrunk(trunk: Trunk): void {
    console.log('Éditer le tronc:', trunk.name);
    // Naviguer vers trunk-control avec le nom du tronc en paramètre
    this.router.navigate(['/trunk-control', encodeURIComponent(trunk.name)]);
  }

  duplicateTrunk(trunk: Trunk): void {
    console.log('Dupliquer le tronc:', trunk.name);
    this.snackBar.open(`Tronc "${trunk.name}" dupliqué avec succès`, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  deleteTrunk(trunk: Trunk): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le tronc "${trunk.name}" ?`)) {
      this.trunks = this.trunks.filter(t => t.id !== trunk.id);
      this.applyFilters();
      this.calculateStats();
      
      this.snackBar.open(`Tronc "${trunk.name}" supprimé`, 'Fermer', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    }
  }

  viewTrunkDetails(trunk: Trunk): void {
    console.log('Voir les détails du tronc:', trunk.name);
    this.snackBar.open(`Affichage des détails du tronc "${trunk.name}"`, 'Fermer', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'actif': return 'status-active';
      case 'brouillon': return 'status-draft';
      case 'archive': return 'status-archived';
      default: return '';
    }
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'TAC': return 'type-tac';
      case 'TAN': return 'type-tan';
      case 'complementaire': return 'type-complementaire';
      default: return '';
    }
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }
}