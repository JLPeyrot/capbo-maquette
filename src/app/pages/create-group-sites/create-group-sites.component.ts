import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';

export interface Site {
  id: string;
  name: string;
  address: string;
  type: string;
  city: string;
  postal_code: string;
  country: string;
  phone: string;
  email: string;
  is_active: boolean;
}

export interface GroupSites {
  id: string;
  nom: string;
  type: 'Groupe' | 'Assortiments' | 'Collection' | 'Thématique';
  sites: Site[];
  is_active: boolean;
}

@Component({
  selector: 'app-create-group-sites',
  standalone: true,
  imports: [
    CommonModule, 
    MaterialModule, 
    ReactiveFormsModule, 
    FormsModule, 
    MatCheckboxModule,
    MatSelectModule
  ],
  templateUrl: './create-group-sites.component.html',
  styleUrls: ['./create-group-sites.component.scss']
})
export class CreateGroupSitesComponent implements OnInit {
  @Output() goBack = new EventEmitter<void>();
  @Input() isFocusMode: boolean = false;
  @Input() isEditMode: boolean = false;
  @Input() groupSitesId: string | null = null;

  currentGroupSites: GroupSites | null = null;
  
  groupSitesForm!: FormGroup;
  
  // Sites disponibles pour sélection
  availableSites: Site[] = [
    {
      id: 'site-001',
      name: 'Magasin Paris Centre',
      address: '123 Rue de Rivoli',
      type: 'Magasin',
      city: 'Paris',
      postal_code: '75001',
      country: 'France',
      phone: '+33 1 42 60 30 30',
      email: 'paris.centre@example.com',
      is_active: true
    },
    {
      id: 'site-002',
      name: 'Entrepôt Lyon',
      address: '456 Avenue de la République',
      type: 'Entrepôt',
      city: 'Lyon',
      postal_code: '69002',
      country: 'France',
      phone: '+33 4 78 42 15 30',
      email: 'lyon.entrepot@example.com',
      is_active: true
    },
    {
      id: 'site-003',
      name: 'Bureau Marseille',
      address: '789 La Canebière',
      type: 'Bureau',
      city: 'Marseille',
      postal_code: '13001',
      country: 'France',
      phone: '+33 4 91 54 30 30',
      email: 'marseille.bureau@example.com',
      is_active: true
    },
    {
      id: 'site-004',
      name: 'Magasin Bordeaux',
      address: '321 Cours de l\'Intendance',
      type: 'Magasin',
      city: 'Bordeaux',
      postal_code: '33000',
      country: 'France',
      phone: '+33 5 56 44 30 30',
      email: 'bordeaux.magasin@example.com',
      is_active: true
    },
    {
      id: 'site-005',
      name: 'Usine Lille',
      address: '654 Rue de la Paix',
      type: 'Usine',
      city: 'Lille',
      postal_code: '59000',
      country: 'France',
      phone: '+33 3 20 12 34 56',
      email: 'lille.usine@example.com',
      is_active: false
    }
  ];

  constructor(
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initForm();
    if (this.isEditMode && this.groupSitesId) {
      this.loadGroupSitesData();
    }
  }

  loadGroupSitesData(): void {
    if (this.groupSitesId) {
      // Simulation de récupération des données du groupe de sites
      this.currentGroupSites = this.getMockGroupSitesById(this.groupSitesId);
      if (this.currentGroupSites) {
        this.populateForm(this.currentGroupSites);
      }
    }
  }

  getMockGroupSitesById(id: string): GroupSites | null {
    // Simulation des données - en réalité, ceci viendrait d'un service
    const mockGroupSites: GroupSites[] = [
      {
        id: 'group-001',
        nom: 'Groupe Paris Centre',
        type: 'Groupe',
        sites: [this.availableSites[0], this.availableSites[1]],
        is_active: true
      },
      {
        id: 'group-002',
        nom: 'Groupe Sud',
        type: 'Collection',
        sites: [this.availableSites[2], this.availableSites[3]],
        is_active: true
      }
    ];
    
    return mockGroupSites.find(group => group.id === id) || null;
  }

  populateForm(groupSites: GroupSites): void {
    const selectedSiteIds = groupSites.sites.map(site => site.id);
    this.groupSitesForm.patchValue({
      nom: groupSites.nom,
      type: groupSites.type,
      selectedSites: selectedSiteIds
    });
  }

  initForm(): void {
    this.groupSitesForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3)]],
      type: ['', [Validators.required]],
      selectedSites: [[], [Validators.required, this.minSitesValidator]]
    });
  }

  // Validateur personnalisé pour s'assurer qu'au moins un site est sélectionné
  minSitesValidator(control: any) {
    const sites = control.value;
    if (!sites || sites.length === 0) {
      return { minSites: { message: 'Au moins un site doit être sélectionné' } };
    }
    return null;
  }

  onSubmit(): void {
    if (this.groupSitesForm.valid) {
      const formData = this.groupSitesForm.value;
      
      // Récupérer les objets Site complets à partir des IDs sélectionnés
      const selectedSites = this.availableSites.filter(site => 
        formData.selectedSites.includes(site.id)
      );
      
      if (this.isEditMode && this.currentGroupSites) {
        // Mode édition : mettre à jour le groupe de sites existant
        const updatedGroupSites: GroupSites = {
          ...this.currentGroupSites,
          nom: formData.nom,
          type: formData.type,
          sites: selectedSites,
          is_active: true
        };
        console.log('Groupe de sites mis à jour:', updatedGroupSites);
        // TODO: Implémenter l'appel API pour mettre à jour le groupe de sites
      } else {
        // Mode création : créer un nouveau groupe de sites
        const newGroupSites: GroupSites = {
          id: this.generateId(),
          nom: formData.nom,
          type: formData.type,
          sites: selectedSites,
          is_active: true
        };
        console.log('Nouveau groupe de sites créé:', newGroupSites);
        // TODO: Implémenter l'appel API pour créer le groupe de sites
      }
      
      this.showSuccessMessage();
    } else {
      this.markFormGroupTouched(this.groupSitesForm);
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
    const message = this.isEditMode ? 'Groupe de sites mis à jour avec succès!' : 'Groupe de sites créé avec succès!';
    console.log(message);
    // TODO: Implémenter l'affichage d'un message de succès dans l'UI
  }

  resetForm(): void {
    this.groupSitesForm.reset();
    this.groupSitesForm.patchValue({
      selectedSites: []
    });
  }

  generateId(): string {
    const prefix = 'GROUP';
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
  }

  onGoBack(): void {
    this.goBack.emit();
  }

  // Méthodes utilitaires pour l'affichage
  getSiteDisplayName(site: Site): string {
    return `${site.name} (${site.city})`;
  }

  getSelectedSitesCount(): number {
    const selectedSites = this.groupSitesForm.get('selectedSites')?.value || [];
    return selectedSites.length;
  }

  getSelectedSitesNames(): string {
    const selectedSiteIds = this.groupSitesForm.get('selectedSites')?.value || [];
    const selectedSites = this.availableSites.filter(site => 
      selectedSiteIds.includes(site.id)
    );
    return selectedSites.map(site => site.name).join(', ');
  }

  // Gestion des erreurs de validation
  getFieldError(fieldName: string): string {
    const field = this.groupSitesForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return 'Ce champ est obligatoire';
      }
      if (field.errors['minlength']) {
        return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
      }
      if (field.errors['minSites']) {
        return field.errors['minSites'].message;
      }
    }
    return '';
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.groupSitesForm.get(fieldName);
    return !!(field && field.errors && field.touched);
  }
}