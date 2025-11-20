import { Component, OnInit, TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../shared/material-module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SiteGroupsService, GroupOption } from '../../services/site-groups.service';
import { Group, Attribute, Store, StoreSelection } from '../../shared/interfaces/masterdata.interfaces';
import { HttpClient } from '@angular/common/http';
import { TrunksService } from '../../services/trunks.service';

interface AttributeSelect {
  id: string;
  selectedValue: string | null;
}

interface GroupSelect {
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
export class CreateTrunkComponent implements OnInit, AfterViewInit {
  
  trunkForm: FormGroup;
  
  // Valeurs sélectionnées pour les dropdowns
  selectedGroupValue: string = '';
  selectedAttributeValue: string = '';
  
  // Données chargées depuis le service
  availableGroups: GroupOption[] = []; // Changé de Group[] à GroupOption[]
  availableAttributes: Attribute[] = [];
  availableStores: StoreSelection[] = [];
  
  // Sélections
  selectedGroups: GroupOption[] = []; // Changé de Group[] à GroupOption[]
  selectedAttributes: Attribute[] = [];
  attributeSelects: AttributeSelect[] = [];
  groupsSelects: GroupSelect[] = [];

  // Magasins disponibles et ciblés
  allStores: StoreSelection[] = [];
  targetStores: StoreSelection[] = [];

  // Données magasins JSON pour matching par groupes/attributs
  private magasins: { code_magasin: string; nom_magasin: string; taille: number; ville: string; groupes: string[]; attributs: string[] }[] = [];

