import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { CreateArticleComponent } from './pages/create-article/create-article.component';

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
  // Ajoutez d'autres routes ici
  {
    path: '**',
    redirectTo: ''
  }
];