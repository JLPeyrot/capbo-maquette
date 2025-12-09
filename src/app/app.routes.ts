import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent
  },
  {
    path: 'dashboard',
    component: MainLayoutComponent
  },
  {
    path: 'referencement',
    component: MainLayoutComponent
  },
  {
    path: 'referencement/review',
    redirectTo: 'referencement'
  },
  {
    path: 'referencement-article',
    component: MainLayoutComponent
  },
  {
    path: 'create-article',
    component: MainLayoutComponent
  },
  {
    path: 'reception-trunk',
    component: MainLayoutComponent
  },
  {
    // page supprimée
    path: 'trunk-selection',
    redirectTo: 'trunk-management'
  },
  {
    path: 'assortment-trunk',
    redirectTo: 'trunk-management'
  },
  {
    path: 'add-assortments',
    redirectTo: 'assortments-management'
  },
  {
    // page supprimée
    path: 'trunk-list',
    redirectTo: 'trunk-management'
  },
  // page supprimée: redirection
  {
    path: 'create-assortments',
    redirectTo: 'assortments-management'
  },
  {
    path: 'enrichment-assortment',
    redirectTo: 'assortments-management'
  },
  {
    // page supprimée
    path: 'trunk-assortments/:id',
    redirectTo: 'trunk-management'
  },
  {
    path: 'create-trunk',
    component: MainLayoutComponent
  },
  {
    path: 'trunk-management',
    component: MainLayoutComponent
  },
  {
    path: 'trunk-control/:trunkName',
    component: MainLayoutComponent
  },
  {
    path: 'trunk-control',
    component: MainLayoutComponent
  },
  {
    path: 'data-page',
    component: MainLayoutComponent
  },
  {
    path: 'assortments-bulk',
    component: MainLayoutComponent
  },
  {
    path: 'supplier-import',
    component: MainLayoutComponent
  },
  {
    path: 'articles',
    component: MainLayoutComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
