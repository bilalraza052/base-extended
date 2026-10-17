import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShBaseExtended } from './sh-base-extended';

describe('ShBaseExtended', () => {
  let component: ShBaseExtended;
  let fixture: ComponentFixture<ShBaseExtended>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShBaseExtended],
    }).compileComponents();

    fixture = TestBed.createComponent(ShBaseExtended);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
