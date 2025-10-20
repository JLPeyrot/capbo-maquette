import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Vat } from '../vats-list/vats-list.component';

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

interface Language {
  code: string;
  name: string;
  flag: string;
  required: boolean;
}

@Component({
  selector: 'app-create-vat',
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
  templateUrl: './create-vat.component.html',
  styleUrls: ['./create-vat.component.scss']
})
export class CreateVatComponent implements OnInit {
  @Output() goBack = new EventEmitter<void>();
  @Input() isFocusMode: boolean = false;
  @Input() isEditMode: boolean = false;
  @Input() vatId: string | null = null;

  currentVat: Vat | null = null;
  translationsEnabled: boolean = false; // Toggle pour activer/désactiver les traductions
  
  // Langues disponibles
  languages: Language[] = [
    { code: 'fr', name: 'Français', flag: '🇫🇷', required: true },
    { code: 'en', name: 'English', flag: '🇬🇧', required: false },
    { code: 'es', name: 'Español', flag: '🇪🇸', required: false },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪', required: false }
  ];

  selectedLanguage: string = 'fr'; // Langue active par défaut
  
  vatForm!: FormGroup;

  constructor(
    private fb: FormBuilder
  ) { }

  getSelectedLanguage(): Language {
    return this.languages.find(lang => lang.code === this.selectedLanguage) || this.languages[0];
  }

  ngOnInit(): void {
    this.initForm();
    if (this.isEditMode && this.vatId) {
      this.loadVatData();
    }
  }

  loadVatData(): void {
    if (this.vatId) {
      // TODO: Remplacer par un appel au service réel
      const vat = this.getMockVatById(this.vatId);
      if (vat) {
        this.currentVat = vat;
        this.populateForm(vat);
      }
    }
  }

  getMockVatById(id: string): Vat | null {
    const mockVats: Vat[] = [
      { id: '1', nom: 'TVA Standard', taux: 20, description: 'Taux de TVA standard français', type: 'standard', is_active: true },
      { id: '2', nom: 'TVA Réduite', taux: 10, description: 'Taux de TVA réduit pour certains produits', type: 'reduite', is_active: true },
      { id: '3', nom: 'TVA Super Réduite', taux: 5.5, description: 'Taux de TVA super réduit', type: 'super_reduite', is_active: true },
      { id: '4', nom: 'TVA Particulière', taux: 2.1, description: 'Taux de TVA particulier pour la presse', type: 'particuliere', is_active: false },
      { id: '5', nom: 'TVA Export', taux: 0, description: 'TVA pour les exportations', type: 'particuliere', is_active: true }
    ];
    return mockVats.find(vat => vat.id === id) || null;
  }

  populateForm(vat: Vat): void {
    this.vatForm.patchValue({
      nom: vat.nom,
      taux: vat.taux
    });
  }

  initForm(): void {
    this.vatForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      taux: ['', [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  onSubmit(): void {
    if (this.vatForm.valid) {
      const formData = this.vatForm.value;
      
      if (this.isEditMode) {
        // TODO: Appeler le service pour mettre à jour la TVA
        console.log('Mise à jour de la TVA:', { id: this.vatId, ...formData });
      } else {
        // TODO: Appeler le service pour créer une nouvelle TVA
        const newVat = {
          id: this.generateId(),
          ...formData
        };
        console.log('Création de la TVA:', newVat);
      }
      
      this.showSuccessMessage();
      this.onGoBack();
    } else {
      this.markFormGroupTouched(this.vatForm);
    }
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  showSuccessMessage(): void {
    // TODO: Implémenter un service de notification
    const message = this.isEditMode 
      ? 'TVA mise à jour avec succès!' 
      : 'TVA créée avec succès!';
    console.log(message);
    // Ici on pourrait utiliser MatSnackBar ou un autre service de notification
  }

  resetForm(): void {
    this.vatForm.reset({
      nom: '',
      taux: ''
    });
  }

  generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  onGoBack(): void {
    this.goBack.emit();
  }
}