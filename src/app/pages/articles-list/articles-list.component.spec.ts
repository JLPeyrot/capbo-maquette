import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { ArticlesListComponent } from './articles-list.component';

describe('ArticlesListComponent', () => {
  let component: ArticlesListComponent;
  let fixture: ComponentFixture<ArticlesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ArticlesListComponent,
        NoopAnimationsModule,
        FormsModule,
        RouterTestingModule
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArticlesListComponent);
    component = fixture.componentInstance;
    component.isStoreContext = true;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load articles on init', () => {
    expect(component.articles.length).toBeGreaterThan(0);
  });

  it('should filter articles by search query', () => {
    component.filters.search = 'test';
    component.applyFilters();
    expect(component.filteredArticles).toBeDefined();
  });

  it('should reset filters', () => {
    component.filters.search = 'test';
    component.filters.famille = 'Vêtements';
    component.resetFilters();
    
    expect(component.filters.search).toBe('');
    expect(component.filters.famille).toBe('');
  });

  it('should toggle article selection', () => {
    const article = component.articles[0];
    expect(component.isSelected(article)).toBeFalsy();
    
    component.toggleSelection(article);
    expect(component.isSelected(article)).toBeTruthy();
    
    component.toggleSelection(article);
    expect(component.isSelected(article)).toBeFalsy();
  });
});
