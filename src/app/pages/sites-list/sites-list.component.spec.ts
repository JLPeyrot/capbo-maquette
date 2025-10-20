import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SitesListComponent } from './sites-list.component';

describe('SitesListComponent', () => {
  let component: SitesListComponent;
  let fixture: ComponentFixture<SitesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatInputModule,
        MatFormFieldModule,
        MatSelectModule,
        MatCheckboxModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatProgressSpinnerModule,
        FormsModule,
        ReactiveFormsModule,
        SitesListComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SitesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate mock data on init', () => {
    expect(component.sites.length).toBeGreaterThan(0);
  });

  it('should extract filter options from sites data', () => {
    component.extractFilterOptions();
    expect(component.typeOptions.length).toBeGreaterThan(0);
    expect(component.cityOptions.length).toBeGreaterThan(0);
    expect(component.countryOptions.length).toBeGreaterThan(0);
  });

  it('should reset filters when resetFilters is called', () => {
    // Set some filter values
    component.filters = {
      search: 'test',
      type: 'store',
      city: 'Paris',
      country: 'France',
      status: 'active'
    };

    component.resetFilters();
    
    expect(component.filters.search).toBe('');
    expect(component.filters.type).toBe('');
    expect(component.filters.city).toBe('');
    expect(component.filters.country).toBe('');
    expect(component.filters.status).toBe('');
  });

  it('should toggle selection of a site', () => {
    const testSite = component.sites[0];
    
    // Initially no sites should be selected
    expect(component.selectedSites.length).toBe(0);
    
    // Select a site
    component.toggleSelection(testSite);
    expect(component.selectedSites.length).toBe(1);
    expect(component.selectedSites[0].id).toBe(testSite.id);
    
    // Deselect the same site
    component.toggleSelection(testSite);
    expect(component.selectedSites.length).toBe(0);
  });

  it('should toggle selection of all sites', () => {
    // Select all sites
    component.toggleSelectAll(true);
    expect(component.selectedSites.length).toBe(component.sites.length);
    
    // Deselect all sites
    component.toggleSelectAll(false);
    expect(component.selectedSites.length).toBe(0);
  });

  it('should apply filters correctly', () => {
    // Generate mock data to ensure we have data to filter
    component.generateMockSites();
    
    // Get the first site to use its properties for filtering
    const testSite = component.sites[0];
    
    // Apply filter by type
    component.filters.type = testSite.type;
    component.applyFilters();
    
    // All filtered sites should have the selected type
    component.filteredSites.forEach(site => {
      expect(site.type).toBe(testSite.type);
    });
    
    // Reset and try another filter
    component.resetFilters();
    component.filters.city = testSite.city;
    component.applyFilters();
    
    // All filtered sites should have the selected city
    component.filteredSites.forEach(site => {
      expect(site.city).toBe(testSite.city);
    });
  });

  it('should emit createSite event when onCreateSite is called', () => {
    spyOn(component.createSite, 'emit');
    component.onCreateSite();
    expect(component.createSite.emit).toHaveBeenCalled();
  });
});