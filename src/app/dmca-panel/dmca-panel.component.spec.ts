import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DmcaPanelComponent } from './dmca-panel.component';

describe('DmcaPanelComponent', () => {
  let component: DmcaPanelComponent;
  let fixture: ComponentFixture<DmcaPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DmcaPanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DmcaPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
