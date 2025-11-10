import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';

interface Article {
  reference: string;
  libelle: string;
  famille: string;
  sousFamille: string;
  checked: boolean;
  type: 'ferme' | 'mixte' | 'ouvert';
}

@Component({
  selector: 'app-reception-trunk',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './reception-trunk.component.html',
  styleUrls: ['./reception-trunk.component.scss']
})
export class ReceptionTrunkComponent implements OnInit {
  
  selectedTab: 'ferme' | 'mixte' | 'ouvert' = 'ferme';
  selectedTabIndex: number = 0;
  filterText: string = '';
  displayedColumns: string[] = ['checkbox', 'reference', 'libelle', 'famille'];
  
  articles: Article[] = [
    // Articles Fermés
    { reference: 'ART001', libelle: 'Gants polaires noirs', famille: 'Accessoires', sousFamille: 'Gants', checked: true, type: 'ferme' },
    { reference: 'ART002', libelle: 'Bonnet laine mérinos gris', famille: 'Accessoires', sousFamille: 'Bonnets', checked: true, type: 'ferme' },
    { reference: 'ART003', libelle: 'Écharpe cachemire beige', famille: 'Accessoires', sousFamille: 'Écharpes', checked: true, type: 'ferme' },
    { reference: 'ART004', libelle: 'Doudoune homme bleue', famille: 'Vêtements', sousFamille: 'Doudounes', checked: true, type: 'ferme' },
    { reference: 'ART005', libelle: 'Doudoune femme noire', famille: 'Vêtements', sousFamille: 'Doudounes', checked: true, type: 'ferme' },
    { reference: 'ART006', libelle: 'Bottes neige homme', famille: 'Chaussures', sousFamille: 'Bottes', checked: true, type: 'ferme' },
    { reference: 'ART007', libelle: 'Bottes neige femme', famille: 'Chaussures', sousFamille: 'Bottes', checked: true, type: 'ferme' },
    { reference: 'ART008', libelle: 'Pull col roulé homme', famille: 'Vêtements', sousFamille: 'Pulls', checked: true, type: 'ferme' },
    { reference: 'ART009', libelle: 'Pull col roulé femme', famille: 'Vêtements', sousFamille: 'Pulls', checked: true, type: 'ferme' },
    { reference: 'ART010', libelle: 'Parka imperméable mixte', famille: 'Vêtements', sousFamille: 'Parkas', checked: true, type: 'ferme' },
    { reference: 'ART011', libelle: 'Pantalon thermique homme', famille: 'Vêtements', sousFamille: 'Pantalons', checked: true, type: 'ferme' },
    { reference: 'ART012', libelle: 'Pantalon thermique femme', famille: 'Vêtements', sousFamille: 'Pantalons', checked: true, type: 'ferme' },
    { reference: 'ART013', libelle: 'Chaussettes laine épaisse', famille: 'Accessoires', sousFamille: 'Chaussettes', checked: true, type: 'ferme' },
    { reference: 'ART014', libelle: 'Veste softshell mixte', famille: 'Vêtements', sousFamille: 'Vestes', checked: true, type: 'ferme' },
    { reference: 'ART015', libelle: 'Gants tactiles hiver', famille: 'Accessoires', sousFamille: 'Gants', checked: true, type: 'ferme' },
    { reference: 'ART016', libelle: 'Manteau long femme', famille: 'Vêtements', sousFamille: 'Manteaux', checked: true, type: 'ferme' },
    { reference: 'ART017', libelle: 'Veste matelassée homme', famille: 'Vêtements', sousFamille: 'Vestes', checked: true, type: 'ferme' },
    { reference: 'ART018', libelle: 'Sous-gants soie', famille: 'Accessoires', sousFamille: 'Gants', checked: true, type: 'ferme' },
    { reference: 'ART019', libelle: 'Tour de cou polaire', famille: 'Accessoires', sousFamille: 'Tours de cou', checked: true, type: 'ferme' },
    { reference: 'ART020', libelle: 'Combinaison ski enfant', famille: 'Vêtements', sousFamille: 'Combinaisons', checked: true, type: 'ferme' },

    // Articles Mixtes
    { reference: 'ART021', libelle: 'T-shirt coton bio blanc', famille: 'Vêtements', sousFamille: 'T-shirts', checked: true, type: 'mixte' },
    { reference: 'ART022', libelle: 'Jean slim homme bleu', famille: 'Vêtements', sousFamille: 'Jeans', checked: true, type: 'mixte' },
    { reference: 'ART023', libelle: 'Robe été femme fleurie', famille: 'Vêtements', sousFamille: 'Robes', checked: true, type: 'mixte' },
    { reference: 'ART024', libelle: 'Chemise homme blanche', famille: 'Vêtements', sousFamille: 'Chemises', checked: true, type: 'mixte' },
    { reference: 'ART025', libelle: 'Baskets running mixte', famille: 'Chaussures', sousFamille: 'Baskets', checked: true, type: 'mixte' },
    { reference: 'ART026', libelle: 'Veste blazer femme', famille: 'Vêtements', sousFamille: 'Vestes', checked: true, type: 'mixte' },
    { reference: 'ART027', libelle: 'Short sport homme', famille: 'Vêtements', sousFamille: 'Shorts', checked: true, type: 'mixte' },
    { reference: 'ART028', libelle: 'Legging sport femme', famille: 'Vêtements', sousFamille: 'Leggings', checked: true, type: 'mixte' },
    { reference: 'ART029', libelle: 'Polo homme marine', famille: 'Vêtements', sousFamille: 'Polos', checked: true, type: 'mixte' },
    { reference: 'ART030', libelle: 'Cardigan femme gris', famille: 'Vêtements', sousFamille: 'Cardigans', checked: true, type: 'mixte' },
    { reference: 'ART031', libelle: 'Pantalon chino homme', famille: 'Vêtements', sousFamille: 'Pantalons', checked: true, type: 'mixte' },
    { reference: 'ART032', libelle: 'Jupe midi femme noire', famille: 'Vêtements', sousFamille: 'Jupes', checked: true, type: 'mixte' },
    { reference: 'ART033', libelle: 'Pull-over homme laine', famille: 'Vêtements', sousFamille: 'Pulls', checked: true, type: 'mixte' },
    { reference: 'ART034', libelle: 'Blouse femme soie', famille: 'Vêtements', sousFamille: 'Blouses', checked: true, type: 'mixte' },
    { reference: 'ART035', libelle: 'Mocassins cuir homme', famille: 'Chaussures', sousFamille: 'Mocassins', checked: true, type: 'mixte' },

    // Articles Ouverts
    { reference: 'ART036', libelle: 'Maillot de bain homme', famille: 'Vêtements', sousFamille: 'Maillots', checked: false, type: 'ouvert' },
    { reference: 'ART037', libelle: 'Bikini femme rouge', famille: 'Vêtements', sousFamille: 'Bikinis', checked: false, type: 'ouvert' },
    { reference: 'ART038', libelle: 'Sandales été femme', famille: 'Chaussures', sousFamille: 'Sandales', checked: false, type: 'ouvert' },
    { reference: 'ART039', libelle: 'Tongs homme noires', famille: 'Chaussures', sousFamille: 'Tongs', checked: false, type: 'ouvert' },
    { reference: 'ART040', libelle: 'Chapeau soleil paille', famille: 'Accessoires', sousFamille: 'Chapeaux', checked: false, type: 'ouvert' },
    { reference: 'ART041', libelle: 'Lunettes soleil mixte', famille: 'Accessoires', sousFamille: 'Lunettes', checked: false, type: 'ouvert' },
    { reference: 'ART042', libelle: 'Short bain homme', famille: 'Vêtements', sousFamille: 'Shorts', checked: false, type: 'ouvert' },
    { reference: 'ART043', libelle: 'Paréo femme tropical', famille: 'Accessoires', sousFamille: 'Paréos', checked: false, type: 'ouvert' },
    { reference: 'ART044', libelle: 'Débardeur homme blanc', famille: 'Vêtements', sousFamille: 'Débardeurs', checked: false, type: 'ouvert' },
    { reference: 'ART045', libelle: 'Top femme dentelle', famille: 'Vêtements', sousFamille: 'Tops', checked: false, type: 'ouvert' },
    { reference: 'ART046', libelle: 'Bermuda homme kaki', famille: 'Vêtements', sousFamille: 'Bermudas', checked: false, type: 'ouvert' },
    { reference: 'ART047', libelle: 'Robe plage femme', famille: 'Vêtements', sousFamille: 'Robes', checked: false, type: 'ouvert' },
    { reference: 'ART048', libelle: 'Casquette sport mixte', famille: 'Accessoires', sousFamille: 'Casquettes', checked: false, type: 'ouvert' },
    { reference: 'ART049', libelle: 'Espadrilles femme', famille: 'Chaussures', sousFamille: 'Espadrilles', checked: false, type: 'ouvert' },
    { reference: 'ART050', libelle: 'Sac plage étanche', famille: 'Accessoires', sousFamille: 'Sacs', checked: false, type: 'ouvert' }
  ];

