import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';

import { FieldSchema } from '../../domain/field-schema.model';
import { buildControl } from '../../engine/control-factory';
import { pathOfField } from '../../engine/field-index';
import { isFieldVisible } from '../../engine/visibility';
import { ChoiceControlComponent } from '../choice-control/choice-control.component';
import { FieldFrameComponent } from '../field-frame/field-frame.component';
import { JsonControlComponent } from '../json-control/json-control.component';
import { ScalarControlComponent } from '../scalar-control/scalar-control.component';

@Component({
  selector: 'app-schema-fields',
  imports: [
    ReactiveFormsModule,
    FieldFrameComponent,
    ScalarControlComponent,
    ChoiceControlComponent,
    JsonControlComponent,
  ],
  templateUrl: './schema-fields.component.html',
  styleUrl: './schema-fields.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchemaFieldsComponent {
  readonly fields = input.required<readonly FieldSchema[]>();
  readonly group = input.required<FormGroup>();
  readonly rootValue = input.required<unknown>();
  readonly selectedPath = input<string | null>(null);
  readonly basePath = input('');
  readonly showErrors = input(false);
  readonly inspect = output<string>();

  protected readonly visibleFields = computed(() =>
    this.fields().filter((field) => isFieldVisible(field, this.rootValue())),
  );

  protected pathFor(field: FieldSchema): string {
    return pathOfField(this.basePath(), field);
  }

  protected itemBasePath(field: FieldSchema): string {
    return `${this.pathFor(field)}[]`;
  }

  protected isSelected(field: FieldSchema): boolean {
    return this.selectedPath() === this.pathFor(field);
  }

  protected controlOf(field: FieldSchema): FormControl {
    return this.group().get(field.name) as FormControl;
  }

  protected groupOf(field: FieldSchema): FormGroup {
    return this.group().get(field.name) as FormGroup;
  }

  protected itemsOf(field: FieldSchema): readonly AbstractControl[] {
    const control = this.group().get(field.name);

    return control instanceof FormArray ? control.controls : [];
  }

  protected itemControl(item: AbstractControl): FormControl {
    return item as FormControl;
  }

  protected itemGroup(item: AbstractControl): FormGroup {
    return item as FormGroup;
  }

  protected canAdd(field: FieldSchema): boolean {
    if (field.type !== 'array') return false;

    return field.maxItems === undefined || this.itemsOf(field).length < field.maxItems;
  }

  protected addItem(field: FieldSchema): void {
    const control = this.group().get(field.name);

    if (!(control instanceof FormArray) || field.type !== 'array') return;

    control.push(buildControl(field.items));
    control.markAsDirty();
  }

  protected removeItem(field: FieldSchema, index: number): void {
    const control = this.group().get(field.name);

    if (!(control instanceof FormArray)) return;

    control.removeAt(index);
    control.markAsDirty();
  }

  protected stateLabel(field: FieldSchema): string {
    return this.controlOf(field).value ? 'ligado' : 'desligado';
  }

  protected errorOf(field: FieldSchema): string | null {
    const control = this.group().get(field.name);

    if (!control || control.valid) return null;
    if (!control.touched && !control.dirty && !this.showErrors()) return null;

    return errorMessage(control, field);
  }
}

function errorMessage(control: AbstractControl, field: FieldSchema): string | null {
  const errors = control.errors;

  if (!errors) return null;

  if (errors['required']) return 'Campo obrigatório';
  if (errors['requiredTrue']) return 'Precisa estar marcado';

  if (errors['minlength']) {
    const required = errors['minlength'].requiredLength;

    return field.type === 'array'
      ? `Mínimo de ${required} itens`
      : `Mínimo de ${required} caracteres`;
  }

  if (errors['maxlength']) {
    const required = errors['maxlength'].requiredLength;

    return field.type === 'array'
      ? `Máximo de ${required} itens`
      : `Máximo de ${required} caracteres`;
  }

  if (errors['min']) return `Valor mínimo: ${errors['min'].min}`;
  if (errors['max']) return `Valor máximo: ${errors['max'].max}`;
  if (errors['pattern']) return 'Formato inválido';
  if (errors['option']) return 'Selecione uma opção válida';

  return 'Valor inválido';
}
