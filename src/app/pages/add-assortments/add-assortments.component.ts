import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map, startWith } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationDialogComponent, ConfirmationDialogData } from './confirmation-dialog.component';
import { SuccessDialogComponent, SuccessDialogData } from './success-dialog.component';

interface Article {
  reference: string;
  libelle: string;
  famille: string;
  sousFamille: string;
  attributs: string[];
  saison: string;
  statut: 'Actif' | 'Inactif';
  checked: boolean;
}

interface FilterOptions {
  familles: string[];
  sousFamilles: string[];
  attributs: string[];
  saisons: string[];
}

@Component({
  selector: 'app-add-assortments',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './add-assortments.component.html',
  styleUrls: ['./add-assortments.component.scss']
})
export class AddAssortmentsComponent implements OnInit {
  
  @Input() isFocusMode: boolean = false;
  @Output() goBack = new EventEmitter<void>();
  
  selectedTrunk: string = 'TAC MONTAGNE 2025';
  selectedTrunkLevel: string = '';
  trunkId: string = '';
  trunkLevelName: string = '';
  
  // Filtres
  selectedFamille: string = '';
  selectedSousFamille: string = '';
  selectedSaison: string = '';
  selectedAttributs: string[] = [];
  newAttribut: string = '';
  filteredAttributs: string[] = [];
  
  // Options pour les filtres
  filterOptions: FilterOptions = {
    familles: [],
    sousFamilles: [],
    attributs: [],
    saisons: []
  };

  removeAttribut(attribut: string): void {
    this.selectedAttributs = this.selectedAttributs.filter(a => a !== attribut);
    this.searchArticles();
  }

  // Méthode pour ajouter un attribut au filtre lors du clic
  addAttributToFilter(attribut: string): void {
    // Éviter les doublons
    if (!this.selectedAttributs.includes(attribut)) {
      this.selectedAttributs.push(attribut);
      this.searchArticles();
    }
  }

  // Méthode pour obtenir la classe CSS d'un attribut selon sa catégorie
  getAttributClass(attribut: string): string {
    const attributCategories = {
      'matiere': ['Doux', 'Naturel', 'Technique', 'Léger', 'Étanche', 'Premium'],
      'style': ['Mode', 'Élégant', 'Tendance', 'Classique', 'Urbain', 'Basique'],
      'fonction': ['Chaud', 'Sportif', 'Outdoor', 'Protection', 'Confort'],
      'caracteristique': ['Coloré', 'Amusant', 'Écoresponsable', 'Été', 'Plage', 'Extérieur']
    };

    for (const [category, attributes] of Object.entries(attributCategories)) {
      if (attributes.includes(attribut)) {
        return `attribut-${category}`;
      }
    }
    
    // Classe par défaut si l'attribut n'est pas catégorisé
    return 'attribut-default';
  }

  displayedColumns: string[] = ['checkbox', 'reference', 'libelle', 'famille', 'sousFamille', 'attributs', 'saison', 'statut'];
  
