import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { CreateArticleComponent } from './pages/create-article/create-article.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent, CreateArticleComponent],
  template: `
    <div class="app-root">
      <!-- Dashboard principal -->
      <app-main-layout 
        *ngIf="currentView === 'dashboard'"
        (navigateToCreateArticle)="showCreateArticle()">
      </app-main-layout>
      
      <!-- Formulaire de création d'article -->
      <app-create-article 
        *ngIf="currentView === 'create-article'"
        (goBack)="showDashboard()">
      </app-create-article>
    </div>
  `,
  styles: [`
    .app-root {
      height: 100vh;
      overflow: hidden;
    }
  `]
})
export class AppComponent {
  currentView: 'dashboard' | 'create-article' = 'dashboard';

  showCreateArticle(): void {
    this.currentView = 'create-article';
  }

  showDashboard(): void {
    this.currentView = 'dashboard';
  }
}