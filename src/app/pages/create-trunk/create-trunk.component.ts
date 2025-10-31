import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MaterialModule } from '../../shared/material-module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MasterdataService } from '../../services/masterdata.service';
import { SiteGroupsService, GroupOption } from '../../services/site-groups.service';
import { Group, Attribute, Store, TrunkType, StoreSelection } from '../../shared/interfaces/masterdata.interfaces';

interface AttributeSelect {
  id: string;
  selectedValue: string | null;
}

@Component({
  selector: 'app-create-trunk',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MaterialModule],
  templateUrl: './create-trunk.component.html',
  styleUrls: ['./create-trunk.component.scss']
})
export class CreateTrunkComponent implements OnInit {
  
  trunkForm: FormGroup;
  
  // Valeurs sélectionnées pour les dropdowns
  selectedGroupValue: string = '';
  selectedAttributeValue: string = '';
  selectedTrunkType: string = '';
  
  // Données chargées depuis le service
  trunkTypes: TrunkType[] = [];
  availableGroups: GroupOption[] = []; // Changé de Group[] à GroupOption[]
  availableAttributes: Attribute[] = [];
  availableStores: StoreSelection[] = [];
  
  // Sélections
  selectedGroups: GroupOption[] = []; // Changé de Group[] à GroupOption[]
  selectedGroupToAdd: GroupOption | null = null; // Changé de Group à GroupOption
  selectedAttributes: Attribute[] = [];
  selectedAttributeToAdd: Attribute | null = null;
  attributeSelects: AttributeSelect[] = [{ id: 'attr-1', selectedValue: null }];

  // Magasins disponibles et ciblés
  allStores: StoreSelection[] = [];
  targetStores: StoreSelection[] = [];

