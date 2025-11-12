import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardNavigationButton } from './dashboard-navigation-button';

describe('DashboardNavigationButton', () => {
  let component: DashboardNavigationButton;
  let fixture: ComponentFixture<DashboardNavigationButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardNavigationButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardNavigationButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
