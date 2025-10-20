import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { CreateArticleComponent } from './pages/create-article/create-article.component';
import { AttributesListComponent } from './pages/attributes-list/attributes-list.component';


import { CreateSiteComponent } from './pages/create-site/create-site.component';
import { SitesListComponent } from './pages/sites-list/sites-list.component';
import { GroupSitesListComponent } from './pages/group-sites-list/group-sites-list.component';
import { CreateGroupSitesComponent } from './pages/create-group-sites/create-group-sites.component';
import { CategoriesListComponent } from './pages/categories-list/categories-list.component';

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
    component: CreateArticleComponent
  },
  {
    path: 'sites-list',
    component: SitesListComponent
  },
  {
    path: 'group-sites-list',
    component: GroupSitesListComponent
  },
  {
    path: 'create-site',
    component: CreateSiteComponent
  },
  {
    path: 'create-group-sites',
    component: CreateGroupSitesComponent
  },
  {
    path: 'edit-site/:id',
    component: CreateSiteComponent
  },
  {
    path: 'edit-group-sites/:id',
    component: CreateGroupSitesComponent
  },
  {
    path: 'categories',
    component: CategoriesListComponent
  },
  {
    path: 'attributes-list',
    component: AttributesListComponent
  },


  // Ajoutez d'autres routes ici
  {
    path: '**',
    redirectTo: ''
  }
];