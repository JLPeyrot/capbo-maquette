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
    component: MainLayoutComponent
  },
  {
    path: 'add-assortments',
    component: MainLayoutComponent
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
    path: 'articles',
    component: MainLayoutComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