  ngOnInit(): void {
    // Initialisation du composant
  }

  get filteredArticles(): Article[] {
    return this.articles
      .filter(article => article.type === this.selectedTab)
      .filter(article => 
        !this.filterText || 
        article.reference.toLowerCase().includes(this.filterText.toLowerCase()) ||
        article.libelle.toLowerCase().includes(this.filterText.toLowerCase()) ||
        article.famille.toLowerCase().includes(this.filterText.toLowerCase())
      );
  }

  selectTab(tab: 'ferme' | 'mixte' | 'ouvert'): void {
    this.selectedTab = tab;
  }

  toggleAll(checked: boolean): void {
    this.filteredArticles.forEach(article => {
      article.checked = checked;
    });
  }

  isCheckboxDisabled(): boolean {
    return this.selectedTab === 'ferme'; // Verrouiller les checkboxes dans l'onglet fermé
  }

  exportList(): void {
    const selectedArticles = this.filteredArticles.filter(article => article.checked);
    console.log('Articles sélectionnés pour export:', selectedArticles);
    // Ici vous pouvez ajouter la logique d'export
  }

  getTabIcon(tab: string): string {
    switch(tab) {
      case 'ferme': return 'lock';
      case 'mixte': return 'settings';
      case 'ouvert': return 'check_circle';
      default: return '';
    }
  }