  // Mapping des groupes/attributs vers les magasins (sera remplacé par la logique du service)
  storeMapping: { [key: string]: string[] } = {
    'group-1': ['store-1', 'store-3', 'store-5'], // Électronique
    'group-2': ['store-2', 'store-3', 'store-4'], // Mobilier
    'group-3': ['store-1', 'store-2', 'store-4'], // Véhicules
    'group-4': ['store-4', 'store-1'], // Outillage
    'group-5': ['store-3', 'store-5'], // Informatique
    'attr-1': ['store-1', 'store-3'], // Marque
    'attr-2': ['store-1', 'store-3'], // Modèle
    'attr-3': ['store-1', 'store-2', 'store-3'], // Couleur
    'attr-4': ['store-2', 'store-4'], // Dimensions
    'attr-5': ['store-1', 'store-2', 'store-3', 'store-4'], // Poids
    'attr-6': ['store-1', 'store-2', 'store-3', 'store-4', 'store-5'], // Année
    'attr-7': ['store-1', 'store-2', 'store-3', 'store-4', 'store-5'], // État
    'attr-8': ['store-1', 'store-3', 'store-5'] // Numéro de série
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private masterdataService: MasterdataService,
    private siteGroupsService: SiteGroupsService
  ) {
    this.trunkForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      type: ['', Validators.required],
      level: ['', Validators.required],
      selectedTrunkType: [''],
      selectedGroupValue: ['']
    });
  }

  ngOnInit(): void {
    this.loadMasterData();
  }

  private loadMasterData(): void {
    // Charger les types de tronc
    this.masterdataService.getTrunkTypes().subscribe(types => {
      this.trunkTypes = types;
    });

    // Charger les groupes de sites
    this.siteGroupsService.getGroupOptions().subscribe(groups => {
      this.availableGroups = groups;
    });

    // Charger les attributs
    this.masterdataService.getAttributes().subscribe(attributes => {
      this.availableAttributes = attributes;
    });

    // Charger les magasins
    this.masterdataService.getStores().subscribe(stores => {
      this.availableStores = stores.map(store => ({ ...store, selected: false }));
      this.allStores = stores.map(store => ({ ...store, selected: false }));
    });
  }

  // Méthodes pour gérer les groupes
  addGroup(): void {
    const selectedGroupValue = this.trunkForm.get('selectedGroupValue')?.value;
    if (selectedGroupValue) {
      const group = this.availableGroups.find(g => g.id === selectedGroupValue);
      if (group && !this.selectedGroups.find(g => g.id === group.id)) {
        this.selectedGroups.push(group);
        this.trunkForm.get('selectedGroupValue')?.setValue('');
        this.updateTargetStores();
      }
    }
  }

  removeGroup(index: number): void {
    this.selectedGroups.splice(index, 1);
    this.updateTargetStores();
  }

  get availableGroupsFiltered(): GroupOption[] {
    return this.availableGroups.filter(group => 
      !this.selectedGroups.find(selected => selected.id === group.id)
    );
  }

  // Méthodes pour gérer les attributs
  addAttribute(): void {
    const selectedAttributeValue = this.trunkForm.get('selectedAttributeValue')?.value;
    if (selectedAttributeValue) {
      const attribute = this.availableAttributes.find(a => a.id === selectedAttributeValue);
      if (attribute && !this.selectedAttributes.find(a => a.id === attribute.id)) {
        this.selectedAttributes.push(attribute);
        this.trunkForm.get('selectedAttributeValue')?.setValue('');
        this.updateTargetStores();
      }
    }
  }

  removeAttribute(index: number): void {
    this.selectedAttributes.splice(index, 1);
    this.updateTargetStores();
  }

  get availableAttributesFiltered(): Attribute[] {
    return this.availableAttributes.filter(attribute => 
      !this.selectedAttributes.find(selected => selected.id === attribute.id)
    );
  }

  // Mise à jour dynamique de la liste des magasins
  updateTargetStores(): void {
    const storesFromGroups = this.selectedGroups.flatMap(group => this.storeMapping[group.id] || []);
    const storesFromAttributes = this.selectedAttributes.flatMap(attr => this.storeMapping[attr.id] || []);
    
    // Union des magasins des groupes et attributs sélectionnés
    const allTargetStoreIds = [...new Set([...storesFromGroups, ...storesFromAttributes])];
    
    // Filtrer les magasins ciblés depuis allStores
    this.targetStores = this.allStores.filter(store => allTargetStoreIds.includes(store.id));
    
    // Réinitialiser la sélection
    this.targetStores.forEach(store => store.selected = false);
  }

  // Gestion des magasins correspondants
  getMatchingStores(): StoreSelection[] {
    const storesFromGroups = this.selectedGroups.flatMap(group => this.storeMapping[group.id] || []);
    const storesFromAttributes = this.selectedAttributes.flatMap(attr => this.storeMapping[attr.id] || []);
    
    // Union des magasins des groupes et attributs sélectionnés
    const allTargetStoreIds = [...new Set([...storesFromGroups, ...storesFromAttributes])];
    
    // Filtrer les magasins correspondants depuis allStores
    return this.allStores.filter(store => allTargetStoreIds.includes(store.id));
  }

  getMatchingStoresCount(): number {
    return this.getMatchingStores().length;
  }

  // Gestion des magasins (méthodes conservées pour compatibilité)
  toggleStore(store: StoreSelection): void {
    store.selected = !store.selected;
  }

  getSelectedStoresCount(): number {
    return this.targetStores.filter(store => store.selected).length;
  }

  getSelectedStores(): StoreSelection[] {
    return this.getMatchingStores(); // Retourne maintenant tous les magasins correspondants
  }

  // Actions du formulaire
  onSubmit(): void {
    if (this.trunkForm.valid && this.selectedGroups.length > 0) {
      const trunkData = {
        ...this.trunkForm.value,
        groups: this.selectedGroups,
        attributes: this.selectedAttributes,
        targetStores: this.getSelectedStores(),
        createdDate: new Date(),
        status: 'brouillon'
      };

      console.log('Données du tronc à créer:', trunkData);
      
      // Simulation de la sauvegarde
      this.snackBar.open('Tronc créé avec succès !', 'Fermer', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });

      // Redirection vers la liste des troncs
      this.router.navigate(['/assortment-trunk']);
    } else {
      this.snackBar.open('Veuillez remplir tous les champs obligatoires', 'Fermer', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  // Nouvelles méthodes pour la gestion dynamique des attributs
  addAttributeSelect(): void {
    const newId = `attr-${this.attributeSelects.length + 1}`;
    this.attributeSelects.push({ id: newId, selectedValue: null });
  }

  removeAttributeSelect(index: number): void {
    if (this.attributeSelects.length > 1) {
      const removedSelect = this.attributeSelects[index];
      
      // Supprimer l'attribut sélectionné correspondant s'il existe
      if (removedSelect.selectedValue) {
        const attributeIndex = this.selectedAttributes.findIndex(
          attr => attr.id === removedSelect.selectedValue
        );
        if (attributeIndex > -1) {
          this.selectedAttributes.splice(attributeIndex, 1);
        }
      }
      
      this.attributeSelects.splice(index, 1);
    }
  }

  onAttributeSelectionChange(selectIndex: number, attributeId: string): void {
    const attributeSelect = this.attributeSelects[selectIndex];
    const oldValue = attributeSelect.selectedValue;
    
    // Supprimer l'ancien attribut sélectionné s'il existe
    if (oldValue) {
      const oldAttributeIndex = this.selectedAttributes.findIndex(attr => attr.id === oldValue);
      if (oldAttributeIndex > -1) {
        this.selectedAttributes.splice(oldAttributeIndex, 1);
      }
    }
    
    // Ajouter le nouvel attribut sélectionné
    if (attributeId) {
      const attribute = this.availableAttributes.find(attr => attr.id === attributeId);
      if (attribute && !this.selectedAttributes.find(attr => attr.id === attributeId)) {
        this.selectedAttributes.push(attribute);
      }
    }
    
    // Mettre à jour la valeur sélectionnée
    attributeSelect.selectedValue = attributeId;
  }

  getAvailableAttributesForSelect(selectIndex: number): Attribute[] {
    const currentSelect = this.attributeSelects[selectIndex];
    const currentValue = currentSelect.selectedValue;
    
    // Retourner tous les attributs qui ne sont pas déjà sélectionnés dans d'autres selects
    // ou qui sont la valeur actuelle de ce select
    return this.availableAttributes.filter(attr => {
      const isSelectedInOtherSelect = this.attributeSelects.some((select, index) => 
        index !== selectIndex && select.selectedValue === attr.id
      );
      return !isSelectedInOtherSelect || attr.id === currentValue;
    });
  }

  removeSelectedAttribute(index: number): void {
    const removedAttribute = this.selectedAttributes[index];
    
    // Trouver le select correspondant et réinitialiser sa valeur
    const selectIndex = this.attributeSelects.findIndex(
      select => select.selectedValue === removedAttribute.id
    );
    if (selectIndex > -1) {
      this.attributeSelects[selectIndex].selectedValue = null;
    }
    
    // Supprimer l'attribut de la liste
    this.selectedAttributes.splice(index, 1);
  }

  goBack(): void {
    this.router.navigate(['/assortment-trunk']);
  }

  // Validation du formulaire
  isFormValid(): boolean {
    return this.trunkForm.valid && 
           this.selectedGroups.length > 0;
  }
}