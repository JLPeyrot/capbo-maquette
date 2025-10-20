import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MaterialModule } from '../../shared/material-module';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  password: string;
  roles: string[];
  sites?: string[];
  is_active: boolean;
}

export interface UserFilters {
  search: string;
  role: string;
  is_active: boolean;
}

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, MatCheckboxModule, MatSortModule],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() isFocusMode: boolean = false;
  @Output() goBack = new EventEmitter<void>();
  @Output() createUser = new EventEmitter<void>();
  @Output() editUserEvent = new EventEmitter<string>();
  
  @ViewChild(MatSort) sort!: MatSort;
  
  private destroy$ = new Subject<void>();

  constructor(private paginatorIntl: MatPaginatorIntl) {
    // Configuration des labels français pour le paginator
    this.paginatorIntl.itemsPerPageLabel = 'Éléments par page :';
    this.paginatorIntl.nextPageLabel = 'Page suivante';
    this.paginatorIntl.previousPageLabel = 'Page précédente';
    this.paginatorIntl.firstPageLabel = 'Première page';
    this.paginatorIntl.lastPageLabel = 'Dernière page';
    this.paginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
      if (length === 0 || pageSize === 0) {
        return `0 sur ${length}`;
      }
      const startIndex = page * pageSize;
      const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
      return `${startIndex + 1} - ${endIndex} sur ${length}`;
    };
  }

  // États du composant
  isLoading = false;
  selectedUsers: User[] = [];
  
  // Filtres
  filters: UserFilters = {
    search: '',
    role: '',
    is_active: false
  };

  // Pagination
  pageSize = 25;
  currentPage = 0;
  totalUsers = 0;
  pageSizeOptions = [10, 25, 50, 100];

  // Data
  users: User[] = [];
  filteredUsers: User[] = [];
  dataSource = new MatTableDataSource<User>([]);
  
  // Options pour les filtres
  roleOptions: string[] = [];
  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'true', label: 'Actif' },
    { value: 'false', label: 'Inactif' }
  ];

  // Colonnes affichées
  displayedColumns: string[] = [
    'select',
    'user',
    'email',
    'roles',
    'is_active',
    'actions'
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  /**
   * Chargement des utilisateurs
   */
  loadUsers(): void {
    this.isLoading = true;
    
    // Simulation d'un appel API
    setTimeout(() => {
      this.users = this.generateMockUsers();
      this.extractFilterOptions();
      this.applyFilters();
      this.isLoading = false;
    }, 500);
  }

  /**
   * Génération de données de test
   */
  generateMockUsers(): User[] {
    return [
      {
        id: '1',
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@capbo.fr',
        password: '••••••••',
        roles: ['Admin', 'Gestionnaire'],
        sites: ['Magasin Paris Centre', 'Entrepôt Lyon'],
        is_active: true
      },
      {
        id: '2',
        nom: 'Martin',
        prenom: 'Marie',
        email: 'marie.martin@capbo.fr',
        password: '••••••••',
        roles: ['Utilisateur'],
        sites: ['Magasin Marseille'],
        is_active: true
      },
      {
        id: '3',
        nom: 'Bernard',
        prenom: 'Pierre',
        email: 'pierre.bernard@capbo.fr',
        password: '••••••••',
        roles: ['Gestionnaire'],
        sites: ['Entrepôt Lyon', 'Magasin Toulouse'],
        is_active: false
      },
      {
        id: '4',
        nom: 'Durand',
        prenom: 'Sophie',
        email: 'sophie.durand@capbo.fr',
        password: '••••••••',
        roles: ['Admin'],
        sites: ['Magasin Paris Centre', 'Magasin Marseille', 'Entrepôt Lyon'],
        is_active: true
      },
      {
        id: '5',
        nom: 'Moreau',
        prenom: 'Luc',
        email: 'luc.moreau@capbo.fr',
        password: '••••••••',
        roles: ['Utilisateur', 'Lecteur'],
        sites: ['Magasin Toulouse'],
        is_active: true
      }
    ];
  }

  /**
   * Extraction des options de filtres depuis les données
   */
  extractFilterOptions(): void {
    const allRoles = this.users.flatMap(user => user.roles);
    this.roleOptions = [...new Set(allRoles)].sort();
  }

  /**
   * Application des filtres
   */
  applyFilters(): void {
    this.filteredUsers = this.users.filter(user => {
      // Filtre de recherche
      const searchMatch = !this.filters.search || 
        user.nom.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        user.prenom.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        user.roles.some(role => role.toLowerCase().includes(this.filters.search.toLowerCase()));
      
      // Filtre par rôle
      const roleMatch = !this.filters.role || user.roles.includes(this.filters.role);
      
      // Filtre par statut actif
      const statusMatch = !this.filters.is_active || user.is_active;
      
      return searchMatch && roleMatch && statusMatch;
    });
    
    this.dataSource.data = this.filteredUsers;
    this.totalUsers = this.filteredUsers.length;
    this.currentPage = 0;
  }

  /**
   * Réinitialisation des filtres
   */
  resetFilters(): void {
    this.filters = {
      search: '',
      role: '',
      is_active: false
    };
    this.applyFilters();
  }

  /**
   * Édition d'un utilisateur
   */
  editUser(user: User): void {
    this.editUserEvent.emit(user.id);
  }

  viewDetails(user: User): void {
    console.log('Voir détails utilisateur:', user);
  }

  toggleActive(user: User): void {
    user.is_active = !user.is_active;
  }

  /**
   * Gestion de la sélection
   */
  toggleSelection(user: User): void {
    const index = this.selectedUsers.findIndex(s => s.id === user.id);
    if (index > -1) {
      this.selectedUsers.splice(index, 1);
    } else {
      this.selectedUsers.push(user);
    }
  }

  isSelected(user: User): boolean {
    return this.selectedUsers.some(s => s.id === user.id);
  }

  /**
   * Sélection/désélection de tous les utilisateurs de la page
   */
  toggleAll(): void {
    const pagedUsers = this.getPagedUsers();
    const allPagedSelected = this.areAllPagedUsersSelected();
    
    if (allPagedSelected) {
      // Désélectionner tous les utilisateurs de la page
      pagedUsers.forEach(user => {
        const index = this.selectedUsers.findIndex(s => s.id === user.id);
        if (index > -1) {
          this.selectedUsers.splice(index, 1);
        }
      });
    } else {
      // Sélectionner tous les utilisateurs de la page
      pagedUsers.forEach(user => {
        if (!this.isSelected(user)) {
          this.selectedUsers.push(user);
        }
      });
    }
  }

  /**
   * Obtenir les utilisateurs de la page courante
   */
  getPagedUsers(): User[] {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredUsers.slice(startIndex, endIndex);
  }

  /**
   * Vérifier si tous les utilisateurs de la page sont sélectionnés
   */
  areAllPagedUsersSelected(): boolean {
    const pagedUsers = this.getPagedUsers();
    return pagedUsers.length > 0 && pagedUsers.every(user => this.isSelected(user));
  }

  /**
   * Gestion du changement de page
   */
  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  /**
   * Retour à la page précédente
   */
  onGoBack(): void {
    this.goBack.emit();
  }

  /**
   * Création d'un nouvel utilisateur
   */
  onCreateUser(): void {
    this.createUser.emit();
  }

  /**
   * Actions en lot
   */
  deleteSelectedUsers(): void {
    console.log('Supprimer les utilisateurs sélectionnés:', this.selectedUsers);
  }

  exportSelectedUsers(): void {
    console.log('Exporter les utilisateurs sélectionnés:', this.selectedUsers);
  }

  /**
   * Supprimer un utilisateur
   */
  deleteUser(user: User): void {
    console.log('Supprimer utilisateur:', user);
  }

  /**
   * Obtenir le nom complet d'un utilisateur
   */
  getFullName(user: User): string {
    return `${user.prenom} ${user.nom}`;
  }

  /**
   * Obtenir les rôles sous forme de chaîne
   */
  getRolesString(user: User): string {
    return user.roles.join(', ');
  }

  /**
   * Méthodes utilitaires pour la pagination
   */
  getStartIndex(): number {
    return this.currentPage * this.pageSize + 1;
  }

  getEndIndex(): number {
    const endIndex = (this.currentPage + 1) * this.pageSize;
    return Math.min(endIndex, this.totalUsers);
  }
}