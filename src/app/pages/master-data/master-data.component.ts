import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

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
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';

interface ArticleCodeFormat {
  prefix: string;
  suffix: string;
  separator: string;
}

@Component({
  selector: 'app-master-data',
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
    MatTabsModule,
    MatDividerModule
  ],
  templateUrl: './master-data.component.html',
  styleUrls: ['./master-data.component.scss']
})
export class MasterDataComponent implements OnInit {
  @Output() goBack = new EventEmitter<void>();
  @Input() isFocusMode: boolean = false;

  articleCodeForm: FormGroup;
  articleCodeFormat: ArticleCodeFormat = {
    prefix: '',
    suffix: '',
    separator: '-'
  };
  isLoading: boolean = false;
  isSaving: boolean = false;
  previewCode: string = '';

  // Séparateurs disponibles
  separators = [
    { value: '-', label: 'Tiret (-)' },
    { value: '_', label: 'Underscore (_)' },
    { value: '.', label: 'Point (.)' },
    { value: '', label: 'Aucun séparateur' }
  ];

  constructor(private fb: FormBuilder) {
    this.articleCodeForm = this.initForm();
  }

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Initialisation du formulaire
   */
  private initForm(): FormGroup {
    const form = this.fb.group({
      prefix: ['', [Validators.maxLength(10)]],
      suffix: ['', [Validators.maxLength(10)]],
      separator: ['-']
    });

    // Écouter les changements pour mettre à jour l'aperçu
    form.valueChanges.subscribe(() => {
      this.generatePreview();
    });

    return form;
  }

  /**
   * Chargement des données
   */
  private loadData(): void {
    this.isLoading = true;
    
    // Simulation du chargement des données
    setTimeout(() => {
      this.articleCodeFormat = {
        prefix: 'ART',
        suffix: '001',
        separator: '-'
      };
      
      this.articleCodeForm.patchValue(this.articleCodeFormat);
      this.generatePreview();
      this.isLoading = false;
    }, 1000);
  }

  /**
   * Génération de l'aperçu du code article
   */
  generatePreview(): void {
    const formValue = this.articleCodeForm.value;
    const prefix = formValue.prefix || '';
    const suffix = formValue.suffix || '';
    const separator = formValue.separator || '';
    
    let preview = prefix;
    if (prefix && separator) {
      preview += separator;
    }
    preview += '001234'; // Numéro d'exemple
    if (suffix) {
      if (separator) {
        preview += separator;
      }
      preview += suffix;
    }
    
    this.previewCode = preview || 'ART-001234-V1';
  }

  /**
   * Génération d'un exemple de code article
   */
  generateExample(): string {
    return this.previewCode;
  }

  /**
   * Sauvegarde de la configuration
   */
  onSave(): void {
    if (this.articleCodeForm.valid) {
      this.isSaving = true;
      
      const formData: ArticleCodeFormat = {
        ...this.articleCodeForm.value
      };
      
      console.log('Sauvegarde de la configuration:', formData);
      
      // Simulation de la sauvegarde
      setTimeout(() => {
        this.isSaving = false;
        console.log('Configuration sauvegardée avec succès');
        // Ici, vous pourriez ajouter une notification de succès
      }, 1000);
    } else {
      this.markFormGroupTouched();
    }
  }

  /**
   * Réinitialisation du formulaire
   */
  onReset(): void {
    this.articleCodeForm.patchValue({
      prefix: '',
      separator: '',
      suffix: ''
    });
    this.generatePreview();
  }

  /**
   * Retour à la vue précédente
   */
  onGoBack(): void {
    this.goBack.emit();
  }

  /**
   * Marquer tous les champs comme touchés pour afficher les erreurs
   */
  private markFormGroupTouched(): void {
    Object.keys(this.articleCodeForm.controls).forEach(key => {
      const control = this.articleCodeForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  /**
   * Vérification des erreurs de champ
   */
  hasFieldError(fieldName: string, errorType: string): boolean {
    const field = this.articleCodeForm.get(fieldName);
    return !!(field && field.hasError(errorType) && (field.dirty || field.touched));
  }

  /**
   * Récupération du message d'erreur pour un champ
   */
  getFieldError(fieldName: string): string {
    const field = this.articleCodeForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return `Le champ ${fieldName} est requis`;
      }
      if (field.errors['maxlength']) {
        return `Le champ ${fieldName} ne peut pas dépasser ${field.errors['maxlength'].requiredLength} caractères`;
      }
    }
    return '';
  }
}