import { Component, OnInit, OnDestroy, HostListener, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MaterialModule } from '../../shared/material-module';
import { Router, ActivatedRoute } from '@angular/router';

// Import des composants de pages
import { ArticlesListComponent } from '../../pages/articles-list/articles-list.component';
import { CreateArticleComponent } from '../../pages/create-article/create-article.component';
import { SuppliersComponent } from '../../pages/suppliers/suppliers.component';
import { ReceptionTrunkComponent } from '../../pages/reception-trunk/reception-trunk.component';
import { TrunkSelectionComponent } from '../../pages/trunk-selection/trunk-selection.component';
import { TrunkListComponent } from '../../pages/trunk-list/trunk-list.component';
import { CreateAssortmentsComponent } from '../../pages/create-assortments/create-assortments.component';
import { EnrichmentAssortmentComponent } from '../../pages/enrichment-assortment/enrichment-assortment.component';
import { TrunkAssortmentsComponent } from '../../pages/trunk-assortments/trunk-assortments.component';
import { AlertPopupComponent, AlertData } from '../../shared/components/alert-popup/alert-popup.component';
import { CreateTrunkComponent } from '../../pages/create-trunk/create-trunk.component';
import { TrunkManagementComponent } from '../../pages/trunk-management/trunk-management.component';
import { TrunkControlComponent } from '../../pages/trunk-control/trunk-control.component';
import { DataPageComponent } from '../../pages/data-page/data-page.component';
import { AssortmentsBulkManagementComponent } from '../../pages/assortments-bulk-management/assortments-bulk-management.component';
import { ReferencementComponent } from '../../pages/referencement/referencement.component';
import { ReferencementReviewComponent } from '../../pages/referencement-review/referencement-review.component';
import { SupplierImportComponent } from '../../pages/supplier-import/supplier-import.component';
import { ReferencementArticleComponent } from '../../pages/referencement-article/referencement-article.component';

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
  assortments: boolean;
  returns: boolean;
  finance: boolean;
  admin: boolean;
  store: boolean;
}

  @Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [
      CommonModule, 
      MaterialModule, 
      FormsModule,
      ArticlesListComponent,  // Import du composant liste des articles
      CreateArticleComponent,  // AJOUT de l'import du composant création
      SuppliersComponent,
      ReceptionTrunkComponent,
      TrunkSelectionComponent,  // Import du composant sélection de tronc
      TrunkListComponent,  // Import du composant liste des troncs
      CreateAssortmentsComponent,
      EnrichmentAssortmentComponent,
      TrunkAssortmentsComponent,
      CreateTrunkComponent,
      TrunkManagementComponent,
      TrunkControlComponent,
      DataPageComponent,
      AssortmentsBulkManagementComponent,
      ReferencementComponent,
      ReferencementReviewComponent,
      SupplierImportComponent,
      ReferencementArticleComponent,
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
  isMenuPinned: boolean = false;
  menuSearchQuery: string = '';
  expandedGroups: ExpandedGroups = {
    sales: false,
    purchases: false,
    inventory: false,
    products: true,
    assortments: false,
    returns: false,
    finance: false,
    admin: false,
    store: false
  };
  
  // AJOUT : État de navigation
  suppliersCreateMode: boolean = false;
  referencementSupplierOnly: boolean = false;
  currentView: 'dashboard' | 'articles' | 'articles-list' | 'create-article' | 'edit-article' | 'create-order' | 'suppliers' | 'reception-trunk' | 'trunk-selection' | 'trunk-list' | 'create-assortments' | 'enrichment-assortment' | 'trunk-assortments' | 'create-trunk' | 'trunk-management' | 'trunk-control' | 'assortments-bulk-management' | 'data-page' | 'referencement' | 'referencement-review' | 'supplier-import' | 'referencement-article' | 'local-articles' = 'dashboard';
  
  // NOUVEAU : Mode focus
  isFocusMode: boolean = false;
  
  // Responsive
  isMobile: boolean = false;
  
  // UI State
  isDarkMode: boolean = false;
  searchQuery: string = '';
  selectedStore: string = 'store1';
  selectedLanguage: string = 'fr';
  userName: string = 'Lukas';
  notificationCount: number = 5;

  // NOUVEAU : Gestion du popup d'alerte
  showAlert: boolean = false;
  alertData: AlertData = {
    title: 'Information Importante',
    message: 'Attention, les tarifs passent sur le plan SOLDES à partir du mercredi 25 juin sur tous les magasins.',
    type: 'warning',
    showDontShowAgain: true
  };

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
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    private route: ActivatedRoute
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

    // NOUVEAU : Afficher l'alerte au démarrage (si pas déjà masquée)
    this.checkAndShowAlert();

    // NOUVEAU : Écouter les changements de route
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateCurrentViewFromRoute();
    });

    // Initialiser la vue basée sur la route actuelle
    this.updateCurrentViewFromRoute();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * NOUVELLE : Vérifier et afficher l'alerte de démarrage
   */
  private checkAndShowAlert(): void {
    const alertDismissed = localStorage.getItem('alert-tarifs-soldes-dismissed');
    
    // Si l'alerte n'a pas été masquée définitivement, l'afficher
    if (!alertDismissed) {
      // Petit délai pour que l'interface soit chargée
      setTimeout(() => {
        this.showAlert = true;
      }, 1000);
    }
  }

  /**
   * NOUVELLE : Fermer le popup d'alerte
   */
  onCloseAlert(): void {
    this.showAlert = false;
  }

  /**
   * NOUVELLE : Masquer définitivement l'alerte
   */
  onDontShowAlertAgain(): void {
    localStorage.setItem('alert-tarifs-soldes-dismissed', 'true');
    this.showAlert = false;
  }

  /**
   * NOUVELLE : Mettre à jour la vue basée sur la route actuelle
   */
  private updateCurrentViewFromRoute(): void {
    const url = this.router.url;
    console.log('Route actuelle:', url);
    
    if (url.includes('/referencement/review')) {
      this.currentView = 'referencement-review';
      this.isFocusMode = false;
    } else if (url.includes('/referencement-article')) {
      this.currentView = 'referencement-article';
      this.isFocusMode = false;
    } else if (url.includes('/referencement')) {
      this.currentView = 'referencement';
      this.isFocusMode = false;
      const supplierOnlyParam = this.route.snapshot.queryParamMap.get('supplierOnly');
      this.referencementSupplierOnly = supplierOnlyParam === '1' || supplierOnlyParam === 'true';
    } else 
    if (url.includes('/trunk-selection')) {
      this.currentView = 'trunk-selection';
      this.isFocusMode = false;
    } else if (url.includes('/trunk-assortments')) {
      this.currentView = 'trunk-assortments';
      this.isFocusMode = false;
    } else if (url.includes('/assortment-trunk')) {
      // ancienne route, ne rien faire
      this.currentView = 'trunk-management';
      this.isFocusMode = false;
    } else if (url.includes('/add-assortments')) {
      // ancienne page, basculer vers create-assortments
      this.currentView = 'create-assortments';
      this.isFocusMode = false;
    } else if (url.includes('/reception-trunk')) {
      this.currentView = 'reception-trunk';
      this.isFocusMode = false;
    } else if (url.includes('/create-assortments')) {
      this.currentView = 'create-assortments';
      this.isFocusMode = false;
    } else if (url.includes('/enrichment-assortment')) {
      this.currentView = 'enrichment-assortment';
      this.isFocusMode = false;
    } else if (url.includes('/create-trunk')) {
      this.currentView = 'create-trunk';
      this.isFocusMode = false;
    } else if (url.includes('/trunk-management')) {
      this.currentView = 'trunk-management';
      this.isFocusMode = false;
    } else if (url.includes('/trunk-control')) {
      this.currentView = 'trunk-control';
      this.isFocusMode = false;
    } else if (url.includes('/data-page')) {
      this.currentView = 'data-page';
      this.isFocusMode = false;
    } else if (url.includes('/assortments-bulk')) {
      this.currentView = 'assortments-bulk-management';
      this.isFocusMode = false;
    } else if (url.includes('/supplier-import')) {
      this.currentView = 'supplier-import';
      this.isFocusMode = false;
    } else if (url.includes('/articles')) {
      this.currentView = 'articles';
      this.isFocusMode = false;
    } else if (url.includes('/create-article')) {
      this.currentView = 'create-article';
      this.isFocusMode = true;
    } else if (url.includes('/referencement-article')) {
      this.currentView = 'referencement-article';
      this.isFocusMode = false;
    } else {
      this.currentView = 'dashboard';
      this.isFocusMode = false;
    }
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
        this.currentView = 'articles';
        this.isFocusMode = false;
        break;
      case 'local-articles':
        this.currentView = 'local-articles';
        this.isFocusMode = false;
        break;
      case 'create-article':
        this.currentView = 'create-article';
        this.isFocusMode = true; // Création = mode focus
        break;
      case 'suppliers':
        this.currentView = 'suppliers';
        this.isFocusMode = false;
        this.suppliersCreateMode = false;
        break;
      case 'suppliers-create':
        this.currentView = 'suppliers';
        this.isFocusMode = true;
        this.suppliersCreateMode = true;
        break;
      case 'assortment-trunk':
        // route supprimée, rediriger vers gestion des troncs
        this.currentView = 'trunk-management';
        this.isFocusMode = false;
        this.router.navigate(['/trunk-management']);
        break;
      case 'trunk-list':
        this.currentView = 'trunk-list';
        this.isFocusMode = false;
        break;
      case 'reception-trunk':
        this.currentView = 'reception-trunk';
        this.isFocusMode = false;
        break;
      case 'trunk-selection':
        this.currentView = 'trunk-selection';
        this.isFocusMode = false;
        break;
      case 'add-assortments':
        // page supprimée, rediriger vers création d’assortiments
        this.currentView = 'create-assortments';
        this.isFocusMode = false;
        this.router.navigate(['/create-assortments']);
        break;
      case 'create-assortments':
        this.currentView = 'create-assortments';
        this.isFocusMode = false;
        break;
      case 'enrichment-assortment':
        this.currentView = 'enrichment-assortment';
        this.isFocusMode = false;
        break;
      case 'create-trunk':
        this.currentView = 'create-trunk';
        this.isFocusMode = false;
        break;
      case 'trunk-management':
        this.currentView = 'trunk-management';
        this.isFocusMode = false;
        break;
      case 'data-page':
        this.currentView = 'data-page';
        this.isFocusMode = false;
        break;
      case 'assortments-bulk':
        this.currentView = 'assortments-bulk-management';
        this.isFocusMode = false;
        break;
      case 'supplier-import':
        this.currentView = 'supplier-import';
        this.isFocusMode = false;
        this.router.navigate(['/supplier-import']);
        break;
      case 'referencement':
        this.currentView = 'referencement';
        this.isFocusMode = false;
        this.referencementSupplierOnly = false;
        break;
      case 'referencement-article':
        this.currentView = 'referencement-article';
        this.isFocusMode = false;
        break;
      case 'referencement-supplier':
        this.currentView = 'referencement';
        this.isFocusMode = false;
        this.referencementSupplierOnly = true;
        break;
      case 'dashboard':
      default:
        this.currentView = 'dashboard';
        this.isFocusMode = false;
        break;
    }
  }

  /**
   * NOUVELLE : Sortie du mode focus
   */
  exitFocusMode(): void {
    this.isFocusMode = false;
    this.currentView = 'dashboard';
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
