import { Component, OnInit, OnDestroy, HostListener, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MaterialModule } from '../../shared/material-module';

// AJOUT DE L'IMPORT
import { ArticlesListComponent } from '../../pages/articles-list/articles-list.component';
import { CreateArticleComponent } from '../../pages/create-article/create-article.component';
import { AttributesListComponent } from '../../pages/attributes-list/attributes-list.component';
import { CreateAttributeComponent } from '../../pages/create-attribute/create-attribute.component';
import { SitesListComponent } from '../../pages/sites-list/sites-list.component';
import { CreateSiteComponent } from '../../pages/create-site/create-site.component';
import { GroupSitesListComponent } from '../../pages/group-sites-list/group-sites-list.component';
import { CreateGroupSitesComponent } from '../../pages/create-group-sites/create-group-sites.component';
import { UsersListComponent } from '../../pages/users-list/users-list.component';
import { CreateUserComponent } from '../../pages/create-user/create-user.component';
import { SuppliersListComponent } from '../../pages/suppliers-list/suppliers-list.component';
import { CreateSupplierComponent } from '../../pages/create-supplier/create-supplier.component';
import { CategoriesListComponent } from '../../pages/categories-list/categories-list.component';
import { VatsListComponent } from '../../pages/vats-list/vats-list.component';
import { CreateVatComponent } from '../../pages/create-vat/create-vat.component';
import { CurrenciesListComponent } from '../../pages/currencies-list/currencies-list.component';
import { CreateCurrencyComponent } from '../../pages/create-currency/create-currency.component';
import { MasterDataComponent } from '../../pages/master-data/master-data.component';

import { AlertPopupComponent } from '../../shared/components/alert-popup/alert-popup.component';

interface Notification {
  id: number;
  type: 'info' | 'warning' | 'error' | 'success';
  icon: string;
  title: string;
  message: string;
  time: string;
}

interface ExpandedGroups {
  sales: boolean;
  purchases: boolean;
  inventory: boolean;
  products: boolean;
  returns: boolean;
  finance: boolean;
  admin: boolean;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, 
    MaterialModule, 
    FormsModule,
    ArticlesListComponent,  // Import de la liste d'articles
    CreateArticleComponent,  // AJOUT de l'import du composant création
    AttributesListComponent,  // Import de la liste d'attributs
    CreateAttributeComponent, // Import du composant de création d'attribut
    SitesListComponent,     // Import de la liste des sites
    CreateSiteComponent,    // Import du composant de création de site
    GroupSitesListComponent, // Import de la liste des groupes de sites
    CreateGroupSitesComponent, // Import du composant de création de groupe de sites
    UsersListComponent,     // Import de la liste des utilisateurs
    CreateUserComponent,    // Import du composant de création d'utilisateur
    SuppliersListComponent, // Import de la liste des fournisseurs
    CreateSupplierComponent, // Import du composant de création de fournisseur
    CategoriesListComponent, // Import de la liste des catégories
    VatsListComponent, // Import de la liste des TVA
    CreateVatComponent, // Import du composant de création de TVA
    CurrenciesListComponent, // Import de la liste des devises
    CreateCurrencyComponent, // Import du composant de création de devise
    MasterDataComponent, // Import du composant de données de base

