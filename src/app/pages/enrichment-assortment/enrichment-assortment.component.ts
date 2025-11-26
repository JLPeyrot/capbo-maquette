import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { CreateOppositeDialogComponent, CreateOppositeDialogData } from '../../shared/create-opposite-dialog/create-opposite-dialog.component';
import { Router } from '@angular/router';

interface Supplier {
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
    MatDialogModule,
    MatSnackBarModule,
    DragDropModule
  ],
  templateUrl: './enrichment-assortment.component.html',
  styleUrls: ['./enrichment-assortment.component.scss']
})
export class EnrichmentAssortmentComponent {
  enrichmentForm: FormGroup;
  logisticsAutofilled: boolean = false;
  private isAutoFillingLogistics: boolean = false;
  selectedArticleName: string = '';
  selectedArticlePurchasePrice: number | null = null;
  isConsultation: boolean = true;
  
  // Propriétés pour suivre les valeurs précédentes
  previousAssortmentType: string = '';
  previousAssortmentSubType: string = '';
  
  // Options pour les sélecteurs
  assortmentTypes = [
    { value: 'commandable', label: 'Commandable' },
    { value: 'vendable', label: 'Vendable' },
    { value: 'dynamic', label: 'Dynamique (Mercurial)' }
  ];

  assortmentSubTypes = [
    { value: 'permanent', label: 'Permanent' },
    { value: 'promotional', label: 'Promotionnel' },
    { value: 'catalog', label: 'Catalogue' }
  ];

  deploymentPerimeterOptions = [
    { value: 'ferme', label: 'Fermé' },
    { value: 'mixte', label: 'Mixte' },
    { value: 'ouvert', label: 'Ouvert' }
  ];

  salePricingPolicies = [
    { value: 'fixed_margin', label: 'Marge fixe' },
    { value: 'fixed_margin_bounded', label: 'Marge fixe avec bornes de prix' },
    { value: 'imposed_price', label: 'Prix de vente imposé' }
  ];

  reassortModes = [
    { value: 'manual', label: 'Manuel' },
    { value: 'automatic', label: 'Automatique' }
  ];

  priorityCriteria = [
    { value: 'lowestPrice', label: "Prix d'achat le plus bas" },
    { value: 'fastestDelivery', label: 'Délai le plus court' },
    { value: 'bestAvailability', label: 'Disponibilité' },
    { value: 'bestConditions', label: 'Conditions commerciales' }
  ];

  getPriorityLabel(code: string): string {
    const found = this.priorityCriteria.find(c => c.value === code);
    return found ? found.label : code;
  }

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

