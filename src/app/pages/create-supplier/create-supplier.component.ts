import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Supplier } from '../suppliers-list/suppliers-list.component';

// Imports Material individuels
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-create-supplier',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSlideToggleModule
  ],
  templateUrl: './create-supplier.component.html',
  styleUrls: ['./create-supplier.component.scss']
})
export class CreateSupplierComponent implements OnInit {
  @Output() goBack = new EventEmitter<void>();
  @Input() isFocusMode: boolean = false;
  @Input() isEditMode: boolean = false;
  @Input() supplierId: string | null = null;

  currentSupplier: Supplier | null = null;
  
  supplierForm!: FormGroup;

  constructor(
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initForm();
    if (this.isEditMode && this.supplierId) {
      this.loadSupplierData();
    }
  }

  loadSupplierData(): void {
    if (this.supplierId) {
      // Simulation de récupération des données du fournisseur
      this.currentSupplier = this.getMockSupplierById(this.supplierId);
      if (this.currentSupplier) {
        this.populateForm(this.currentSupplier);
      }
    }
  }

  getMockSupplierById(id: string): Supplier | null {
    // Simulation des données - en réalité, ceci viendrait d'un service
    const mockSuppliers: Supplier[] = [
      { id: '1', nom: 'Fournisseur Alpha', contact: 'contact@alpha.com', is_active: true, type: 'fournisseur' },
      { id: '2', nom: 'Beta Solutions', contact: 'info@beta.fr', is_active: true, type: 'prestataire' },
      { id: '3', nom: 'Gamma Industries', contact: 'commercial@gamma.com', is_active: false, type: 'transporteur' },
      { id: '4', nom: 'Delta Services', contact: 'service@delta.fr', is_active: true, type: 'fournisseur' },
      { id: '5', nom: 'Epsilon Corp', contact: 'contact@epsilon.com', is_active: true, type: 'prestataire' }
    ];

    return mockSuppliers.find(supplier => supplier.id === id) || null;
  }

  populateForm(supplier: Supplier): void {
    this.supplierForm.patchValue({
      nom: supplier.nom,
      contact: supplier.contact,
      type: supplier.type,
      is_active: supplier.is_active
    });
  }

  initForm(): void {
    this.supplierForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      contact: ['', [Validators.required, Validators.email]],
      type: ['fournisseur', [Validators.required]],
      is_active: [true]
    });
  }

  onSubmit(): void {
    if (this.supplierForm.valid) {
      const formData = this.supplierForm.value;
      
      if (this.isEditMode) {
        // TODO: Appeler le service pour mettre à jour le fournisseur
        console.log('Mise à jour du fournisseur:', { id: this.supplierId, ...formData });
      } else {
        // TODO: Appeler le service pour créer un nouveau fournisseur
        const newSupplier = {
          id: this.generateId(),
          ...formData
        };
        console.log('Création du fournisseur:', newSupplier);
      }
      
      this.showSuccessMessage();
      this.onGoBack();
    } else {
      this.markFormGroupTouched(this.supplierForm);
    }
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  showSuccessMessage(): void {
    const message = this.isEditMode 
      ? 'Fournisseur mis à jour avec succès !' 
      : 'Fournisseur créé avec succès !';
    console.log(message);
    // TODO: Afficher un toast/snackbar avec le message
  }

  resetForm(): void {
    this.supplierForm.reset();
    this.supplierForm.patchValue({
      is_active: true
    });
  }

  generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  onGoBack(): void {
    this.goBack.emit();
  }
}