    AlertPopupComponent  // NOUVEAU
  ],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.scss']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  @Output() navigateToCreateArticle = new EventEmitter<void>();
  
  private destroy$ = new Subject<void>();
  
  // Menu state
  isMenuOpen: boolean = false;
  menuSearchQuery: string = '';
  expandedGroups: ExpandedGroups = {
    sales: false,
    purchases: false,
    inventory: false,
    products: false,
    returns: false,
    finance: false,
    admin: false
  };
  
  // AJOUT : État de navigation
  currentView: 'dashboard' | 'articles-list' | 'create-article' | 'edit-article' | 'create-order' | 'sites-list' | 'create-site' | 'edit-site' | 'group-sites-list' | 'create-group-sites' | 'edit-group-sites' | 'users-list' | 'create-user' | 'edit-user' | 'suppliers-list' | 'create-supplier' | 'edit-supplier' | 'categories-list' | 'vats-list' | 'create-vat' | 'edit-vat' | 'currencies-list' | 'create-currency' | 'edit-currency' | 'master-data' | 'attributes-list' | 'create-attribute' = 'dashboard';
  
  // NOUVEAU : Mode focus
  isFocusMode: boolean = false;
  
  // NOUVEAU : ID du site en cours d'édition
  editingSiteId: string | null = null;
  
  // NOUVEAU : ID du groupe de sites en cours d'édition
  editingGroupSitesId: string | null = null;
  
  // NOUVEAU : ID de l'utilisateur en cours d'édition
  editingUserId: string | null = null;
  
  // NOUVEAU : ID du fournisseur en cours d'édition
  editingSupplierId: string | null = null;
  
  // NOUVEAU : ID de la TVA en cours d'édition
  editingVatId: string | null = null;
  
  // NOUVEAU : ID de la devise en cours d'édition
  editingCurrencyId: string | null = null;
  
  // NOUVEAU : ID de l'attribut en cours d'édition
  editingAttributeId: string | null = null;
  

  
  // Responsive
  isMobile: boolean = false;
  
  // UI State
  isDarkMode: boolean = false;
  searchQuery: string = '';
  selectedStore: string = 'store1';
  selectedLanguage: string = 'fr';
  userName: string = 'Sébastien';
  notificationCount: number = 5;
  // Mode Assortiments (pour masquer la case "Articles actifs uniquement" dans la liste Articles)
  assortmentsMode: boolean = false;

  // Mock data pour les notifications
  recentNotifications: Notification[] = [
    {
      id: 1,
      type: 'warning',
      icon: 'warning',
      title: 'Stock faible',
      message: 'Article "T-shirt Blanc M" - Stock critique (3 unités)',
      time: 'Il y a 5 min'
    },
    {
      id: 2,
      type: 'success',
      icon: 'check_circle',
      title: 'Commande validée',
      message: 'Commande #CMD-2024-001234 validée et expédiée',
      time: 'Il y a 15 min'
    },
    {
      id: 3,
      type: 'info',
      icon: 'local_shipping',
      title: 'Réception attendue',
      message: 'Livraison fournisseur ABC prévue demain 14h',
      time: 'Il y a 1h'
    },
    {
      id: 4,
      type: 'error',
      icon: 'error',
      title: 'Échec de paiement',
      message: 'Paiement client Martin (Facture #F-2024-5678) rejeté',
      time: 'Il y a 2h'
    },
    {
      id: 5,
      type: 'info',
      icon: 'inventory_2',
      title: 'Inventaire programmé',
      message: 'Inventaire physique prévu le 15/06 à 18h',
      time: 'Il y a 3h'
    }
  ];

  constructor(
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    // Détection mobile/desktop
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile = result.matches;
      });

    // Charger les préférences utilisateur
    this.loadUserPreferences();


  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Gestion du menu overlay
   */
  toggleMenu(): void {
    // Empêcher l'ouverture du menu en mode focus
    if (this.isFocusMode) return;
    
    this.isMenuOpen = !this.isMenuOpen;
    
    // Empêcher le scroll du body quand le menu est ouvert
    if (this.isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }

  closeMenu(): void {
    this.isMenuOpen = false;
    document.body.style.overflow = 'auto';
  }

  /**
   * Gestion des groupes de menu
   */
  toggleGroup(groupName: keyof ExpandedGroups): void {
    this.expandedGroups[groupName] = !this.expandedGroups[groupName];
  }

  /**
   * Navigation améliorée avec gestion du mode focus
   */
  navigateTo(route: string): void {
    console.log('Navigation vers:', route);
    this.closeMenu();
    
    // Gestion des différentes routes
    switch (route) {
      case 'articles':
        this.currentView = 'articles-list';
        this.isFocusMode = true; // MODIFIÉ : Liste en mode focus maintenant
        // S'assurer que le mode Assortiments est désactivé
        this.assortmentsMode = false;
        break;
      case 'assortments':
        this.currentView = 'articles-list';
        this.isFocusMode = true; // Afficher liste articles en mode focus
        // Activer le mode Assortiments
        this.assortmentsMode = true;
        break;
      case 'create-article':
        this.currentView = 'create-article';
        this.isFocusMode = true; // Création = mode focus
        break;
      case 'attributes':
        this.currentView = 'attributes-list';
        this.isFocusMode = true; // Liste des attributs en mode focus
        break;
      case 'create-attribute':
        this.currentView = 'create-attribute';
        this.isFocusMode = true; // Création d'attribut en mode focus
        break;
 
       case 'sites-list':
        this.currentView = 'sites-list';
        this.isFocusMode = true; // Liste des sites en mode focus
        break;
      case 'group-sites-list':
        this.currentView = 'group-sites-list';
        this.isFocusMode = true; // Liste des groupes de sites en mode focus
        break;
      case 'create-site':
        this.currentView = 'create-site';
        this.isFocusMode = true; // Création de site en mode focus
        break;
      case 'create-group-sites':
        this.currentView = 'create-group-sites';
        this.isFocusMode = true; // Création de groupe de sites en mode focus
        break;
      case 'edit-site':
        this.currentView = 'edit-site';
        this.isFocusMode = true; // Édition de site en mode focus
        break;
      case 'edit-group-sites':
        this.currentView = 'edit-group-sites';
        this.isFocusMode = true; // Édition de groupe de sites en mode focus
        break;
      case 'suppliers':
        this.currentView = 'suppliers-list';
        this.isFocusMode = true; // Liste des fournisseurs en mode focus
        break;
      case 'create-supplier':
        this.currentView = 'create-supplier';
        this.isFocusMode = true; // Création de fournisseur en mode focus
        break;
      case 'edit-supplier':
        this.currentView = 'edit-supplier';
        this.isFocusMode = true; // Édition de fournisseur en mode focus
        break;
      case 'users':
        this.currentView = 'users-list';
        this.isFocusMode = true; // Liste des utilisateurs en mode focus
        break;
      case 'create-user':
        this.currentView = 'create-user';
        this.isFocusMode = true; // Création d'utilisateur en mode focus
        break;
      case 'edit-user':
        this.currentView = 'edit-user';
        this.isFocusMode = true; // Édition d'utilisateur en mode focus
        break;
      case 'categories':
        this.currentView = 'categories-list';
        this.isFocusMode = true; // Liste des catégories en mode focus
        break;
      case 'vats':
        this.currentView = 'vats-list';
        this.isFocusMode = true; // Liste des TVA en mode focus
        break;
      case 'create-vat':
        this.currentView = 'create-vat';
        this.isFocusMode = true; // Création de TVA en mode focus
        break;
      case 'edit-vat':
        this.currentView = 'edit-vat';
        this.isFocusMode = true; // Édition de TVA en mode focus
        break;
      case 'currencies':
        this.currentView = 'currencies-list';
        this.isFocusMode = true; // Liste des devises en mode focus
        break;
      case 'create-currency':
        this.currentView = 'create-currency';
        this.isFocusMode = true; // Création de devise en mode focus
        break;
      case 'edit-currency':
        this.currentView = 'edit-currency';
        this.isFocusMode = true; // Édition de devise en mode focus
        break;
      case 'master-data':
        this.currentView = 'master-data';
        this.isFocusMode = true; // Données de base en mode focus
        break;
      default:
        this.currentView = 'dashboard';
        this.isFocusMode = false; // Dashboard = mode normal
        break;
    }
  }

  /**
   * NOUVELLE : Sortie du mode focus
   */
  exitFocusMode(): void {
    this.isFocusMode = false;
    this.currentView = 'dashboard';
    // Nettoyer le mode Assortiments
    this.assortmentsMode = false;
  }

  /**
   * Navigation vers l'édition d'un site avec ID
   */
  navigateToEditSite(siteId: string): void {
    console.log('Navigation vers édition du site:', siteId);
    this.closeMenu();
    this.currentView = 'edit-site';
    this.isFocusMode = true;
    // Stocker l'ID du site pour le passer au composant
    this.editingSiteId = siteId;
  }

  /**
   * NOUVELLE : Navigation vers l'édition d'un fournisseur
   */
  navigateToEditSupplier(supplierId: string): void {
    this.editingSupplierId = supplierId;
    this.currentView = 'edit-supplier';
    this.isFocusMode = true;
    console.log('Navigation vers édition fournisseur:', supplierId);
  }

  /**
   * NOUVELLE : Navigation vers l'édition d'un utilisateur
   */
  navigateToEditUser(userId: string): void {
    this.editingUserId = userId;
    this.currentView = 'edit-user';
    this.isFocusMode = true;
    console.log('Navigation vers édition utilisateur:', userId);
  }

  /**
   * NOUVELLE : Navigation vers l'édition d'une TVA
   */
  navigateToEditVat(vatId: string): void {
    this.editingVatId = vatId;
    this.currentView = 'edit-vat';
    this.isFocusMode = true;
    console.log('Navigation vers édition TVA:', vatId);
  }

  /**
   * NOUVELLE : Navigation vers l'édition d'une devise
   */
  navigateToEditCurrency(currencyId: string): void {
    this.editingCurrencyId = currencyId;
    this.currentView = 'edit-currency';
    this.isFocusMode = true;
    console.log('Navigation vers édition devise:', currencyId);
  }

  /**
   * NOUVELLE : Navigation vers l'édition d'un groupe de sites
   */
  navigateToEditGroupSites(groupSitesId: string): void {
    this.editingGroupSitesId = groupSitesId;
    this.currentView = 'edit-group-sites';
    this.isFocusMode = true;
    console.log('Navigation vers édition groupe de sites:', groupSitesId);
  }



  /**
   * Fermeture du menu avec Escape (sauf en mode focus)
   */
  @HostListener('document:keydown', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.isFocusMode) {
        // En mode focus, Escape fait sortir du mode focus
        this.exitFocusMode();
        
        // Réinitialiser les IDs d'édition
        if (this.currentView === 'edit-site' || this.currentView === 'edit-supplier' || this.currentView === 'edit-user' || this.currentView === 'edit-vat' || this.currentView === 'edit-group-sites') {
          this.editingSiteId = null;
          this.editingSupplierId = null;
          this.editingUserId = null;
          this.editingVatId = null;
          this.editingGroupSitesId = null;
        }
      } else if (this.isMenuOpen) {
        // Sinon, ferme le menu
        this.closeMenu();
      }
    }
  }

  /**
   * Toggle entre mode sombre et clair
   */
  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    
    if (this.isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }

  /**
   * Actions rapides du dashboard avec mode focus
   */
  quickAction(action: string): void {
    console.log('Action rapide:', action);
    
    switch (action) {
      case 'new-order':
        console.log('Navigation vers nouvelle commande');
        // TODO: Implémenter le mode focus pour les commandes
        // this.currentView = 'create-order';
        // this.isFocusMode = true;
        break;
      case 'new-product':
        this.currentView = 'create-article';
        this.isFocusMode = true; // Mode focus pour création
        break;
      case 'check-stock':
        console.log('Navigation vers consultation stock');
        // Ici on peut ajouter une autre page spécifique consultation stock
        break;
    }
  }

  /**
   * Charger les préférences utilisateur
   */
  private loadUserPreferences(): void {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.body.classList.add('dark-theme');
    }
  }
}