  constructor(private fb: FormBuilder, private dialog: MatDialog, private router: Router, private snackBar: MatSnackBar) {
    this.enrichmentForm = this.createForm();
    this.enrichmentForm.disable({ emitEvent: false });
    this.setupFormValidation();
    
    const navState: any = window.history.state || {};
    if (navState && navState.articleName) {
      this.selectedArticleName = String(navState.articleName);
    }
    if (navState && typeof navState.purchasePrice !== 'undefined') {
      const num = Number(navState.purchasePrice);
      this.selectedArticlePurchasePrice = Number.isFinite(num) ? num : null;
    }

    if (navState && navState.articleId) {
      this.isConsultation = false;
      this.enrichmentForm.enable({ emitEvent: false });
    }

    const purchaseCtrl = this.enrichmentForm.get('purchasePrice');
    const currentPurchaseVal = purchaseCtrl?.value;
    if ((currentPurchaseVal == null || currentPurchaseVal === '') && this.selectedArticlePurchasePrice != null) {
      purchaseCtrl?.setValue(this.selectedArticlePurchasePrice);
    }

    // Initialiser les valeurs précédentes
    this.previousAssortmentType = this.enrichmentForm.get('assortmentType')?.value || '';
    this.previousAssortmentSubType = this.enrichmentForm.get('assortmentSubType')?.value || '';

    this.enrichmentForm.get('mainSupplier')?.valueChanges.subscribe(() => {
      if (this.shouldShowLogistics()) {
        this.prefillLogisticsFromSupplier();
      }
    });

    ['moq','pcb','deliveryDelay'].forEach(key => {
      this.enrichmentForm.get(key)?.valueChanges.subscribe(() => {
        if (!this.isAutoFillingLogistics) this.logisticsAutofilled = false;
      });
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Typologie
      assortmentType: ['', Validators.required],
      assortmentSubType: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: [''],
      deploymentPerimeter: ['mixte', Validators.required],
      

      // Logistique
      mainSupplier: ['', Validators.required],
      mainSuppliers: [[]],
      alternativeSupplierConfigs: this.fb.array([]),
      moq: ['', [Validators.required, Validators.min(1)]],
      pcb: ['', [Validators.required, Validators.min(1)]],
      deliveryDelay: ['', [Validators.required, Validators.min(1)]],
      minStock: ['', [Validators.required, Validators.min(0)]],
      maxStock: ['', [Validators.min(0)]],
      reassortMode: ['manual', Validators.required],
      priorityOrder: [['lowestPrice','fastestDelivery','bestAvailability','bestConditions']],

      // Tarification
      purchasePrice: [''],
      salePrice: [''],
      salePricingPolicy: ['', Validators.required],
      saleMarginPercent: [''],
      saleMinPriceBound: [''],
      saleMaxPriceBound: [''],

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
    });
  }

