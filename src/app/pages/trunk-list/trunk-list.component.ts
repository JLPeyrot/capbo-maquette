import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { TrunksService } from '../../services/trunks.service';

export interface Trunk {
  id: string;
  name: string;
  type: 'TAC' | 'TAN' | 'complementaire';
  enseigne?: string; // non présent dans troncs.json
  status: 'actif' | 'brouillon' | 'archive' | 'inactif';
  articlesCount: number;
  createdDate: Date;
  lastModified: Date;
  description?: string;
}

@Component({
  selector: 'app-trunk-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './trunk-list.component.html',
  styleUrls: ['./trunk-list.component.scss']
})
export class TrunkListComponent implements OnInit {
  
  // Données des troncs (chargées via service)
  trunks: Trunk[] = [];

  filteredTrunks: Trunk[] = [];
  
  // Filtres
  searchTerm: string = '';
  selectedType: string = '';
  selectedEnseigne: string = '';
  selectedStatus: string = '';

  // Options pour les enseignes
  enseignes = [
    { value: 'carrefour', label: 'Carrefour' },
    { value: 'leclerc', label: 'E.Leclerc' },
    { value: 'intermarche', label: 'Intermarché' },
    { value: 'super-u', label: 'Super U' },
    { value: 'casino', label: 'Casino' },
    { value: 'monoprix', label: 'Monoprix' },
    { value: 'franprix', label: 'Franprix' }
  ];

  // Colonnes du tableau
  displayedColumns: string[] = ['name', 'type', 'enseigne', 'status', 'articlesCount', 'createdDate', 'actions'];

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private trunksService: TrunksService
  ) {}

  ngOnInit(): void {
    this.trunksService.getTrunks().subscribe(items => {
      // Adapter au format local; champ enseigne non disponible
      this.trunks = items.map(i => ({
        id: i.id,
        name: i.name,
        type: i.type,
        status: i.status as any,
        articlesCount: i.articlesCount,
        createdDate: i.createdDate,
        lastModified: i.lastModified,
        enseigne: '',
        description: undefined
      }));
      this.filteredTrunks = [...this.trunks];
    });
  }

  /**
   * Filtrer les troncs selon les critères de recherche
   */
  filterTrunks(): void {
    this.filteredTrunks = this.trunks.filter(trunk => {
      const matchesSearch = !this.searchTerm || 
        trunk.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (trunk.enseigne || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (trunk.description && trunk.description.toLowerCase().includes(this.searchTerm.toLowerCase()));

      const matchesType = !this.selectedType || trunk.type === this.selectedType;
      const matchesEnseigne = !this.selectedEnseigne || !trunk.enseigne || (trunk.enseigne.toLowerCase() === this.selectedEnseigne);
      const matchesStatus = !this.selectedStatus || trunk.status === this.selectedStatus;

      return matchesSearch && matchesType && matchesEnseigne && matchesStatus;
    });
  }

  /**
   * Naviguer vers la création d'un nouveau tronc
   */
  navigateToCreateTrunk(): void {
    this.router.navigate(['/assortment-trunk']);
  }

  /**
   * Voir les détails d'un tronc
   */
  viewTrunk(trunk: Trunk): void {
    console.log('Voir le tronc:', trunk);
    // TODO: Implémenter la vue détaillée
  }

  /**
   * Modifier un tronc
   */
  editTrunk(trunk: Trunk): void {
    console.log('Modifier le tronc:', trunk);
    this.router.navigate(['/assortment-trunk'], {
      queryParams: { id: trunk.id, mode: 'edit' }
    });
  }

  /**
   * Ajouter des assortiments à un tronc
   */
  addAssortments(trunk: Trunk): void {
    console.log('Ajouter des assortiments au tronc:', trunk);
    this.router.navigate(['/add-assortments'], {
      queryParams: {
        trunkId: trunk.id,
        trunkName: trunk.name
      }
    });
  }

  /**
   * Effacer tous les filtres
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedEnseigne = '';
    this.selectedStatus = '';
    this.filterTrunks();
  }

  /**
   * Supprimer un tronc
   */
  deleteTrunk(trunk: Trunk): void {
    console.log('Supprimer le tronc:', trunk);
    // TODO: Implémenter la confirmation de suppression
    if (confirm(`Êtes-vous sûr de vouloir supprimer le tronc "${trunk.name}" ?`)) {
      const index = this.trunks.findIndex(t => t.id === trunk.id);
      if (index > -1) {
        this.trunks.splice(index, 1);
        this.filterTrunks();
      }
    }
  }

  /**
   * Obtenir l'icône du statut
   */
  getStatusIcon(status: string): string {
    switch (status) {
      case 'actif':
        return 'check_circle';
      case 'inactif':
        return 'cancel';
      case 'brouillon':
        return 'edit';
      default:
        return 'help';
    }
  }

  /**
   * Obtenir le label du statut
   */
  getStatusLabel(status: string): string {
    switch (status) {
      case 'actif':
        return 'Actif';
      case 'inactif':
        return 'Inactif';
      case 'brouillon':
        return 'Brouillon';
      default:
        return 'Inconnu';
    }
  }
}
