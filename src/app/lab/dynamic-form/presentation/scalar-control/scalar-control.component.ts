import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { FieldSchema, resolveWidget } from '../../domain/field-schema.model';

@Component({
  selector: 'app-scalar-control',
  imports: [ReactiveFormsModule],
  templateUrl: './scalar-control.component.html',
  styleUrl: './scalar-control.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScalarControlComponent {
  readonly field = input.required<FieldSchema>();
  readonly control = input.required<FormControl>();

  protected readonly widget = computed(() => resolveWidget(this.field()));
  protected readonly inputType = computed(() => {
    const widget = this.widget();

    if (widget === null || widget === 'text' || widget === 'textarea') return 'text';

    return widget;
  });
  protected readonly placeholder = computed(() => this.field().placeholder ?? '');
  protected readonly min = computed(() => this.field().rules?.min ?? null);
  protected readonly max = computed(() => this.field().rules?.max ?? null);
  protected readonly step = computed(() => this.field().rules?.step ?? null);
  protected readonly rangeValue = computed(() => {
    const value = this.control().value;

    return value === null || value === undefined || value === '' ? '0' : String(value);
  });
}
