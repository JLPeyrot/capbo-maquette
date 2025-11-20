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
    component: MainLayoutComponent
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
    path: 'trunk-selection',
    component: MainLayoutComponent
  },
  {
    path: 'assortment-trunk',
    redirectTo: 'trunk-management'
  },
  {
    path: 'add-assortments',
    redirectTo: 'create-assortments'
  },
  {
    path: 'trunk-list',
    component: MainLayoutComponent
  },
  {
    path: 'create-assortments',
    component: MainLayoutComponent
  },
  {
    path: 'enrichment-assortment',
    component: MainLayoutComponent
  },
  {
    path: 'trunk-assortments/:id',
    component: MainLayoutComponent
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