  private updateValidationStatus(): void {
    const form = this.enrichmentForm;
    
    // Validation logistique (seulement si le bloc est visible)
    if (this.shouldShowLogistics()) {
      const type = this.enrichmentForm.get('assortmentType')?.value;
      if (type === 'dynamic') {
        const s = form.get('mainSuppliers')?.value || [];
        const order = form.get('priorityOrder')?.value || [];
        this.validationStatus.logistics = !!(s.length && order.length);
      } else {
        this.validationStatus.logistics = !!(
          form.get('mainSupplier')?.value &&
          form.get('moq')?.value &&
          form.get('pcb')?.value &&
          form.get('deliveryDelay')?.value &&
          form.get('minStock')?.value &&
          form.get('reassortMode')?.value
        );
      }
    } else {
      this.validationStatus.logistics = false;
    }

    // Validation tarification/vente (seulement si le bloc est visible)
    if (this.shouldShowSales()) {
      const policy = form.get('salePricingPolicy')?.value;
      const type = form.get('assortmentType')?.value;
      if (type === 'dynamic') {
        if (policy === 'imposed_price') {
          const sale = Number(form.get('salePrice')?.value);
          this.validationStatus.pricing = Number.isFinite(sale) && sale >= 0;
        } else {
          this.validationStatus.pricing = !!policy;
        }
      } else if (policy === 'fixed_margin') {
        const margin = Number(form.get('saleMarginPercent')?.value);
        this.validationStatus.pricing = Number.isFinite(margin) && margin >= 0 && margin <= 100;
      } else if (policy === 'fixed_margin_bounded') {
        const margin = Number(form.get('saleMarginPercent')?.value);
        const min = Number(form.get('saleMinPriceBound')?.value);
        const max = Number(form.get('saleMaxPriceBound')?.value);
        const minCtrl = form.get('saleMinPriceBound');
        const maxCtrl = form.get('saleMaxPriceBound');
        let ok = Number.isFinite(margin) && margin >= 0 && margin <= 100;
        ok = ok && Number.isFinite(min) && min >= 0 && Number.isFinite(max) && max >= 0;
        const maxErrors = { ...(maxCtrl?.errors || {}) } as any;
        if (Number.isFinite(min) && Number.isFinite(max)) {
          if (max < min) {
            maxErrors.maxBelowMin = true;
            ok = false;
          } else {
            if (maxErrors.maxBelowMin) delete maxErrors.maxBelowMin;
          }
          if (maxCtrl) maxCtrl.setErrors(Object.keys(maxErrors).length ? maxErrors : null);
        }
        this.validationStatus.pricing = ok;
      } else if (policy === 'imposed_price') {
        const sale = Number(form.get('salePrice')?.value);
        this.validationStatus.pricing = Number.isFinite(sale) && sale >= 0;
      } else {
        this.validationStatus.pricing = false;
      }
    } else {
      this.validationStatus.pricing = false;
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

  // Plus de calcul direct de marge: politique tarifaire de l'enseigne uniquement

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
    const currentShowsSales = this.typeShowsSales(currentType);
    const currentShowsLogistics = this.typeShowsLogistics(currentType);
    const newShowsSales = this.typeShowsSales(newType);
    const newShowsLogistics = this.typeShowsLogistics(newType);
    if (currentShowsSales && !newShowsSales) {
      return this.hasSalesData();
    }
    if (currentShowsLogistics && !newShowsLogistics) {
      return this.hasLogisticsData();
    }
    return false;
  }

  private hasSalesData(): boolean {
    const form = this.enrichmentForm;
    return !!(
      form.get('salePricingPolicy')?.value ||
      form.get('saleMarginPercent')?.value ||
      form.get('saleMinPriceBound')?.value ||
      form.get('saleMaxPriceBound')?.value
    );
  }

  private hasLogisticsData(): boolean {
    const form = this.enrichmentForm;
    const type = this.enrichmentForm.get('assortmentType')?.value;
    if (type === 'dynamic') {
      return !!(
        (form.get('mainSuppliers')?.value || []).length ||
        (form.get('priorityOrder')?.value || []).length
      );
    }
    return !!(
      form.get('mainSupplier')?.value ||
      form.get('moq')?.value ||
      form.get('pcb')?.value ||
      form.get('deliveryDelay')?.value ||
      form.get('minStock')?.value ||
      form.get('maxStock')?.value ||
      form.get('reassortMode')?.value ||
      (this.alternativeSupplierConfigs.length > 0)
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
    const salePricingPolicyCtrl = this.enrichmentForm.get('salePricingPolicy');
    const saleMarginCtrl = this.enrichmentForm.get('saleMarginPercent');
    const minBoundCtrl = this.enrichmentForm.get('saleMinPriceBound');
    const maxBoundCtrl = this.enrichmentForm.get('saleMaxPriceBound');
    const subTypeCtrl = this.enrichmentForm.get('assortmentSubType');
    const mainSupplierCtrl = this.enrichmentForm.get('mainSupplier');
    const mainSuppliersCtrl = this.enrichmentForm.get('mainSuppliers');
    if (type === 'vendable') {
      salePricingPolicyCtrl?.setValidators([Validators.required]);
      saleMarginCtrl?.clearValidators();
      minBoundCtrl?.clearValidators();
      maxBoundCtrl?.clearValidators();
      this.logisticsAutofilled = false;
    } else if (type === 'commandable') {
      salePricingPolicyCtrl?.clearValidators();
      salePricingPolicyCtrl?.setValue('', { emitEvent: false });
      saleMarginCtrl?.clearValidators();
      saleMarginCtrl?.setValue('', { emitEvent: false });
      minBoundCtrl?.clearValidators();
      minBoundCtrl?.setValue('', { emitEvent: false });
      maxBoundCtrl?.clearValidators();
      maxBoundCtrl?.setValue('', { emitEvent: false });
      this.prefillLogisticsFromSupplier();
      subTypeCtrl?.enable({ emitEvent: false });
      // Rétablir les validators logistiques classiques
      mainSuppliersCtrl?.clearValidators();
      mainSuppliersCtrl?.setValue([], { emitEvent: false });
      mainSupplierCtrl?.setValidators([Validators.required]);
      ['moq','pcb','deliveryDelay','minStock','maxStock','reassortMode'].forEach(key => {
        const ctrl = this.enrichmentForm.get(key);
        if (!ctrl) return;
        if (key === 'moq' || key === 'pcb' || key === 'deliveryDelay') {
          ctrl.setValidators([Validators.required, Validators.min(1)]);
        } else if (key === 'minStock') {
          ctrl.setValidators([Validators.required, Validators.min(0)]);
        } else if (key === 'maxStock') {
          ctrl.setValidators([Validators.min(0)]);
        } else if (key === 'reassortMode') {
          ctrl.setValidators([Validators.required]);
        }
        ctrl.updateValueAndValidity();
      });
      ['priority1','priority2','priority3'].forEach(k => this.enrichmentForm.get(k)?.setValue('', { emitEvent: false }));
    } else if (type === 'dynamic') {
      salePricingPolicyCtrl?.setValidators([Validators.required]);
      saleMarginCtrl?.clearValidators();
      minBoundCtrl?.clearValidators();
      maxBoundCtrl?.clearValidators();
      this.logisticsAutofilled = false;
      subTypeCtrl?.setValue('permanent', { emitEvent: false });
      subTypeCtrl?.disable({ emitEvent: false });
      this.applyAssortmentSubTypeChange('permanent');
      this.clearDatesData();
      // Activer le multiselect fournisseurs et désactiver/vider les champs classiques
      mainSupplierCtrl?.setValue('', { emitEvent: false });
      mainSupplierCtrl?.clearValidators();
      mainSuppliersCtrl?.setValidators([Validators.required]);
      mainSuppliersCtrl?.updateValueAndValidity();
      ['moq','pcb','deliveryDelay','minStock','maxStock','reassortMode'].forEach(key => {
        const ctrl = this.enrichmentForm.get(key);
        ctrl?.clearValidators();
        ctrl?.setValue(key === 'alternativeSuppliers' ? [] : '', { emitEvent: false });
        ctrl?.updateValueAndValidity();
      });
      const arr = this.alternativeSupplierConfigs;
      while (arr.length) arr.removeAt(0);
    } else {
      subTypeCtrl?.enable({ emitEvent: false });
    }
    salePricingPolicyCtrl?.updateValueAndValidity();
    saleMarginCtrl?.updateValueAndValidity();
    minBoundCtrl?.updateValueAndValidity();
    maxBoundCtrl?.updateValueAndValidity();
    this.updateValidationStatus();
  }

  onSalePricingPolicyChange(): void {
    const policy = this.enrichmentForm.get('salePricingPolicy')?.value;
    const saleMarginCtrl = this.enrichmentForm.get('saleMarginPercent');
    const minBoundCtrl = this.enrichmentForm.get('saleMinPriceBound');
    const maxBoundCtrl = this.enrichmentForm.get('saleMaxPriceBound');
    const saleCtrl = this.enrichmentForm.get('salePrice');
    const type = this.enrichmentForm.get('assortmentType')?.value;
    saleMarginCtrl?.clearValidators();
    minBoundCtrl?.clearValidators();
    maxBoundCtrl?.clearValidators();
    if (type === 'dynamic') {
      if (policy === 'imposed_price') {
        saleCtrl?.setValidators([Validators.required, Validators.min(0)]);
      } else {
        saleCtrl?.clearValidators();
        const suggested = this.computeSuggestedSalePrice();
        saleCtrl?.setValue(suggested ?? '', { emitEvent: false });
      }
    } else if (policy === 'fixed_margin') {
      saleMarginCtrl?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
      minBoundCtrl?.setValue('', { emitEvent: false });
      maxBoundCtrl?.setValue('', { emitEvent: false });
      saleCtrl?.setValidators([Validators.min(0)]);
      const suggested = this.computeSuggestedSalePrice();
      saleCtrl?.setValue(suggested ?? '', { emitEvent: false });
    } else if (policy === 'fixed_margin_bounded') {
      saleMarginCtrl?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
      minBoundCtrl?.setValidators([Validators.required, Validators.min(0)]);
      maxBoundCtrl?.setValidators([Validators.required, Validators.min(0)]);
      saleCtrl?.setValidators([Validators.min(0)]);
      const suggested = this.computeSuggestedSalePrice();
      saleCtrl?.setValue(suggested ?? '', { emitEvent: false });
    } else {
      saleMarginCtrl?.setValue('', { emitEvent: false });
      minBoundCtrl?.setValue('', { emitEvent: false });
      maxBoundCtrl?.setValue('', { emitEvent: false });
      saleCtrl?.setValidators([Validators.required, Validators.min(0)]);
    }
    saleMarginCtrl?.updateValueAndValidity();
    minBoundCtrl?.updateValueAndValidity();
    maxBoundCtrl?.updateValueAndValidity();
    saleCtrl?.updateValueAndValidity();
    this.updateValidationStatus();
  }

  computeSuggestedSalePrice(): number | null {
    const purchase = Number(this.enrichmentForm.get('purchasePrice')?.value);
    if (!Number.isFinite(purchase) || purchase < 0) return null;
    const policy = this.enrichmentForm.get('salePricingPolicy')?.value;
    if (policy === 'fixed_margin') {
      const margin = Number(this.enrichmentForm.get('saleMarginPercent')?.value);
      if (!Number.isFinite(margin)) return null;
      return +(purchase * (1 + margin / 100)).toFixed(2);
    }
    if (policy === 'fixed_margin_bounded') {
      const margin = Number(this.enrichmentForm.get('saleMarginPercent')?.value);
      const min = Number(this.enrichmentForm.get('saleMinPriceBound')?.value);
      const max = Number(this.enrichmentForm.get('saleMaxPriceBound')?.value);
      if (!Number.isFinite(margin)) return null;
      let price = purchase * (1 + margin / 100);
      if (Number.isFinite(min)) price = Math.max(price, min);
      if (Number.isFinite(max)) price = Math.min(price, max);
      return +price.toFixed(2);
    }
    return null;
  }

  getSubTypeLabel(code: string): string {
    const found = this.assortmentSubTypes.find(s => s.value === code);
    return found ? found.label : code;
  }

  getPerimeterLabel(code: string): string {
    const found = this.deploymentPerimeterOptions.find(p => p.value === code);
    return found ? found.label : code;
  }

  getSalePolicyLabel(code: string): string {
    const found = this.salePricingPolicies.find(p => p.value === code);
    return found ? found.label : code;
  }

  getReassortModeLabel(code: string): string {
    const found = this.reassortModes.find(m => m.value === code);
    return found ? found.label : code;
  }

  getSupplierNameById(id: number): string {
    const s = this.suppliers.find(x => x.id === id);
    return s ? `${s.name} (${s.code})` : `${id}`;
  }

  getSuppliersNamesByIds(ids: number[]): string {
    const list = (ids || []).map(id => this.getSupplierNameById(id));
    return list.join(', ');
  }

  getPriorityOptions(level: 1 | 2 | 3) {
    const p1 = this.enrichmentForm.get('priority1')?.value;
    const p2 = this.enrichmentForm.get('priority2')?.value;
    const p3 = this.enrichmentForm.get('priority3')?.value;
    const exclude = new Set<string>([p1, p2, p3].filter(Boolean));
    // Autoriser la valeur déjà sélectionnée pour le niveau courant
    const current = level === 1 ? p1 : (level === 2 ? p2 : p3);
    return this.priorityCriteria.filter(c => !exclude.has(c.value) || c.value === current);
  }

  private applyAssortmentSubTypeChange(subType: string): void {
    this.previousAssortmentSubType = subType;
    const startDateCtrl = this.enrichmentForm.get('startDate');
    const endDateCtrl = this.enrichmentForm.get('endDate');
    if (subType === 'permanent') {
      startDateCtrl?.clearValidators();
      endDateCtrl?.clearValidators();
    } else {
      startDateCtrl?.setValidators([Validators.required]);
      endDateCtrl?.clearValidators();
    }
    startDateCtrl?.updateValueAndValidity();
    endDateCtrl?.updateValueAndValidity();
    this.updateValidationStatus();
  }

  private clearIncompatibleData(currentType: string, newType: string): void {
    const currentShowsSales = this.typeShowsSales(currentType);
    const currentShowsLogistics = this.typeShowsLogistics(currentType);
    const newShowsSales = this.typeShowsSales(newType);
    const newShowsLogistics = this.typeShowsLogistics(newType);
    if (currentShowsSales && !newShowsSales) {
      this.enrichmentForm.patchValue({
        salePricingPolicy: ''
      });
    }
    if (currentShowsLogistics && !newShowsLogistics) {
      this.enrichmentForm.patchValue({
        mainSupplier: '',
        mainSuppliers: [],
        moq: '',
        pcb: '',
        deliveryDelay: '',
        minStock: '',
        maxStock: '',
        reassortMode: 'manual',
        alternativeSuppliers: []
      });
      this.enrichmentForm.get('priorityOrder')?.setValue([]);
    }
  }

  onPriorityDrop(event: CdkDragDrop<string[]>): void {
    const order: string[] = [...(this.enrichmentForm.get('priorityOrder')?.value || [])];
    moveItemInArray(order, event.previousIndex, event.currentIndex);
    this.enrichmentForm.get('priorityOrder')?.setValue(order);
    this.updateValidationStatus();
  }

  private clearDatesData(): void {
    this.enrichmentForm.patchValue({
      startDate: '',
      endDate: ''
    });
  }

  // Plus de bascule de type de prix: gestion via salePricingPolicy uniquement

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Simulation d'upload - dans un vrai projet, on uploadrait le fichier
      this.enrichmentForm.get('mainImage')?.setValue(file.name);
    }
  }

