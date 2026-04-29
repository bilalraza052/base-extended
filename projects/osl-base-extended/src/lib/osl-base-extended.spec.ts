import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OslBaseExtended } from './osl-base-extended';

describe('OslBaseExtended', () => {
  let component: OslBaseExtended;
  let fixture: ComponentFixture<OslBaseExtended>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OslBaseExtended],
    }).compileComponents();

    fixture = TestBed.createComponent(OslBaseExtended);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
