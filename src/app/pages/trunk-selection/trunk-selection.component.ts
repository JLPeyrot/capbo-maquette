import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { Router } from '@angular/router';
import { TrunksService } from '../../services/trunks.service';

interface Trunk {
  id: string;
  name: string;
  description?: string;
  createdDate: Date;
  isNew?: boolean; // Pour identifier les nouveaux troncs créés
}

interface TrunkLevel {
  id: number;
  name: string;
  label: string;
}

@Component({
  selector: 'app-trunk-selection',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './trunk-selection.component.html',
  styleUrls: ['./trunk-selection.component.scss']
})
export class TrunkSelectionComponent implements OnInit {

  selectedTrunk: Trunk | null = null;
  selectedTrunkLevel: TrunkLevel | null = null;
  searchQuery: string = '';
  trunkInput: string = '';
  filteredTrunks: Trunk[] = [];

  // Troncs existants (chargés via service)
  availableTrunks: Trunk[] = [];

  // Niveaux de tronc disponibles
  trunkLevels: TrunkLevel[] = [
    { id: 1, name: 'mini', label: '1 - Mini' },
    { id: 2, name: 'classique', label: '2 - Classique' },
    { id: 3, name: 'grand', label: '3 - Grand' },
    { id: 4, name: 'maxi', label: '4 - Maxi' },
    { id: 5, name: 'geant', label: '5 - Géant' }
  ];

  constructor(private router: Router, private trunksService: TrunksService) {}

  ngOnInit(): void {
    this.trunksService.getTrunks().subscribe(items => {
      // Adapter au format local (description optionnelle)
      this.availableTrunks = items.map(i => ({
        id: i.id,
        name: i.name,
        createdDate: i.createdDate,
        description: undefined
      }));
      this.filteredTrunks = [...this.availableTrunks];
    });
  }

  // Méthodes pour la recherche et filtrage
  filterTrunks(): void {
    const query = this.trunkInput.toLowerCase().trim();
    if (!query) {
      this.filteredTrunks = [...this.availableTrunks];
    } else {
      this.filteredTrunks = this.availableTrunks.filter(trunk =>
        trunk.name.toLowerCase().includes(query) ||
        (trunk.description || '').toLowerCase().includes(query)
      );
  }
  }

  // Méthode pour afficher le tronc sélectionné dans l'input
  displayTrunk(trunk: Trunk | null): string {
    return trunk ? trunk.name : '';
  }

  // Méthode pour créer une option "nouveau tronc"
  createNewTrunkOption(): Trunk {
    return {
      id: 'new-' + Date.now(),
      name: this.trunkInput,
      description: 'Nouveau tronc à créer',
      createdDate: new Date(),
      isNew: true
    };
  }

  // Gestion de la sélection
  onTrunkSelected(event: any): void {
    const selectedTrunk = event.option.value;
    
    if (selectedTrunk.isNew) {
      // Rediriger vers la création d'un nouveau tronc avec le nom pré-rempli
      this.router.navigate(['/create-trunk'], {
        queryParams: { name: selectedTrunk.name }
      });
    } else {
      // Sélectionner un tronc existant
      this.selectedTrunk = selectedTrunk;
      this.trunkInput = selectedTrunk.name;
      this.selectedTrunkLevel = null; // Reset trunk level when trunk changes
    }
  }

  // Sélectionner un niveau de tronc
  onTrunkLevelSelected(level: TrunkLevel): void {
    this.selectedTrunkLevel = level;
  }

  // Navigation vers la création d'un nouveau tronc
  navigateToCreateTrunk(): void {
    console.log('navigateToCreateTrunk appelée');
    console.log('Tentative de navigation vers /create-trunk');
    this.router.navigate(['/create-trunk']).then(
      (success) => console.log('Navigation réussie:', success),
      (error) => console.error('Erreur de navigation:', error)
    );
  }

  // Continuer vers l'ajout d'assortiments
  continueToAddAssortments(): void {
    console.log('continueToAddAssortments appelée');
    console.log('selectedTrunk:', this.selectedTrunk);
    console.log('selectedTrunkLevel:', this.selectedTrunkLevel);
    
    if (this.selectedTrunk && this.selectedTrunkLevel) {
      console.log('Tentative de navigation vers /create-assortments');
      // Passer les données sélectionnées à la page suivante
      this.router.navigate(['/create-assortments'], {
        queryParams: {
          trunkId: this.selectedTrunk.id,
          trunkName: this.selectedTrunk.name,
          trunkLevel: this.selectedTrunkLevel.id,
          trunkLevelName: this.selectedTrunkLevel.name
        }
      }).then(
        (success) => console.log('Navigation vers create-assortments réussie:', success),
        (error) => console.error('Erreur de navigation vers create-assortments:', error)
      );
    } else {
      console.log('Navigation impossible: tronc ou niveau manquant');
    }
  }

  // Vérifier si on peut continuer
  canContinue(): boolean {
    return this.selectedTrunk !== null && this.selectedTrunkLevel !== null;
  }

  // Créer un nouveau tronc
  createNewTrunk(): void {
    console.log('Création d\'un nouveau tronc');
    // Ici vous pouvez ajouter la logique pour naviguer vers la page de création de tronc
    // ou ouvrir un modal de création
  }
}