  getTabLabel(tab: string): string {
    switch(tab) {
      case 'ferme': return 'Fermé';
      case 'mixte': return 'Mixte';
      case 'ouvert': return 'Ouvert';
      default: return '';
    }
  }

  onTabChange(event: any): void {
    const tabs: Array<'ferme' | 'mixte' | 'ouvert'> = ['ferme', 'mixte', 'ouvert'];
    this.selectedTab = tabs[event.index];
    this.selectedTabIndex = event.index;
  }

  areAllSelected(): boolean {
    const filtered = this.filteredArticles;
    return filtered.length > 0 && filtered.every(article => article.checked);
  }

  isIndeterminate(): boolean {
    const filtered = this.filteredArticles;
    const checkedCount = filtered.filter(article => article.checked).length;
    return checkedCount > 0 && checkedCount < filtered.length;
  }

  getSelectedCount(): number {
    return this.filteredArticles.filter(article => article.checked).length;
  }

  getTotalSelectedCount(): number {
    return this.articles.filter(article => article.checked).length;
  }

  // Nombre d'articles sélectionnés par onglet
  getSelectedCountByTab(tab: 'ferme' | 'mixte' | 'ouvert'): number {
    return this.articles.filter(article => article.type === tab && article.checked).length;
  }

  masterToggle(): void {
    const filtered = this.filteredArticles;
    const allSelected = this.areAllSelected();
    
    filtered.forEach(article => {
      article.checked = !allSelected;
    });
  }
}
