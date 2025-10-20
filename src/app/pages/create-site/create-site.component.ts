import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Site } from '../sites-list/sites-list.component';

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

interface SiteType {
  id: string;
  name: string;
}

interface Country {
  id: string;
  name: string;
  code: string;
}

@Component({
  selector: 'app-create-site',
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
  templateUrl: './create-site.component.html',
  styleUrls: ['./create-site.component.scss']
})
export class CreateSiteComponent implements OnInit {
  @Output() goBack = new EventEmitter<void>();
  @Input() isFocusMode: boolean = false;
  @Input() isEditMode: boolean = false;
  @Input() siteId: string | null = null;

  currentSite: Site | null = null;
  
  siteForm!: FormGroup;
  
  // Données de référence (mock)
  siteTypes: SiteType[] = [
    { id: 'store', name: 'Magasin' },
    { id: 'warehouse', name: 'Entrepôt' },
    { id: 'office', name: 'Bureau' },
    { id: 'factory', name: 'Usine' },
    { id: 'mall', name: 'Centre commercial' }
  ];

  countries: Country[] = [
    { id: 'fr', name: 'France', code: 'FR' },
    { id: 'be', name: 'Belgique', code: 'BE' },
    { id: 'ch', name: 'Suisse', code: 'CH' },
    { id: 'es', name: 'Espagne', code: 'ES' },
    { id: 'de', name: 'Allemagne', code: 'DE' }
  ];

  constructor(
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initForm();
    if (this.isEditMode && this.siteId) {
      this.loadSiteData();
    }
  }

  loadSiteData(): void {
    if (this.siteId) {
      // Simulation de récupération des données du site
      this.currentSite = this.getMockSiteById(this.siteId);
      if (this.currentSite) {
        this.populateForm(this.currentSite);
      }
    }
  }

  getMockSiteById(id: string): Site | null {
    // Simulation des données - en réalité, ceci viendrait d'un service
    const mockSites: Site[] = [
      {
        id: 'site-001',
        name: 'Magasin Paris Centre',
        address: '123 Rue de Rivoli',
        type: 'store',
        city: 'Paris',
        postal_code: '75001',
        country: 'fr',
        phone: '+33 1 42 60 30 30',
        email: 'paris.centre@example.com',
        is_active: true
      },
      {
        id: 'site-002',
        name: 'Entrepôt Lyon',
        address: '456 Avenue de la République',
        type: 'warehouse',
        city: 'Lyon',
        postal_code: '69002',
        country: 'fr',
        phone: '+33 4 78 42 15 30',
        email: 'lyon.entrepot@example.com',
        is_active: true
      }
    ];
    
    return mockSites.find(site => site.id === id) || null;
  }

  populateForm(site: Site): void {
    this.siteForm.patchValue({
      name: site.name,
      address: site.address,
      type: site.type,
      city: site.city,
      postal_code: site.postal_code,
      country: site.country,
      phone: site.phone || '',
      email: site.email || '',
      is_active: site.is_active
    });
  }

  initForm(): void {
    this.siteForm = this.fb.group({
      name: ['', [Validators.required]],
      address: ['', [Validators.required]],
      type: ['', [Validators.required]],
      city: ['', [Validators.required]],
      postal_code: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      country: ['fr', [Validators.required]],
      phone: ['', [Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]],
      email: ['', [Validators.email]],
      is_active: [true]
    });
  }

  onSubmit(): void {
    if (this.siteForm.valid) {
      const formData = this.siteForm.value;
      
      if (this.isEditMode && this.currentSite) {
        // Mode édition : mettre à jour le site existant
        const updatedSite: Site = {
          ...this.currentSite,
          ...formData
        };
        console.log('Site mis à jour:', updatedSite);
        // TODO: Implémenter l'appel API pour mettre à jour le site
      } else {
        // Mode création : créer un nouveau site
        const newSite: Site = {
          id: this.generateId(),
          ...formData
        };
        console.log('Nouveau site créé:', newSite);
        // TODO: Implémenter l'appel API pour créer le site
      }
      
      this.showSuccessMessage();
    } else {
      this.markFormGroupTouched(this.siteForm);
    }
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  showSuccessMessage(): void {
    const message = this.isEditMode ? 'Site mis à jour avec succès!' : 'Site créé avec succès!';
    console.log(message);
    // TODO: Implémenter l'affichage d'un message de succès dans l'UI
  }

  resetForm(): void {
    this.siteForm.reset();
    this.siteForm.patchValue({
      country: 'fr',
      is_active: true
    });
  }

  generateId(): string {
    const prefix = 'SITE';
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
  }

  onGoBack(): void {
    this.goBack.emit();
  }
}