  // Mapping des groupes/attributs vers les magasins (sera remplacé par la logique du service)
  // Ancienne table de mapping supprimée au profit du matching JSON

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private siteGroupsService: SiteGroupsService,
    private http: HttpClient,
    private trunksService: TrunksService,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {
    this.trunkForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      trunkKind: ['TAN'],
      enseigne: [''],
      selectedGroupValue: ['']
    });
  }

  isEditMode: boolean = false;

  ngOnInit(): void {
    // Récupération des paramètres pour pré-remplir (nom, groupes, attributs)
    this.route.queryParamMap.subscribe(params => {
      const name = params.get('name');
      const enseigne = params.get('enseigne');
      const groups = params.getAll('groups');
      const attributes = params.getAll('attributes');
      const mode = params.get('mode');
      const id = params.get('id');

      if (name) {
        this.trunkForm.get('name')?.setValue(name);
      }
      if (enseigne) {
        this.trunkForm.get('enseigne')?.setValue(enseigne);
        this.shouldOpenEnseigneDialog = false;
      }
      if ((mode && mode.toLowerCase() === 'edit') || !!id) {
        this.isEditMode = true;
        this.shouldOpenEnseigneDialog = false;
      }

      // Stocker temporairement pour application après chargement des données
      if (groups && groups.length > 0) {
        this.prefillGroupsBuffer = groups;
      }
      if (attributes && attributes.length > 0) {
        this.prefillAttributesBuffer = attributes;
      }

      // Essayer d'appliquer immédiatement si données déjà chargées
      this.tryApplyPrefill();

      // En mode édition, si un ID est fourni, pré-remplir depuis les troncs existants
      if (id) {
        this.trunksService.getTrunks().subscribe(items => {
          const t = items.find(x => String(x.id) === String(id));
          if (t) {
            const mappedKind = t.type === 'TAN' ? 'TAN' : 'complementaire';
            this.trunkForm.patchValue({
              name: t.name,
              trunkKind: mappedKind,
              enseigne: t.enseigne || this.trunkForm.value.enseigne || ''
            });
            this.prefillGroupsBuffer = [...(t.groups || [])];
            this.prefillAttributesBuffer = [...(t.attributes || [])];
            this.shouldOpenEnseigneDialog = false;
            this.tryApplyPrefill();
          }
        });
      }
    });

    this.loadMasterData();
  }

  // Popup de sélection d'enseigne
  @ViewChild('enseigneDialog') enseigneDialog!: TemplateRef<any>;
  selectedEnseigneDialog: string = '';
  private enseigneDialogRef?: MatDialogRef<any>;
  private shouldOpenEnseigneDialog: boolean = true;

  @ViewChild('confirmCreateDialog') confirmCreateDialog!: TemplateRef<any>;
  private confirmDialogRef?: MatDialogRef<any>;
  confirmTrunkTypeLabel: string = '';
  confirmStoresCount: number = 0;
  confirmEnseigneLabel: string = '';

  ngAfterViewInit(): void {
    // Ouvrir la popup si aucune enseigne n’est fournie
    if (this.shouldOpenEnseigneDialog) {
      this.selectedEnseigneDialog = '';
      this.enseigneDialogRef = this.dialog.open(this.enseigneDialog, { width: '420px' });
      this.enseigneDialogRef.afterClosed().subscribe(result => {
        if (result && this.selectedEnseigneDialog) {
          this.trunkForm.get('enseigne')?.setValue(this.selectedEnseigneDialog);
          this.updateTargetStores();
        }
      });
    }
  }

  onCancelEnseigne(): void {
    this.enseigneDialogRef?.close(false);
  }

  onValidateEnseigne(): void {
    this.enseigneDialogRef?.close(true);
  }

  openConfirmCreateDialog(): void {
    const kind = String(this.trunkForm.value.trunkKind || 'TAN');
    const kindLabel = this.trunkKindOptions.find(o => o.value === kind)?.label || kind;
    const enseigneValue = String(this.trunkForm.value.enseigne || '');
    const enseigneLabel = this.enseigneOptions.find(e => e.value === enseigneValue)?.label || enseigneValue;
    const storesCount = this.getMatchingStoresCount();

    this.confirmTrunkTypeLabel = kindLabel;
    this.confirmStoresCount = storesCount;
    this.confirmEnseigneLabel = enseigneLabel;

    this.confirmDialogRef = this.dialog.open(this.confirmCreateDialog, { width: '520px' });
    this.confirmDialogRef.afterClosed().subscribe(ok => {
      if (ok) {
        this.onSubmit();
      }
    });
  }

  onCancelConfirm(): void {
    this.confirmDialogRef?.close(false);
  }

  onValidateConfirm(): void {
    this.confirmDialogRef?.close(true);
  }

  // Buffers pour pré-remplissage depuis la page Gestion des Troncs
  private prefillGroupsBuffer: string[] = [];
  private prefillAttributesBuffer: string[] = [];
  private prefillApplied = false;

  private loadMasterData(): void {
    // Charger les groupes de sites
    this.siteGroupsService.getGroupOptions().subscribe(groups => {
      this.availableGroups = groups;
      this.tryApplyPrefill();
    });

    // Charger les attributs depuis /data/attributs-csv.json
    this.http.get<{ attributs_csv: string[] }>(
      '/data/attributs-csv.json'
    ).subscribe(res => {
      const attrs = res?.attributs_csv || [];
      this.availableAttributes = attrs.map(code => ({
        id: code,
        name: code,
        description: '',
        type: 'text',
        required: false,
        groupIds: []
      }));
      this.tryApplyPrefill();
    });

    // Charger les magasins depuis /data/magasins.json
    this.http.get<{ magasins: { code_magasin: string; nom_magasin: string; taille: number; ville: string; groupes: string[]; attributs: string[] }[] }>(
      '/data/magasins.json'
    ).subscribe(res => {
      this.magasins = res?.magasins || [];
      // Mapper vers StoreSelection minimal pour l’affichage (name utilisé dans le template)
      this.allStores = this.magasins.map(m => ({
        id: m.code_magasin,
        name: m.nom_magasin,
        description: `Magasin ${m.ville}`,
        location: m.ville,
        capacity: m.taille,
        type: 'office',
        selected: false
      }));
      this.availableStores = [...this.allStores];
    });
  }

  trunkKindOptions = [
    { value: 'TAN', label: 'National' },
    { value: 'complementaire', label: 'Complémentaire' }
  ];

  enseigneOptions = [
    { value: 'boulanger', label: 'Boulanger' },
    { value: 'electrodepot', label: 'Electrodépot' }
  ];

  getSelectedEnseigneLabel(): string {
    const val = String(this.trunkForm.value.enseigne || '');
    const found = this.enseigneOptions.find(e => e.value === val);
    return found ? found.label : val;
  }

  onTrunkKindChange(kind: string): void {
    if (kind === 'TAN') {
      this.selectedGroups = [];
      this.groupsSelects = [];
      this.selectedAttributes = [];
      this.attributeSelects = [];
    }
  }

  /**
   * Applique le pré-remplissage si possible, une seule fois.
   */
  private tryApplyPrefill(): void {
    if (this.prefillApplied) return;

    const canApplyGroups = this.availableGroups.length > 0 && this.prefillGroupsBuffer.length > 0;
    const canApplyAttrs = this.availableAttributes.length > 0 && this.prefillAttributesBuffer.length > 0;

    if (!canApplyGroups && !canApplyAttrs) {
      return;
    }

    // Pré-remplir les groupes (match par name)
    if (canApplyGroups) {
      this.prefillGroupsBuffer.forEach(groupName => {
        const opt = this.availableGroups.find(g => g.name === groupName);
        if (opt && !this.selectedGroups.find(g => g.id === opt.id)) {
          this.selectedGroups.push(opt);
        }
      });
    }

    // Pré-remplir les attributs (match par id/code)
    if (canApplyAttrs) {
      this.prefillAttributesBuffer.forEach(attrCode => {
        const attr = this.availableAttributes.find(a => a.id === attrCode);
        if (attr && !this.selectedAttributes.find(a => a.id === attr.id)) {
          this.selectedAttributes.push(attr);
        }
      });
      // Ne pas garder de selects ouverts après préremplissage; afficher uniquement les bignettes
      this.attributeSelects = [];
    }

    // Mettre à jour les magasins cibles après sélection
    this.updateTargetStores();
    this.prefillApplied = true;
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
    // Rouvrir un sélecteur si des options restent et qu'aucune ligne n'est ouverte
    const remainingGroups = this.availableGroups.filter(g => !this.selectedGroups.find(sel => sel.id === g.id));
    if (remainingGroups.length > 0 && this.groupsSelects.length === 0) {
      const newId = `grp-${this.groupsSelects.length + 1}`;
      this.groupsSelects.push({ id: newId, selectedValue: null });
    }
  }

  get availableGroupsFiltered(): GroupOption[] {
    return this.availableGroups.filter(group => 
      !this.selectedGroups.find(selected => selected.id === group.id)
    );
  }

  // Gestion dynamique des selects de groupes
  addGroupSelect(): void {
    const newId = `grp-${this.groupsSelects.length + 1}`;
    this.groupsSelects.push({ id: newId, selectedValue: null });
  }

  onGroupSelectionChange(selectIndex: number, groupId: string): void {
    const group = this.availableGroups.find(g => g.id === groupId);
    if (group && !this.selectedGroups.find(g => g.id === group.id)) {
      this.selectedGroups.push(group);
    }
    // Retirer la ligne de sélection une fois choisi
    this.groupsSelects.splice(selectIndex, 1);
    this.updateTargetStores();
  }

  getAvailableGroupsForSelect(): GroupOption[] {
    return this.availableGroups.filter(g => !this.selectedGroups.find(sel => sel.id === g.id));
  }

  // Méthodes pour gérer les attributs (gérées via selects dynamiques)

  // Mise à jour dynamique de la liste des magasins (basée sur magasins.json)
  updateTargetStores(): void {
    const selectedGroupValues = this.selectedGroups.map(g => g.name);
    const selectedAttributeCodes = this.selectedAttributes.map(a => a.id);
    const enseigne = String(this.trunkForm.value.enseigne || '').toLowerCase();

    const matches = this.magasins.filter(m => {
      const groupsOk = selectedGroupValues.length === 0 || selectedGroupValues.every(val => m.groupes.includes(val));
      const attrsOk = selectedAttributeCodes.length === 0 || selectedAttributeCodes.every(code => m.attributs.includes(code));
      const brand = (m.nom_magasin || '').toLowerCase().startsWith('electrodepot')
        ? 'electrodepot'
        : (m.nom_magasin || '').toLowerCase().startsWith('boulanger')
          ? 'boulanger'
          : '';
      const enseigneOk = !enseigne || brand === enseigne;
      return groupsOk && attrsOk && enseigneOk;
    });

    this.targetStores = matches.map(m => ({
      id: m.code_magasin,
      name: m.nom_magasin,
      description: `Magasin ${m.ville}`,
      location: m.ville,
      capacity: m.taille,
      type: 'office',
      selected: false
    }));
  }

  // Gestion des magasins correspondants (calcul dynamique)
  getMatchingStores(): StoreSelection[] {
    const selectedGroupValues = this.selectedGroups.map(g => g.name);
    const selectedAttributeCodes = this.selectedAttributes.map(a => a.id);
    const enseigne = String(this.trunkForm.value.enseigne || '').toLowerCase();

    const matches = this.magasins.filter(m => {
      const groupsOk = selectedGroupValues.length === 0 || selectedGroupValues.every(val => m.groupes.includes(val));
      const attrsOk = selectedAttributeCodes.length === 0 || selectedAttributeCodes.every(code => m.attributs.includes(code));
      const brand = (m.nom_magasin || '').toLowerCase().startsWith('electrodepot')
        ? 'electrodepot'
        : (m.nom_magasin || '').toLowerCase().startsWith('boulanger')
          ? 'boulanger'
          : '';
      const enseigneOk = !enseigne || brand === enseigne;
      return groupsOk && attrsOk && enseigneOk;
    });

    return matches.map(m => ({
      id: m.code_magasin,
      name: m.nom_magasin,
      description: `Magasin ${m.ville}`,
      location: m.ville,
      capacity: m.taille,
      type: 'office',
      selected: false
    }));
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
    const kind = this.trunkForm.value.trunkKind;
    const okGroupsOrAttrs = kind === 'TAN' || this.selectedGroups.length > 0 || this.selectedAttributes.length > 0;
    if (this.trunkForm.valid && okGroupsOrAttrs) {
      const payload = {
        name: String(this.trunkForm.value.name).trim(),
        groups: this.selectedGroups.map(g => g.name),
        attributes: this.selectedAttributes.map(a => a.id),
        status: 'brouillon',
        type: this.trunkForm.value.trunkKind || 'TAN',
        enseigne: this.trunkForm.value.enseigne || ''
      };

      // Déterminer si on est en édition à partir des query params
      const qp = this.route.snapshot.queryParamMap;
      const mode = qp.get('mode');
      const id = qp.get('id');
      const isEdit = (mode && mode.toLowerCase() === 'edit') || !!id;

      if (isEdit) {
        const putWithId = (tid: string) => {
          console.log('Mise à jour du tronc via API:', tid, payload);
          this.http.put<{ updated: number }>(`/api/trunks/${tid}`, payload).subscribe({
            next: () => {
              this.trunksService.refreshTrunks();
              this.snackBar.open('Tronc mis à jour avec succès !', 'Fermer', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.router.navigate(['/trunk-management']);
            },
            error: (error) => {
              console.error('Erreur mise à jour tronc:', error);
              this.snackBar.open('Erreur lors de la mise à jour du tronc', 'Fermer', {
                duration: 3000,
                panelClass: ['error-snackbar']
              });
            }
          });
        };

        if (id) {
          putWithId(id);
        } else {
          // Rechercher l'id du tronc par nom si absent
          const currentName = String(this.trunkForm.value.name).trim().toLowerCase();
          this.trunksService.getTrunks().subscribe(items => {
            const match = items.find(t => t.name.toLowerCase() === currentName);
            if (match) {
              putWithId(String(match.id));
            } else {
              // Si introuvable, basculer en création pour éviter blocage
              console.warn('Tronc en édition introuvable, bascule en création.');
              this.http.post<{ created: number }>('/api/trunks', payload).subscribe({
                next: () => {
                  this.trunksService.refreshTrunks();
                  this.snackBar.open('Tronc créé et sauvegardé !', 'Fermer', {
                    duration: 3000,
                    panelClass: ['success-snackbar']
                  });
                  this.router.navigate(['/trunk-management']);
                },
                error: (error) => {
                  console.error('Erreur création tronc:', error);
                  this.snackBar.open('Erreur lors de la sauvegarde du tronc', 'Fermer', {
                    duration: 3000,
                    panelClass: ['error-snackbar']
                  });
                }
              });
            }
          });
        }
      } else {
        console.log('Création du tronc via API:', payload);
        this.http.post<{ created: number }>('/api/trunks', payload).subscribe({
          next: () => {
            // Rafraîchir la liste des troncs côté service
            this.trunksService.refreshTrunks();
            this.snackBar.open('Tronc créé et sauvegardé !', 'Fermer', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.router.navigate(['/trunk-management']);
          },
          error: (error) => {
            console.error('Erreur création tronc:', error);
            this.snackBar.open('Erreur lors de la sauvegarde du tronc', 'Fermer', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    } else {
      const msg = kind === 'complementaire'
        ? 'Pour un tronc complémentaire, sélectionnez au moins 1 groupe ou 1 attribut.'
        : 'Veuillez remplir tous les champs obligatoires';
      this.snackBar.open(msg, 'Fermer', {
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
    if (attributeId) {
      const attribute = this.availableAttributes.find(attr => attr.id === attributeId);
      if (attribute && !this.selectedAttributes.find(attr => attr.id === attributeId)) {
        this.selectedAttributes.push(attribute);
      }
    }
    // Retirer la ligne de sélection une fois choisi
    this.attributeSelects.splice(selectIndex, 1);
    this.updateTargetStores();
  }

  getAvailableAttributesForSelect(selectIndex: number): Attribute[] {
    // Retourner les attributs non encore sélectionnés
    return this.availableAttributes.filter(attr => !this.selectedAttributes.find(sel => sel.id === attr.id));
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
    this.updateTargetStores();
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  // Validation du formulaire
  isFormValid(): boolean {
    const kind = this.trunkForm.value.trunkKind;
    if (kind === 'TAN') {
      return this.trunkForm.valid;
    }
    return this.trunkForm.valid && (this.selectedGroups.length > 0 || this.selectedAttributes.length > 0);
  }
}
