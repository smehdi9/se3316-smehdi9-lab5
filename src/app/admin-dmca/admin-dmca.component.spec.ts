import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDmcaComponent } from './admin-dmca.component';

describe('AdminDmcaComponent', () => {
  let component: AdminDmcaComponent;
  let fixture: ComponentFixture<AdminDmcaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminDmcaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminDmcaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
