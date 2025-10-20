import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateGroupSitesComponent } from './create-group-sites.component';

describe('CreateGroupSitesComponent', () => {
  let component: CreateGroupSitesComponent;
  let fixture: ComponentFixture<CreateGroupSitesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateGroupSitesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateGroupSitesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});