import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepartmentsTable } from './departments-table';

describe('DepartmentsTable', () => {
  let component: DepartmentsTable;
  let fixture: ComponentFixture<DepartmentsTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepartmentsTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DepartmentsTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
