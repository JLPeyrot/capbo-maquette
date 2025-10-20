import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupSitesListComponent } from './group-sites-list.component';

describe('GroupSitesListComponent', () => {
  let component: GroupSitesListComponent;
  let fixture: ComponentFixture<GroupSitesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupSitesListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupSitesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});