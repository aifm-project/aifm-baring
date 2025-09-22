import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OnlineSeminarComponent } from './online-seminar.component';

describe('OnlineSeminarComponent', () => {
  let component: OnlineSeminarComponent;
  let fixture: ComponentFixture<OnlineSeminarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OnlineSeminarComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(OnlineSeminarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});