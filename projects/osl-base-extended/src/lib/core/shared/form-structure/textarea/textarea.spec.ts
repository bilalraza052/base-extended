import { ComponentFixture, TestBed } from '@angular/core/testing';

import {  Osltextarea } from './textarea';

describe('Input', () => {
  let component: Osltextarea;
  let fixture: ComponentFixture<Osltextarea>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Osltextarea],
    }).compileComponents();

    fixture = TestBed.createComponent(Osltextarea);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
