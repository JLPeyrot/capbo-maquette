import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { CreateOppositeDialogComponent, CreateOppositeDialogData } from '../../shared/create-opposite-dialog/create-opposite-dialog.component';
import { Router } from '@angular/router';

interface Supplier {
  id: number;
  name: string;
  code: string;
}

interface Warehouse {
  id: number;
  name: string;
  code: string;
}

interface ValidationStatus {
  logistics: boolean;
  pricing: boolean;
  marketing: boolean;
}

@Component({
  selector: 'app-enrichment-assortment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDividerModule,
    MatStepperModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatDialogModule
  ],
  templateUrl: './enrichment-assortment.component.html',
  styleUrls: ['./enrichment-assortment.component.scss']
})
export class EnrichmentAssortmentComponent {
  enrichmentForm: FormGroup;
  
  // Propriétés pour suivre les valeurs précédentes
  previousAssortmentType: string = '';
  previousAssortmentSubType: string = '';
  
  // Options pour les sélecteurs
  assortmentTypes = [
    { value: 'commandable', label: 'Commandable' },
    { value: 'vendable', label: 'Vendable' }
  ];

  assortmentSubTypes = [
    { value: 'permanent', label: 'Permanent' },
    { value: 'promotional', label: 'Promotionnel' },
    { value: 'catalog', label: 'Catalogue' }
  ];

  priceTypes = [
    { value: 'closed', label: 'Fermé (imposé)' },
    { value: 'bordered', label: 'Bordé (bornes min/max)' },
    { value: 'open', label: 'Ouvert (libre dans le cadre enseigne)' }
  ];

  reassortModes = [
    { value: 'manual', label: 'Manuel' },
    { value: 'automatic', label: 'Automatique' }
  ];

  salesChannels = [
    { value: 'store', label: 'Magasin' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'clickcollect', label: 'Click & Collect' }
  ];

  // Données de référence
  suppliers: Supplier[] = [
    { id: 1, name: 'Fournisseur A', code: 'FOURA' },
    { id: 2, name: 'Fournisseur B', code: 'FOURB' },
    { id: 3, name: 'Fournisseur C', code: 'FOURC' }
  ];

  warehouses: Warehouse[] = [
    { id: 1, name: 'Entrepôt Central', code: 'EC001' },
    { id: 2, name: 'Entrepôt Nord', code: 'EN002' },
    { id: 3, name: 'Entrepôt Sud', code: 'ES003' }
  ];

  families = [
    { value: 'textile', label: 'Textile' },
    { value: 'electronique', label: 'Électronique' },
    { value: 'alimentaire', label: 'Alimentaire' }
  ];

  universes = [
    { value: 'mode', label: 'Mode' },
    { value: 'tech', label: 'Tech' },
    { value: 'maison', label: 'Maison' }
  ];

  seasonalities = [
    { value: 'permanent', label: 'Permanent' },
    { value: 'spring', label: 'Printemps' },
    { value: 'summer', label: 'Été' },
    { value: 'autumn', label: 'Automne' },
    { value: 'winter', label: 'Hiver' }
  ];

  validationStatus: ValidationStatus = {
    logistics: false,
    pricing: false,
    marketing: false
  };

