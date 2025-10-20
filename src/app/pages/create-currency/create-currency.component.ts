import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Currency } from '../currencies-list/currencies-list.component';

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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

interface Language {
  code: string;
  name: string;
  flag: string;
  required: boolean;
}

@Component({
  selector: 'app-create-currency',
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
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './create-currency.component.html',
  styleUrls: ['./create-currency.component.scss']
})
export class CreateCurrencyComponent implements OnInit {
  @Output() goBack = new EventEmitter<void>();
  @Input() isFocusMode: boolean = false;
  @Input() isEditMode: boolean = false;
  @Input() currencyId: string | null = null;

  currentCurrency: Currency | null = null;
  translationsEnabled: boolean = false; // Toggle pour activer/désactiver les traductions
  
  // Langues disponibles
  languages: Language[] = [
    { code: 'fr', name: 'Français', flag: '🇫🇷', required: true },
    { code: 'en', name: 'English', flag: '🇬🇧', required: false },
    { code: 'es', name: 'Español', flag: '🇪🇸', required: false },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪', required: false }
  ];

  selectedLanguage: string = 'fr'; // Langue active par défaut
  
  currencyForm!: FormGroup;

  constructor(
    private fb: FormBuilder
  ) { }

  getSelectedLanguage(): Language {
    return this.languages.find(lang => lang.code === this.selectedLanguage) || this.languages[0];
  }

  ngOnInit(): void {
    this.initForm();
    if (this.isEditMode && this.currencyId) {
      this.loadCurrencyData();
    }
  }

  private initForm(): void {
    this.currencyForm = this.fb.group({
      code: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(3),
        Validators.pattern(/^[A-Z]{3}$/)
      ]],
      numericCode: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]{3}$/)
      ]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      symbol: ['', [Validators.required, Validators.minLength(1)]],
      rounding: [0.01, [Validators.required, Validators.min(0.0001)]],
      // Array pour les conversions de devises multiples
      conversions: this.fb.array([])
    });

    // Transformer automatiquement le code en majuscules
    this.currencyForm.get('code')?.valueChanges.subscribe(value => {
      if (value && typeof value === 'string') {
        const upperValue = value.toUpperCase();
        if (upperValue !== value) {
          this.currencyForm.get('code')?.setValue(upperValue, { emitEvent: false });
        }
      }
    });
  }

  private loadCurrencyData(): void {
    // Simulation du chargement des données de la devise
    // Dans un vrai projet, ceci ferait appel à un service
    if (this.currencyId) {
      // Exemple de données simulées
      const mockCurrency: Currency = {
        id: this.currencyId,
        code: 'EUR',
        numericCode: '978',
        name: 'Euro',
        symbol: '€',
        rounding: 0.01,
        is_active: true
      };

      this.currentCurrency = mockCurrency;
      this.currencyForm.patchValue({
        code: mockCurrency.code,
        numericCode: mockCurrency.numericCode,
        name: mockCurrency.name,
        symbol: mockCurrency.symbol,
        rounding: mockCurrency.rounding
      });
    }
  }

  onSubmit(): void {
    if (this.currencyForm.valid) {
      const formValue = this.currencyForm.value;
      
      const currencyData: Partial<Currency> = {
        code: formValue.code,
        numericCode: formValue.numericCode,
        name: formValue.name,
        symbol: formValue.symbol,
        rounding: formValue.rounding,
        is_active: true
      };

      if (this.isEditMode && this.currentCurrency) {
        // Mode édition
        console.log('Mise à jour de la devise:', { ...this.currentCurrency, ...currencyData });
        // Ici, vous appelleriez votre service pour mettre à jour la devise
      } else {
        // Mode création
        console.log('Création d\'une nouvelle devise:', currencyData);
        // Ici, vous appelleriez votre service pour créer la devise
      }

      // Simulation d'une sauvegarde réussie
      this.onGoBack();
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.currencyForm.controls).forEach(key => {
        this.currencyForm.get(key)?.markAsTouched();
      });
    }
  }

  onGoBack(): void {
    this.goBack.emit();
  }

  // Méthodes utilitaires pour la validation
  getErrorMessage(fieldName: string): string {
    const field = this.currencyForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} est obligatoire`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} doit contenir au moins ${field.errors['minlength'].requiredLength} caractères`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldLabel(fieldName)} ne peut pas dépasser ${field.errors['maxlength'].requiredLength} caractères`;
      }
      if (field.errors['pattern']) {
        switch (fieldName) {
          case 'code':
            return 'Le code doit contenir exactement 3 lettres majuscules';
          case 'numericCode':
            return 'Le code numérique doit contenir exactement 3 chiffres';
          default:
            return 'Format invalide';
        }
      }
      if (field.errors['min']) {
        return `${this.getFieldLabel(fieldName)} doit être supérieur à ${field.errors['min'].min}`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      code: 'Le code',
      numericCode: 'Le code numérique',
      name: 'Le nom',
      symbol: 'Le symbole',
      rounding: 'L\'arrondi'
    };
    return labels[fieldName] || 'Ce champ';
  }

  // Méthodes pour gérer les conversions de devises
  get conversions(): FormArray {
    return this.currencyForm.get('conversions') as FormArray;
  }

  addConversion(): void {
    const conversionGroup = this.fb.group({
      conversionCurrency: ['', Validators.required],
      validityStartDate: ['', Validators.required],
      conversionRate: ['', [Validators.required, Validators.min(0)]],
      conversionSource: ['']
    });
    this.conversions.push(conversionGroup);
  }

  removeConversion(index: number): void {
    this.conversions.removeAt(index);
  }
}