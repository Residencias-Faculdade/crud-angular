import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { EnumField, OptionValue, resolveWidget } from '../../domain/field-schema.model';

@Component({
  selector: 'app-choice-control',
  imports: [ReactiveFormsModule],
  templateUrl: './choice-control.component.html',
  styleUrl: './choice-control.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoiceControlComponent {
  readonly field = input.required<EnumField>();
  readonly control = input.required<FormControl>();

  protected readonly widget = computed(() => resolveWidget(this.field()));
  protected readonly multiple = computed(() => this.field().multiple === true);

  protected isChecked(value: OptionValue): boolean {
    const current = this.control().value;

    return Array.isArray(current)
      ? current.some((item) => Object.is(item, value))
      : Object.is(current, value);
  }

  protected toggle(value: OptionValue): void {
    const current = this.control().value;
    const selection = Array.isArray(current) ? [...current] : [];
    const index = selection.findIndex((item) => Object.is(item, value));

    if (index >= 0) selection.splice(index, 1);
    else selection.push(value);

    this.control().setValue(selection);
    this.control().markAsDirty();
    this.control().markAsTouched();
  }
}
