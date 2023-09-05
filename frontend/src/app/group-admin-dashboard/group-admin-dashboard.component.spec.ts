import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupAdminDashboardComponent } from './group-admin-dashboard.component';

describe('GroupAdminDashboardComponent', () => {
  let component: GroupAdminDashboardComponent;
  let fixture: ComponentFixture<GroupAdminDashboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GroupAdminDashboardComponent]
    });
    fixture = TestBed.createComponent(GroupAdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
