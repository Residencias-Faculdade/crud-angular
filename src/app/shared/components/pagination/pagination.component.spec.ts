import { TestBed } from '@angular/core/testing';

import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PaginationComponent] }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PaginationComponent);
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.componentRef.setInput('pageNumbers', [1, 2, 3, 4, 5]);
    fixture.componentRef.setInput('hasPrev', false);
    fixture.componentRef.setInput('hasNext', true);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should emit pageChange', () => {
    const fixture = TestBed.createComponent(PaginationComponent);
    fixture.componentRef.setInput('currentPage', 2);
    fixture.componentRef.setInput('totalPages', 3);
    fixture.componentRef.setInput('pageNumbers', [1, 2, 3]);
    fixture.componentRef.setInput('hasPrev', true);
    fixture.componentRef.setInput('hasNext', true);
    fixture.detectChanges();
    const spy = vi.spyOn(fixture.componentInstance.pageChange, 'emit');
    fixture.componentInstance.pageChange.emit(3);
    expect(spy).toHaveBeenCalledWith(3);
  });

  it('should emit prev and next', () => {
    const fixture = TestBed.createComponent(PaginationComponent);
    fixture.componentRef.setInput('currentPage', 2);
    fixture.componentRef.setInput('totalPages', 3);
    fixture.componentRef.setInput('pageNumbers', [1, 2, 3]);
    fixture.componentRef.setInput('hasPrev', true);
    fixture.componentRef.setInput('hasNext', true);
    fixture.detectChanges();
    const prevSpy = vi.spyOn(fixture.componentInstance.prev, 'emit');
    const nextSpy = vi.spyOn(fixture.componentInstance.next, 'emit');
    fixture.componentInstance.prev.emit();
    fixture.componentInstance.next.emit();
    expect(prevSpy).toHaveBeenCalled();
    expect(nextSpy).toHaveBeenCalled();
  });
});