  goBack(): void {
    window.history.back();
  }

  saveDraft(): void {
    try {
      const data = this.enrichmentForm.getRawValue();
      const payload = {
        timestamp: Date.now(),
        data
      };
      localStorage.setItem('assortment_enrichment_draft', JSON.stringify(payload));
      this.snackBar.open('Brouillon sauvegardé', 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Erreur lors de la sauvegarde', 'Fermer', { duration: 4000 });
    }
  }

  validateAssortment(): void {
    if (this.isCompletelyValid()) {
      console.log('Validation de l\'assortiment', this.enrichmentForm.value);
      
      // Après validation réussie, proposer de créer le type opposé
      const currentType = this.enrichmentForm.get('assortmentType')?.value;
      this.showCreateOppositeDialog(currentType);
    } else {
      this.markFormGroupTouched();
      this.snackBar.open('Formulaire incomplet ou invalide', 'Fermer', { duration: 4000 });
    }
  }

  private showCreateOppositeDialog(currentType: string): void {
    if (currentType === 'dynamic') return;
    const oppositeType = currentType === 'vendable' ? 'commandable' : 'vendable';
    
    const dialogData: CreateOppositeDialogData = {
      currentType: currentType,
      oppositeType: oppositeType,
      assortmentSubType: this.enrichmentForm.get('assortmentSubType')?.value,
      startDate: this.enrichmentForm.get('startDate')?.value,
      endDate: this.enrichmentForm.get('endDate')?.value,
      articleName: this.getArticleName()
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
    if (oppositeType === 'vendable') {
      const purchaseCtrl = this.enrichmentForm.get('purchasePrice');
      const saleCtrl = this.enrichmentForm.get('salePrice');
      purchaseCtrl?.setValue(99.99);
      saleCtrl?.setValidators([Validators.required, Validators.min(0)]);
      saleCtrl?.updateValueAndValidity();
    }
    
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
    const logisticsOk = !this.shouldShowLogistics() || this.validationStatus.logistics;
    const pricingOk = !this.shouldShowSales() || this.validationStatus.pricing;
    return logisticsOk && pricingOk;
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

  getArticleName(): string {
    const fromSelection = this.selectedArticleName && this.selectedArticleName.trim() ? this.selectedArticleName : '';
    const fromForm = this.enrichmentForm.get('commercialLabel')?.value;
    const name = fromSelection || fromForm;
    return name && String(name).trim() ? String(name) : 'Article';
  }

  shouldShowLogistics(): boolean {
    const type = this.enrichmentForm.get('assortmentType')?.value;
    return type === 'commandable' || type === 'dynamic';
  }

  shouldShowSales(): boolean {
    const type = this.enrichmentForm.get('assortmentType')?.value;
    return type === 'vendable' || type === 'dynamic';
  }

  isPurchaseReadOnly(): boolean {
    const type = this.enrichmentForm.get('assortmentType')?.value;
    return type === 'vendable';
  }

  private typeShowsSales(type: string): boolean {
    return type === 'vendable' || type === 'dynamic';
  }

  private typeShowsLogistics(type: string): boolean {
    return type === 'commandable' || type === 'dynamic';
  }

  private supplierLogisticsDefaults: Record<number, { moq: number; pcb: number; deliveryDelay: number }> = {
    1: { moq: 100, pcb: 12, deliveryDelay: 2 },
    2: { moq: 100, pcb: 12, deliveryDelay: 2 },
    3: { moq: 100, pcb: 12, deliveryDelay: 2 }
  };

  private prefillLogisticsFromSupplier(): void {
    const type = this.enrichmentForm.get('assortmentType')?.value;
    if (type !== 'commandable') return;
    const supplierId = this.enrichmentForm.get('mainSupplier')?.value;
    const defaults = this.supplierLogisticsDefaults[supplierId as number] || { moq: 100, pcb: 12, deliveryDelay: 2 };
    this.isAutoFillingLogistics = true;
    const moqCtrl = this.enrichmentForm.get('moq');
    const pcbCtrl = this.enrichmentForm.get('pcb');
    const delayCtrl = this.enrichmentForm.get('deliveryDelay');
    if (moqCtrl) { moqCtrl.setValue(defaults.moq); }
    if (pcbCtrl) { pcbCtrl.setValue(defaults.pcb); }
    if (delayCtrl) { delayCtrl.setValue(defaults.deliveryDelay); }
    this.isAutoFillingLogistics = false;
    this.logisticsAutofilled = true;
    this.updateValidationStatus();
  }

  get alternativeSupplierConfigs(): FormArray {
    return this.enrichmentForm.get('alternativeSupplierConfigs') as FormArray;
  }

  private createSupplierConfigGroup(): FormGroup {
    return this.fb.group({
      supplierId: [''],
      moq: [''],
      pcb: [''],
      deliveryDelay: [''],
      minStock: [''],
      maxStock: [''],
      reassortMode: ['']
    });
  }

  addAlternativeSupplier(): void {
    this.alternativeSupplierConfigs.push(this.createSupplierConfigGroup());
  }

  removeAlternativeSupplier(index: number): void {
    if (index >= 0 && index < this.alternativeSupplierConfigs.length) {
      this.alternativeSupplierConfigs.removeAt(index);
    }
  }

  onAltSupplierSelected(index: number): void {
    const group = this.alternativeSupplierConfigs.at(index) as FormGroup;
    const supplierId = group.get('supplierId')?.value as number;
    const defaults = this.supplierLogisticsDefaults[supplierId] || { moq: 100, pcb: 12, deliveryDelay: 2 };
    group.get('moq')?.setValue(defaults.moq);
    group.get('pcb')?.setValue(defaults.pcb);
    group.get('deliveryDelay')?.setValue(defaults.deliveryDelay);
  }
}