  articles: Article[] = [
    { reference: 'ART001', libelle: 'Gants polaires noirs', famille: 'Accessoires', sousFamille: 'Gants', attributs: ['Chaud', 'Hiver'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART002', libelle: 'Bonnet laine mérinos gris', famille: 'Accessoires', sousFamille: 'Bonnets', attributs: ['Naturel', 'Premium'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART003', libelle: 'Écharpe cachemire beige', famille: 'Accessoires', sousFamille: 'Écharpes', attributs: ['Premium', 'Doux'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART004', libelle: 'Doudoune homme bleue', famille: 'Vêtements', sousFamille: 'Manteaux', attributs: ['Isolant', 'Imperméable'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART005', libelle: 'Doudoune femme noire', famille: 'Vêtements', sousFamille: 'Manteaux', attributs: ['Isolant', 'Mode'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART006', libelle: 'Bottes neige homme', famille: 'Chaussures', sousFamille: 'Bottes', attributs: ['Étanche', 'Chaud'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART007', libelle: 'Bottes neige femme', famille: 'Chaussures', sousFamille: 'Bottes', attributs: ['Étanche', 'Mode'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART008', libelle: 'Pull col roulé homme', famille: 'Vêtements', sousFamille: 'Pulls', attributs: ['Chaud', 'Basique'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART009', libelle: 'Pull col roulé femme', famille: 'Vêtements', sousFamille: 'Pulls', attributs: ['Chaud', 'Mode'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART010', libelle: 'Parka imperméable mixte', famille: 'Vêtements', sousFamille: 'Manteaux', attributs: ['Imperméable', 'Technique'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART011', libelle: 'Pantalon thermique homme', famille: 'Vêtements', sousFamille: 'Pantalons', attributs: ['Technique', 'Confort'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART012', libelle: 'Pantalon thermique femme', famille: 'Vêtements', sousFamille: 'Pantalons', attributs: ['Technique', 'Confort'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART013', libelle: 'Chaussettes laine épaisse', famille: 'Accessoires', sousFamille: 'Chaussettes', attributs: ['Chaud', 'Confort'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART014', libelle: 'Veste softshell mixte', famille: 'Vêtements', sousFamille: 'Vestes', attributs: ['Imperméable', 'Respirant'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART015', libelle: 'Gants tactiles hiver', famille: 'Accessoires', sousFamille: 'Gants', attributs: ['Technique', 'Urbain'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART016', libelle: 'Manteau long femme', famille: 'Vêtements', sousFamille: 'Manteaux', attributs: ['Élégant', 'Mode'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART017', libelle: 'Veste matelassée homme', famille: 'Vêtements', sousFamille: 'Vestes', attributs: ['Chaud', 'Léger'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART018', libelle: 'Sous-gants soie', famille: 'Accessoires', sousFamille: 'Gants', attributs: ['Léger', 'Technique'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART019', libelle: 'Tour de cou polaire', famille: 'Accessoires', sousFamille: 'Écharpes', attributs: ['Chaud', 'Doux'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART020', libelle: 'Cache-oreilles unisexe', famille: 'Accessoires', sousFamille: 'Bonnets', attributs: ['Confort', 'Chaud'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART021', libelle: 'Bonnet enfant à pompon', famille: 'Enfant', sousFamille: 'Bonnets', attributs: ['Amusant', 'Doux'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART022', libelle: 'Écharpe tricot enfant', famille: 'Enfant', sousFamille: 'Écharpes', attributs: ['Doux', 'Coloré'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART023', libelle: 'Doudoune enfant', famille: 'Enfant', sousFamille: 'Manteaux', attributs: ['Chaud', 'Léger'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART024', libelle: 'Gants ski junior', famille: 'Enfant', sousFamille: 'Gants', attributs: ['Étanche', 'Technique'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART025', libelle: 'Sous-vêtement thermique enfant', famille: 'Enfant', sousFamille: 'Sous-vêtements', attributs: ['Technique', 'Chaud'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART026', libelle: 'Pull laine recyclée', famille: 'Vêtements', sousFamille: 'Pulls', attributs: ['Écoresponsable', 'Naturel'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART027', libelle: 'Bottines cuir femme', famille: 'Chaussures', sousFamille: 'Bottines', attributs: ['Mode', 'Urbain'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART028', libelle: 'Bottines cuir homme', famille: 'Chaussures', sousFamille: 'Bottines', attributs: ['Urbain', 'Classique'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART029', libelle: 'Veste polaire légère', famille: 'Vêtements', sousFamille: 'Vestes', attributs: ['Léger', 'Chaud'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART030', libelle: 'Pantalon softshell', famille: 'Vêtements', sousFamille: 'Pantalons', attributs: ['Technique', 'Outdoor'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART031', libelle: 'Gants de ski adulte', famille: 'Accessoires', sousFamille: 'Gants', attributs: ['Étanche', 'Sportif'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART032', libelle: 'Bonnet doublure polaire', famille: 'Accessoires', sousFamille: 'Bonnets', attributs: ['Chaud', 'Confort'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART033', libelle: 'Parka mi-saison', famille: 'Vêtements', sousFamille: 'Manteaux', attributs: ['Léger', 'Urbain'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART034', libelle: 'Cache-cou coloré', famille: 'Accessoires', sousFamille: 'Écharpes', attributs: ['Coloré', 'Mode'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART035', libelle: 'Bandeau hiver', famille: 'Accessoires', sousFamille: 'Bonnets', attributs: ['Léger', 'Sportif'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART036', libelle: 'Bonnet fantaisie', famille: 'Accessoires', sousFamille: 'Bonnets', attributs: ['Coloré', 'Amusant'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART037', libelle: 'Chaussons d\'intérieur', famille: 'Maison', sousFamille: 'Confort', attributs: ['Doux', 'Chaud'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART038', libelle: 'Poncho polaire', famille: 'Vêtements', sousFamille: 'Ponchos', attributs: ['Doux', 'Confort'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART039', libelle: 'Chaussettes fantaisie', famille: 'Accessoires', sousFamille: 'Chaussettes', attributs: ['Coloré', 'Amusant'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART040', libelle: 'Gilet tricot torsadé', famille: 'Vêtements', sousFamille: 'Pulls', attributs: ['Classique', 'Confort'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART041', libelle: 'Pull col V léger', famille: 'Vêtements', sousFamille: 'Pulls', attributs: ['Léger', 'Basique'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART042', libelle: 'Manteau fausse fourrure', famille: 'Vêtements', sousFamille: 'Manteaux', attributs: ['Mode', 'Doux'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART043', libelle: 'Écharpe à carreaux', famille: 'Accessoires', sousFamille: 'Écharpes', attributs: ['Classique', 'Chaud'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART044', libelle: 'Mitaines laine', famille: 'Accessoires', sousFamille: 'Gants', attributs: ['Léger', 'Urbain'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART045', libelle: 'Veste doudou', famille: 'Vêtements', sousFamille: 'Vestes', attributs: ['Doux', 'Mode'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART046', libelle: 'Gants cuir doublés', famille: 'Accessoires', sousFamille: 'Gants', attributs: ['Premium', 'Urbain'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART047', libelle: 'Bottes pluie mode', famille: 'Chaussures', sousFamille: 'Bottes', attributs: ['Étanche', 'Mode'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART048', libelle: 'Bonnet sportswear', famille: 'Accessoires', sousFamille: 'Bonnets', attributs: ['Sportif', 'Léger'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART049', libelle: 'Poncho imperméable', famille: 'Vêtements', sousFamille: 'Ponchos', attributs: ['Étanche', 'Léger'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART050', libelle: 'Pull oversize femme', famille: 'Vêtements', sousFamille: 'Pulls', attributs: ['Tendance', 'Confort'], saison: 'Hiver 2025', statut: 'Actif', checked: false },
    { reference: 'ART051', libelle: 'Tongs colorées femme', famille: 'Chaussures', sousFamille: 'Tongs', attributs: ['Léger', 'Été'], saison: 'Été 2025', statut: 'Actif', checked: false },
    { reference: 'ART052', libelle: 'Tongs homme classiques', famille: 'Chaussures', sousFamille: 'Tongs', attributs: ['Léger', 'Basique'], saison: 'Été 2025', statut: 'Actif', checked: false },
    { reference: 'ART053', libelle: 'Maillot de bain une pièce', famille: 'Bain', sousFamille: 'Maillots', attributs: ['Mode', 'Confort'], saison: 'Été 2025', statut: 'Actif', checked: false },
    { reference: 'ART054', libelle: 'Maillot de bain homme short', famille: 'Bain', sousFamille: 'Maillots', attributs: ['Sportif', 'Léger'], saison: 'Été 2025', statut: 'Actif', checked: false },
    { reference: 'ART055', libelle: 'Chapeau de paille femme', famille: 'Accessoires', sousFamille: 'Chapeaux', attributs: ['Léger', 'Naturel'], saison: 'Été 2025', statut: 'Actif', checked: false },
    { reference: 'ART056', libelle: 'Chapeau homme en toile', famille: 'Accessoires', sousFamille: 'Chapeaux', attributs: ['Léger', 'Outdoor'], saison: 'Été 2025', statut: 'Actif', checked: false },
    { reference: 'ART057', libelle: 'Lunettes de soleil rondes', famille: 'Accessoires', sousFamille: 'Lunettes', attributs: ['Mode', 'Protection'], saison: 'Été 2025', statut: 'Actif', checked: false },
    { reference: 'ART058', libelle: 'Lunettes de soleil sport', famille: 'Accessoires', sousFamille: 'Lunettes', attributs: ['Sportif', 'Protection'], saison: 'Été 2025', statut: 'Actif', checked: false },
    { reference: 'ART059', libelle: 'Serviette de plage XXL', famille: 'Maison', sousFamille: 'Serviettes', attributs: ['Doux', 'Coloré'], saison: 'Été 2025', statut: 'Actif', checked: false },
    { reference: 'ART060', libelle: 'Sac de plage tissé', famille: 'Accessoires', sousFamille: 'Sacs', attributs: ['Naturel', 'Léger'], saison: 'Été 2025', statut: 'Actif', checked: false },
    { reference: 'ART061', libelle: 'Robe de plage fluide', famille: 'Vêtements', sousFamille: 'Robes', attributs: ['Léger', 'Mode'], saison: 'Été 2025', statut: 'Actif', checked: false },
    { reference: 'ART062', libelle: 'Chemise lin homme', famille: 'Vêtements', sousFamille: 'Chemises', attributs: ['Léger', 'Naturel'], saison: 'Été 2025', statut: 'Actif', checked: false },
    { reference: 'ART063', libelle: 'Short coton femme', famille: 'Vêtements', sousFamille: 'Shorts', attributs: ['Léger', 'Basique'], saison: 'Été 2025', statut: 'Actif', checked: false },
    { reference: 'ART064', libelle: 'Short de bain enfant', famille: 'Enfant', sousFamille: 'Maillots', attributs: ['Coloré', 'Sportif'], saison: 'Été 2025', statut: 'Actif', checked: false },
    { reference: 'ART065', libelle: 'Claquettes piscine', famille: 'Chaussures', sousFamille: 'Claquettes', attributs: ['Étanche', 'Léger'], saison: 'Été 2025', statut: 'Actif', checked: false },
    { reference: 'ART066', libelle: 'Paréo imprimé', famille: 'Accessoires', sousFamille: 'Paréos', attributs: ['Léger', 'Coloré'], saison: 'Été 2025', statut: 'Actif', checked: false },
    { reference: 'ART067', libelle: 'Sandales cuir femme', famille: 'Chaussures', sousFamille: 'Sandales', attributs: ['Naturel', 'Mode'], saison: 'Été 2025', statut: 'Actif', checked: false },
    { reference: 'ART068', libelle: 'Sandales homme', famille: 'Chaussures', sousFamille: 'Sandales', attributs: ['Basique', 'Léger'], saison: 'Été 2025', statut: 'Actif', checked: false },
    { reference: 'ART069', libelle: 'Débardeur coton homme', famille: 'Vêtements', sousFamille: 'Débardeurs', attributs: ['Léger', 'Sportif'], saison: 'Été 2025', statut: 'Actif', checked: false },
    { reference: 'ART070', libelle: 'Débardeur fluide femme', famille: 'Vêtements', sousFamille: 'Débardeurs', attributs: ['Léger', 'Mode'], saison: 'Été 2025', statut: 'Actif', checked: false },
    { reference: 'ART071', libelle: 'Panier osier', famille: 'Accessoires', sousFamille: 'Sacs', attributs: ['Naturel', 'Plage'], saison: 'Été 2025', statut: 'Actif', checked: false },
    { reference: 'ART072', libelle: 'Tapis de plage', famille: 'Maison', sousFamille: 'Plage', attributs: ['Léger', 'Extérieur'], saison: 'Été 2025', statut: 'Actif', checked: false },
    { reference: 'ART073', libelle: 'Espadrilles femme', famille: 'Chaussures', sousFamille: 'Espadrilles', attributs: ['Naturel', 'Léger'], saison: 'Été 2025', statut: 'Actif', checked: false },
    { reference: 'ART074', libelle: 'Espadrilles homme', famille: 'Chaussures', sousFamille: 'Espadrilles', attributs: ['Léger', 'Basique'], saison: 'Été 2025', statut: 'Actif', checked: false },
    { reference: 'ART075', libelle: 'Serviette microfibre', famille: 'Maison', sousFamille: 'Serviettes', attributs: ['Technique', 'Léger'], saison: 'Été 2025', statut: 'Actif', checked: false }
  ];

  filteredArticles: Article[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Récupérer les paramètres de route
    this.route.queryParams.subscribe(params => {
      if (params['trunkId']) {
        this.trunkId = params['trunkId'];
        this.selectedTrunk = params['trunkName'] || 'Tronc sélectionné';
        this.selectedTrunkLevel = params['trunkLevel'] || '';
        this.trunkLevelName = params['trunkLevelName'] || '';
      }
    });
    
    this.initializeFilterOptions();
    this.filteredArticles = [...this.articles];
  }

  initializeFilterOptions(): void {
    // Extraire les options uniques pour les filtres
    this.filterOptions.familles = [...new Set(this.articles.map(a => a.famille))].sort();
    this.filterOptions.sousFamilles = [...new Set(this.articles.map(a => a.sousFamille))].sort();
    this.filterOptions.saisons = [...new Set(this.articles.map(a => a.saison))].sort();
    
    // Extraire tous les attributs uniques
    const allAttributs = this.articles.flatMap(a => a.attributs);
    this.filterOptions.attributs = [...new Set(allAttributs)].sort();
    
    // Initialiser les attributs filtrés avec tous les attributs
    this.filteredAttributs = [...this.filterOptions.attributs];
  }

  addAttribut(): void {
    if (this.newAttribut.trim() && !this.selectedAttributs.includes(this.newAttribut.trim())) {
      this.selectedAttributs.push(this.newAttribut.trim());
      this.newAttribut = '';
      // Réinitialiser les attributs filtrés
      this.filteredAttributs = [...this.filterOptions.attributs];
    }
  }

  filterAttributs(): void {
    if (!this.newAttribut.trim()) {
      this.filteredAttributs = [...this.filterOptions.attributs];
    } else {
      const searchTerm = this.newAttribut.toLowerCase();
      this.filteredAttributs = this.filterOptions.attributs.filter(attribut =>
        attribut.toLowerCase().includes(searchTerm)
      );
    }
  }

  onAttributSelected(event: MatAutocompleteSelectedEvent): void {
    const selectedAttribut = event.option.value;
    if (selectedAttribut && !this.selectedAttributs.includes(selectedAttribut)) {
      this.selectedAttributs.push(selectedAttribut);
      this.newAttribut = '';
      this.filteredAttributs = [...this.filterOptions.attributs];
      // Appliquer automatiquement les filtres après ajout d'un attribut
      this.searchArticles();
    }
  }

  selectAttributFromList(attribut: string): void {
    if (!this.selectedAttributs.includes(attribut)) {
      this.selectedAttributs.push(attribut);
      this.newAttribut = '';
      this.filteredAttributs = [...this.filterOptions.attributs];
    }
  }

  onFilterChange(): void {
    // Réinitialiser la sous-famille si elle n'est plus disponible
    if (this.selectedSousFamille && this.selectedFamille) {
      const availableSousFamilles = this.getAvailableSousFamilles();
      if (!availableSousFamilles.includes(this.selectedSousFamille)) {
        this.selectedSousFamille = '';
      }
    }
    
    // Appliquer automatiquement les filtres
    this.searchArticles();
  }

  getAvailableSousFamilles(): string[] {
    if (!this.selectedFamille) {
      return this.filterOptions.sousFamilles;
    }
    
    // Filtrer les sous-familles selon la famille sélectionnée
    const sousFamillesForFamille = this.articles
      .filter(article => article.famille === this.selectedFamille)
      .map(article => article.sousFamille);
    
    return [...new Set(sousFamillesForFamille)].sort();
  }

  searchArticles(): void {
    this.filteredArticles = this.articles.filter(article => {
      // Logique ET pour les filtres
      let matches = true;
      
      if (this.selectedFamille && article.famille !== this.selectedFamille) {
        matches = false;
      }
      
      if (this.selectedSousFamille && article.sousFamille !== this.selectedSousFamille) {
        matches = false;
      }
      
      if (this.selectedSaison && article.saison !== this.selectedSaison) {
        matches = false;
      }
      
      if (this.selectedAttributs.length > 0) {
        const hasMatchingAttribut = this.selectedAttributs.some(attr => 
          article.attributs.includes(attr)
        );
        if (!hasMatchingAttribut) {
          matches = false;
        }
      }
      
      return matches;
    });
  }

  clearFilters(): void {
    this.selectedFamille = '';
    this.selectedSousFamille = '';
    this.selectedSaison = '';
    this.selectedAttributs = [];
    this.filteredArticles = [...this.articles];
  }

  toggleAll(checked: boolean): void {
    this.filteredArticles.forEach(article => {
      article.checked = checked;
    });
  }

  areAllSelected(): boolean {
    return this.filteredArticles.length > 0 && this.filteredArticles.every(article => article.checked);
  }

  isIndeterminate(): boolean {
    const checkedCount = this.filteredArticles.filter(article => article.checked).length;
    return checkedCount > 0 && checkedCount < this.filteredArticles.length;
  }

  getSelectedCount(): number {
    return this.filteredArticles.filter(article => article.checked).length;
  }

  affectArticlesToTrunk(): void {
    const selectedArticles = this.filteredArticles.filter(article => article.checked);
    
    if (selectedArticles.length === 0) {
      return;
    }

    // Préparer les données pour la popup de confirmation
    const dialogData: ConfirmationDialogData = {
      articleCount: selectedArticles.length,
      trunkName: this.selectedTrunk,
      trunkLevel: this.trunkLevelName || 'Niveau non spécifié'
    };

    // Ouvrir la popup de confirmation
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '450px',
      data: dialogData,
      disableClose: true
    });

    // Traiter la réponse de l'utilisateur
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // L'utilisateur a confirmé, procéder à l'affectation
        console.log(`Affectation de ${selectedArticles.length} articles au tronc ${this.selectedTrunk}:`, selectedArticles);
        
        // Préparer les données pour la popup de succès
        const successDialogData: SuccessDialogData = {
          articlesCount: selectedArticles.length,
          trunkName: this.selectedTrunk,
          trunkLevel: this.trunkLevelName || 'Niveau non spécifié'
        };

        // Ouvrir la popup de succès
        const successDialogRef = this.dialog.open(SuccessDialogComponent, {
          width: '450px',
          data: successDialogData,
          disableClose: true
        });

        // Réinitialiser les sélections après fermeture de la popup de succès
        successDialogRef.afterClosed().subscribe(() => {
          this.filteredArticles.forEach(article => article.checked = false);
        });
      }
      // Si result === false, l'utilisateur a annulé, ne rien faire
    });
  }

  // Méthode pour retourner à la sélection du tronc
  goBackToTrunkSelection(): void {
    this.router.navigate(['/trunk-selection']);
  }
}