import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewPanelComponent } from './review-panel.component';

describe('ReviewPanelComponent', () => {
  let component: ReviewPanelComponent;
  let fixture: ComponentFixture<ReviewPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReviewPanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
