import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { CreateSiteComponent } from './create-site.component';

describe('CreateSiteComponent', () => {
  let component: CreateSiteComponent;
  let fixture: ComponentFixture<CreateSiteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        FormsModule,
        NoopAnimationsModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        MatSlideToggleModule,
        CreateSiteComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateSiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with default values', () => {
    expect(component.siteForm).toBeDefined();
    expect(component.siteForm.get('country')?.value).toBe('fr');
    expect(component.siteForm.get('is_active')?.value).toBe(true);
  });

  it('should mark form as invalid when required fields are empty', () => {
    component.siteForm.setValue({
      name: '',
      address: '',
      type: '',
      city: '',
      postal_code: '',
      country: '',
      phone: '',
      email: '',
      is_active: true
    });
    
    expect(component.siteForm.valid).toBeFalsy();
  });

  it('should mark form as valid when all required fields are filled correctly', () => {
    component.siteForm.setValue({
      name: 'Test Site',
      address: '123 Test Street',
      type: 'store',
      city: 'Test City',
      postal_code: '12345',
      country: 'fr',
      phone: '+33123456789',
      email: 'test@example.com',
      is_active: true
    });
    
    expect(component.siteForm.valid).toBeTruthy();
  });

  it('should validate email format', () => {
    const emailControl = component.siteForm.get('email');
    
    emailControl?.setValue('invalid-email');
    expect(emailControl?.valid).toBeFalsy();
    
    emailControl?.setValue('valid@example.com');
    expect(emailControl?.valid).toBeTruthy();
  });

  it('should validate postal code format', () => {
    const postalCodeControl = component.siteForm.get('postal_code');
    
    postalCodeControl?.setValue('123');
    expect(postalCodeControl?.valid).toBeFalsy();
    
    postalCodeControl?.setValue('12345');
    expect(postalCodeControl?.valid).toBeTruthy();
  });

  it('should emit goBack event when onGoBack is called', () => {
    spyOn(component.goBack, 'emit');
    component.onGoBack();
    expect(component.goBack.emit).toHaveBeenCalled();
  });

  it('should reset form to initial values when resetForm is called', () => {
    component.siteForm.setValue({
      name: 'Test Site',
      address: '123 Test Street',
      type: 'store',
      city: 'Test City',
      postal_code: '12345',
      country: 'de',
      phone: '+33123456789',
      email: 'test@example.com',
      is_active: false
    });
    
    component.resetForm();
    
    expect(component.siteForm.get('name')?.value).toBe('');
    expect(component.siteForm.get('country')?.value).toBe('fr');
    expect(component.siteForm.get('is_active')?.value).toBe(true);
  });
});