  constructor(private fb: FormBuilder, private dialog: MatDialog, private router: Router) {
    this.enrichmentForm = this.createForm();
    this.setupFormValidation();
    
    // Initialiser les valeurs précédentes
    this.previousAssortmentType = this.enrichmentForm.get('assortmentType')?.value || '';
    this.previousAssortmentSubType = this.enrichmentForm.get('assortmentSubType')?.value || '';
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Typologie
      assortmentType: ['', Validators.required],
      assortmentSubType: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: [''],
      status: ['draft'],
      responsible: ['Approvisionneur connecté'],

      // Logistique
      mainSupplier: ['', Validators.required],
      alternativeSuppliers: [[]],
      warehouse: ['', Validators.required],
      moq: ['', [Validators.required, Validators.min(1)]],
      pcb: ['', [Validators.required, Validators.min(1)]],
      deliveryDelay: ['', [Validators.required, Validators.min(1)]],
      minStock: ['', [Validators.required, Validators.min(0)]],
      maxStock: ['', [Validators.required, Validators.min(0)]],
      reassortMode: ['manual', Validators.required],

      // Tarification
      purchasePrice: ['', [Validators.required, Validators.min(0)]],
      salePrice: [''],
      priceType: ['closed', Validators.required],
      minPrice: [''],
      maxPrice: [''],
      margin: [{ value: 0, disabled: true }],

      // Marketing
      commercialLabel: ['', Validators.required],
      shortDescription: ['', [Validators.required, Validators.maxLength(100)]],
      longDescription: ['', Validators.maxLength(500)],
      mainImage: [''],
      salesChannels: [[]],
      family: ['', Validators.required],
      subFamily: [''],
      universe: ['', Validators.required],
      seasonality: ['permanent', Validators.required]
    });
  }

  private setupFormValidation(): void {
    // Surveillance des changements pour la validation automatique
    this.enrichmentForm.valueChanges.subscribe(() => {
      this.updateValidationStatus();
      this.calculateMargin();
    });
  }

  private updateValidationStatus(): void {
    const form = this.enrichmentForm;
    
    // Validation logistique (seulement si le bloc est visible)
    if (this.shouldShowLogistics()) {
      this.validationStatus.logistics = !!(
        form.get('mainSupplier')?.value &&
        form.get('warehouse')?.value &&
        form.get('moq')?.value &&
        form.get('pcb')?.value &&
        form.get('deliveryDelay')?.value &&
        form.get('minStock')?.value !== '' &&
        form.get('maxStock')?.value !== ''
      );
    } else {
      this.validationStatus.logistics = false; // Non applicable, ne compte pas dans le pourcentage
    }

    // Validation tarification/vente (seulement si le bloc est visible)
    if (this.shouldShowSales()) {
      const priceType = form.get('priceType')?.value;
      let pricingValid = !!(form.get('purchasePrice')?.value && form.get('salePrice')?.value);
      
      // Si le type de prix est "bordé", vérifier aussi les prix min/max
      if (priceType === 'bordered') {
        pricingValid = pricingValid && !!(
          form.get('minPrice')?.value &&
          form.get('maxPrice')?.value
        );
      }
      
      this.validationStatus.pricing = pricingValid;
    } else {
      this.validationStatus.pricing = false; // Non applicable, ne compte pas dans le pourcentage
    }

    // Validation marketing (toujours visible)
    this.validationStatus.marketing = !!(
      form.get('commercialLabel')?.value &&
      form.get('shortDescription')?.value &&
      form.get('family')?.value &&
      form.get('universe')?.value &&
      form.get('salesChannels')?.value?.length > 0
    );
  }

  private calculateMargin(): void {
    const purchasePrice = this.enrichmentForm.get('purchasePrice')?.value;
    const salePrice = this.enrichmentForm.get('salePrice')?.value;
    
    if (purchasePrice && salePrice && purchasePrice > 0) {
      const margin = ((salePrice - purchasePrice) / salePrice) * 100;
      this.enrichmentForm.get('margin')?.setValue(Math.round(margin * 100) / 100);
    } else {
      this.enrichmentForm.get('margin')?.setValue(0);
    }
  }

  onAssortmentTypeChange(): void {
    const newType = this.enrichmentForm.get('assortmentType')?.value;
    const currentType = this.previousAssortmentType;
    
    // Vérifier s'il y a des données qui vont être perdues
    if (this.hasDataThatWillBeLost(currentType, newType)) {
      this.showTypologyChangeConfirmation(newType, currentType);
    } else {
      this.applyAssortmentTypeChange(newType);
    }
  }

  onAssortmentSubTypeChange(): void {
    const newSubType = this.enrichmentForm.get('assortmentSubType')?.value;
    const currentSubType = this.previousAssortmentSubType;
    
    // Vérifier si le changement de sous-type va masquer des dates remplies
    if (newSubType === 'permanent' && this.hasDatesData()) {
      this.showSubTypeChangeConfirmation(newSubType, currentSubType);
    } else {
      this.applyAssortmentSubTypeChange(newSubType);
    }
  }

  private hasDataThatWillBeLost(currentType: string, newType: string): boolean {
    if (currentType === 'vendable' && newType === 'commandable') {
      // Vérifier si des données de vente sont remplies
      return this.hasSalesData();
    } else if (currentType === 'commandable' && newType === 'vendable') {
      // Vérifier si des données logistiques sont remplies
      return this.hasLogisticsData();
    }
    return false;
  }

  private hasSalesData(): boolean {
    const form = this.enrichmentForm;
    return !!(
      form.get('purchasePrice')?.value ||
      form.get('salePrice')?.value ||
      form.get('priceType')?.value ||
      form.get('minPrice')?.value ||
      form.get('maxPrice')?.value
    );
  }

  private hasLogisticsData(): boolean {
    const form = this.enrichmentForm;
    return !!(
      form.get('mainSupplier')?.value ||
      form.get('warehouse')?.value ||
      form.get('moq')?.value ||
      form.get('pcb')?.value ||
      form.get('deliveryDelay')?.value ||
      form.get('minStock')?.value ||
      form.get('maxStock')?.value ||
      form.get('reassortMode')?.value ||
      form.get('alternativeSuppliers')?.value?.length
    );
  }

  private hasDatesData(): boolean {
    const form = this.enrichmentForm;
    return !!(
      form.get('startDate')?.value ||
      form.get('endDate')?.value
    );
  }

  private showTypologyChangeConfirmation(newType: string, currentType: string): void {
    const dialogData: ConfirmationDialogData = {
      title: 'Changement de typologie',
      message: 'Changer la typologie va supprimer certaines données non compatibles. Continuer ?',
      confirmText: 'Confirmer',
      cancelText: 'Annuler'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '450px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.applyAssortmentTypeChange(newType);
        this.clearIncompatibleData(currentType, newType);
      } else {
        // Restaurer l'ancienne valeur
        this.enrichmentForm.get('assortmentType')?.setValue(currentType, { emitEvent: false });
      }
    });
  }

  private showSubTypeChangeConfirmation(newSubType: string, currentSubType: string): void {
    const dialogData: ConfirmationDialogData = {
      title: 'Changement de sous-type',
      message: 'Changer vers "Permanent" va supprimer les dates saisies. Continuer ?',
      confirmText: 'Confirmer',
      cancelText: 'Annuler'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '450px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.applyAssortmentSubTypeChange(newSubType);
        if (newSubType === 'permanent') {
          this.clearDatesData();
        }
      } else {
        // Restaurer l'ancienne valeur
        this.enrichmentForm.get('assortmentSubType')?.setValue(currentSubType, { emitEvent: false });
      }
    });
  }

  private applyAssortmentTypeChange(type: string): void {
    this.previousAssortmentType = type;
    const salePriceControl = this.enrichmentForm.get('salePrice');
    
    if (type === 'vendable') {
      salePriceControl?.setValidators([Validators.required, Validators.min(0)]);
    } else {
      salePriceControl?.clearValidators();
      salePriceControl?.setValue('');
    }
    salePriceControl?.updateValueAndValidity();
    this.updateValidationStatus();
  }

  private applyAssortmentSubTypeChange(subType: string): void {
    this.previousAssortmentSubType = subType;
    this.updateValidationStatus();
  }

  private clearIncompatibleData(currentType: string, newType: string): void {
    if (currentType === 'vendable' && newType === 'commandable') {
      // Effacer les données de vente
      this.enrichmentForm.patchValue({
        purchasePrice: '',
        salePrice: '',
        priceType: 'closed',
        minPrice: '',
        maxPrice: ''
      });
    } else if (currentType === 'commandable' && newType === 'vendable') {
      // Effacer les données logistiques
      this.enrichmentForm.patchValue({
        mainSupplier: '',
        warehouse: '',
        moq: '',
        pcb: '',
        deliveryDelay: '',
        minStock: '',
        maxStock: '',
        reassortMode: 'manual',
        alternativeSuppliers: []
      });
    }
  }

  private clearDatesData(): void {
    this.enrichmentForm.patchValue({
      startDate: '',
      endDate: ''
    });
  }

  onPriceTypeChange(): void {
    const priceType = this.enrichmentForm.get('priceType')?.value;
    const minPriceControl = this.enrichmentForm.get('minPrice');
    const maxPriceControl = this.enrichmentForm.get('maxPrice');
    
    if (priceType === 'bordered') {
      minPriceControl?.setValidators([Validators.required, Validators.min(0)]);
      maxPriceControl?.setValidators([Validators.required, Validators.min(0)]);
    } else {
      minPriceControl?.clearValidators();
      maxPriceControl?.clearValidators();
      minPriceControl?.setValue('');
      maxPriceControl?.setValue('');
    }
    minPriceControl?.updateValueAndValidity();
    maxPriceControl?.updateValueAndValidity();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Simulation d'upload - dans un vrai projet, on uploadrait le fichier
      this.enrichmentForm.get('mainImage')?.setValue(file.name);
    }
  }

  goBack(): void {
    console.log('Retour à la page précédente');
    // TODO: Implémenter la navigation de retour
  }

  saveDraft(): void {
    console.log('Sauvegarde du brouillon', this.enrichmentForm.value);
    // TODO: Implémenter la sauvegarde du brouillon
  }

  validateAssortment(): void {
    if (this.enrichmentForm.valid && this.isCompletelyValid()) {
      console.log('Validation de l\'assortiment', this.enrichmentForm.value);
      
      // Après validation réussie, proposer de créer le type opposé
      const currentType = this.enrichmentForm.get('assortmentType')?.value;
      this.showCreateOppositeDialog(currentType);
    } else {
      console.log('Formulaire incomplet ou invalide');
      this.markFormGroupTouched();
    }
  }

  private showCreateOppositeDialog(currentType: string): void {
    const oppositeType = currentType === 'vendable' ? 'commandable' : 'vendable';
    
    const dialogData: CreateOppositeDialogData = {
      currentType: currentType,
      oppositeType: oppositeType
    };

    const dialogRef = this.dialog.open(CreateOppositeDialogComponent, {
      width: '500px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'create') {
        this.createOppositeAssortment(oppositeType);
      } else if (result === 'later') {
        // Rediriger vers le tableau de bord ou la liste des assortiments
        console.log('Création reportée - redirection vers le tableau de bord');
        // this.router.navigate(['/dashboard']);
      }
    });
  }

  private createOppositeAssortment(oppositeType: string): void {
    // Récupérer les données communes du formulaire actuel
    const currentFormData = this.enrichmentForm.value;
    
    // Préparer les données communes pour le nouvel assortiment
    const commonData = {
      assortmentType: oppositeType,
      assortmentSubType: currentFormData.assortmentSubType,
      startDate: currentFormData.startDate,
      endDate: currentFormData.endDate,
      responsible: currentFormData.responsible,
      commercialLabel: currentFormData.commercialLabel,
      shortDescription: currentFormData.shortDescription,
      longDescription: currentFormData.longDescription,
      family: currentFormData.family,
      subFamily: currentFormData.subFamily,
      universe: currentFormData.universe,
      seasonality: currentFormData.seasonality,
      salesChannels: currentFormData.salesChannels
    };
    
    // Réinitialiser le formulaire avec les données communes et le type opposé
    this.enrichmentForm.reset();
    this.enrichmentForm.patchValue(commonData);
    
    // Réinitialiser les statuts de validation
    this.validationStatus = {
      logistics: false,
      pricing: false,
      marketing: false
    };
    
    // Mettre à jour les valeurs précédentes
    this.previousAssortmentType = oppositeType;
    this.previousAssortmentSubType = currentFormData.assortmentSubType;
    
    // Mettre à jour la validation
    this.updateValidationStatus();
    
    console.log(`Nouvel assortiment ${oppositeType} créé avec les données communes`);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.enrichmentForm.controls).forEach(key => {
      const control = this.enrichmentForm.get(key);
      control?.markAsTouched();
    });
  }

  isCompletelyValid(): boolean {
    return this.validationStatus.logistics && 
           this.validationStatus.pricing && 
           this.validationStatus.marketing;
  }

  getCompletionPercentage(): number {
    // Calculer le nombre de sections applicables selon le type d'assortiment
    let totalApplicableSections = 1; // Marketing est toujours applicable
    let validApplicableSections = this.validationStatus.marketing ? 1 : 0;
    
    // Ajouter la section logistique si applicable
    if (this.shouldShowLogistics()) {
      totalApplicableSections++;
      if (this.validationStatus.logistics) {
        validApplicableSections++;
      }
    }
    
    // Ajouter la section tarification si applicable
    if (this.shouldShowSales()) {
      totalApplicableSections++;
      if (this.validationStatus.pricing) {
        validApplicableSections++;
      }
    }
    
    return Math.round((validApplicableSections / totalApplicableSections) * 100);
  }

  getValidationIcon(isValid: boolean): string {
    return isValid ? 'check_circle' : 'radio_button_unchecked';
  }

  getValidationColor(isValid: boolean): string {
    return isValid ? 'primary' : 'warn';
  }

  // Nouvelles méthodes pour les règles fonctionnelles
  shouldShowDates(): boolean {
    const subType = this.enrichmentForm.get('assortmentSubType')?.value;
    return subType !== 'permanent';
  }

  shouldShowLogistics(): boolean {
    const type = this.enrichmentForm.get('assortmentType')?.value;
    return type === 'commandable';
  }

  shouldShowSales(): boolean {
    const type = this.enrichmentForm.get('assortmentType')?.value;
    return type === 'vendable';
  }
}