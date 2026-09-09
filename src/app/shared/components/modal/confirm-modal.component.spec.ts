import { TestBed } from '@angular/core/testing';

import { ConfirmModalComponent } from './confirm-modal.component';

describe('ConfirmModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ConfirmModalComponent] }).compileComponents();
  });

  it('should create hidden when closed', () => {
    const fixture = TestBed.createComponent(ConfirmModalComponent);
    fixture.componentRef.setInput('open', false);
    fixture.componentRef.setInput('title', 'Confirmar');
    fixture.componentRef.setInput('message', 'Tem certeza?');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal-overlay')).toBeNull();
  });

  it('should show when open', () => {
    const fixture = TestBed.createComponent(ConfirmModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', 'Confirmar exclusao');
    fixture.componentRef.setInput('message', 'Deletar?');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal-overlay')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Confirmar exclusao');
  });

  it('should emit confirm and cancel', () => {
    const fixture = TestBed.createComponent(ConfirmModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', 't');
    fixture.componentRef.setInput('message', 'm');
    fixture.detectChanges();
    const confirmSpy = vi.spyOn(fixture.componentInstance.confirm, 'emit');
    const cancelSpy = vi.spyOn(fixture.componentInstance.cancel, 'emit');
    fixture.componentInstance.confirm.emit();
    fixture.componentInstance.cancel.emit();
    expect(confirmSpy).toHaveBeenCalled();
    expect(cancelSpy).toHaveBeenCalled();
  });
});
