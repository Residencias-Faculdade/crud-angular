import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { FieldSchema, resolveWidget } from '../../domain/field-schema.model';
import { valueShapeOf } from '../../engine/field-metadata';

@Component({
  selector: 'app-field-frame',
  templateUrl: './field-frame.component.html',
  styleUrl: './field-frame.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldFrameComponent {
  readonly field = input.required<FieldSchema>();
  readonly path = input.required<string>();
  readonly selected = input(false);
  readonly error = input<string | null>(null);
  readonly inspect = output<string>();

  protected readonly widget = computed(() => resolveWidget(this.field()));
  protected readonly shape = computed(() => valueShapeOf(this.field()));
}
