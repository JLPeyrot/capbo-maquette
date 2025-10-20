import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { User } from '../users-list/users-list.component';

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
import { MatChipsModule } from '@angular/material/chips';

interface Role {
  id: string;
  name: string;
  description: string;
}

interface Site {
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

@Component({
  selector: 'app-create-user',
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
    MatChipsModule
  ],
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss']
})
export class CreateUserComponent implements OnInit {
  @Output() goBack = new EventEmitter<void>();
  @Input() isFocusMode: boolean = false;
  @Input() isEditMode: boolean = false;
  @Input() userId: string | null = null;

  currentUser: User | null = null;
  
  userForm!: FormGroup;
  
  // Données de référence (mock)
  availableRoles: Role[] = [
    { id: 'admin', name: 'Administrateur', description: 'Accès complet au système' },
    { id: 'manager', name: 'Manager', description: 'Gestion des équipes et des projets' },
    { id: 'user', name: 'Utilisateur', description: 'Accès standard aux fonctionnalités' },
    { id: 'viewer', name: 'Lecteur', description: 'Accès en lecture seule' },
    { id: 'supplier', name: 'Fournisseur', description: 'Gestion des commandes fournisseurs' },
    { id: 'client', name: 'Client', description: 'Accès client aux commandes' }
  ];

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
      address: '789 Boulevard de la Liberté',
      type: 'Bureau',
      city: 'Marseille',
      postal_code: '13001',
      country: 'France',
      phone: '+33 4 91 54 32 10',
      email: 'marseille.bureau@example.com',
      is_active: true
    },
    {
      id: 'site-004',
      name: 'Usine Toulouse',
      address: '321 Rue de l\'Industrie',
      type: 'Usine',
      city: 'Toulouse',
      postal_code: '31000',
      country: 'France',
      phone: '+33 5 61 23 45 67',
      email: 'toulouse.usine@example.com',
      is_active: true
    },
    {
      id: 'site-005',
      name: 'Centre Commercial Lille',
      address: '654 Avenue du Commerce',
      type: 'Centre commercial',
      city: 'Lille',
      postal_code: '59000',
      country: 'France',
      phone: '+33 3 20 12 34 56',
      email: 'lille.centre@example.com',
      is_active: false
    }
  ];

  constructor(
    private fb: FormBuilder
  ) {}

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      if (confirmPassword?.errors?.['passwordMismatch']) {
        delete confirmPassword.errors['passwordMismatch'];
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
    }
    return null;
  }

  ngOnInit(): void {
    this.initForm();
    if (this.isEditMode && this.userId) {
      this.loadUserData();
    }
  }

  loadUserData(): void {
    if (this.userId) {
      // Simulation de récupération des données de l'utilisateur
      this.currentUser = this.getMockUserById(this.userId);
      if (this.currentUser) {
        this.populateForm(this.currentUser);
      }
    }
  }

  getMockUserById(id: string): User | null {
    // Simulation des données - en réalité, ceci viendrait d'un service
    const mockUsers: User[] = [
      {
        id: '1',
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@example.com',
        password: '••••••••',
        roles: ['admin', 'manager'],
        sites: ['site-001', 'site-002'],
        is_active: true
      },
      {
        id: '2',
        nom: 'Martin',
        prenom: 'Marie',
        email: 'marie.martin@example.com',
        password: '••••••••',
        roles: ['user'],
        sites: ['site-003'],
        is_active: true
      }
    ];

    return mockUsers.find(user => user.id === id) || null;
  }

  populateForm(user: User): void {
    this.userForm.patchValue({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      password: user.password,
      confirmPassword: user.password,
      roles: user.roles,
      sites: user.sites || [],
      is_active: user.is_active
    });
  }

  initForm(): void {
    this.userForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      roles: [[], [Validators.required]],
      sites: [[]],
      is_active: [true]
    }, { validators: this.passwordMatchValidator });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      const formData = this.userForm.value;
      
      const userData: User = {
        id: this.isEditMode && this.currentUser ? this.currentUser.id : this.generateId(),
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        password: formData.password,
        roles: formData.roles,
        sites: formData.sites,
        is_active: formData.is_active
      };

      console.log('Données utilisateur:', userData);
      
      // Ici, vous appelleriez votre service pour sauvegarder
      // this.userService.createUser(userData).subscribe(...);
      
      // Simulation d'une sauvegarde réussie
      setTimeout(() => {
        this.showSuccessMessage();
        if (!this.isEditMode) {
          this.resetForm();
        }
      }, 1000);
    } else {
      this.markFormGroupTouched(this.userForm);
    }
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  showSuccessMessage(): void {
    const action = this.isEditMode ? 'modifié' : 'créé';
    alert(`Utilisateur ${action} avec succès !`);
    // En réalité, utilisez un service de notification plus sophistiqué
  }

  resetForm(): void {
    this.userForm.reset({
      nom: '',
      prenom: '',
      email: '',
      roles: [],
      is_active: true
    });
  }

  generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  onGoBack(): void {
    this.goBack.emit();
  }

  getRoleName(roleId: string): string {
    const role = this.availableRoles.find(r => r.id === roleId);
    return role ? role.name : roleId;
  }

  removeRole(roleId: string): void {
    const currentRoles = this.userForm.get('roles')?.value || [];
    const updatedRoles = currentRoles.filter((id: string) => id !== roleId);
    this.userForm.get('roles')?.setValue(updatedRoles);
  }

  getSiteName(siteId: string): string {
    const site = this.availableSites.find(s => s.id === siteId);
    return site ? site.name : siteId;
  }

  removeSite(siteId: string): void {
    const currentSites = this.userForm.get('sites')?.value || [];
    const updatedSites = currentSites.filter((id: string) => id !== siteId);
    this.userForm.get('sites')?.setValue(updatedSites);
  }

  getRoleIcon(roleId: string): string {
    const roleIcons: { [key: string]: string } = {
      'admin': 'admin_panel_settings',
      'manager': 'supervisor_account',
      'user': 'person',
      'viewer': 'visibility',
      'supplier': 'local_shipping',
      'client': 'shopping_cart'
    };
    return roleIcons[roleId] || 'person';
  }
}