import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { JsonPipe } from '@angular/common';

import { FieldSchema, resolveWidget } from '../../domain/field-schema.model';
import { FieldIndexEntry } from '../../engine/field-index';
import { WidgetDoc, describeRules, valueShapeOf, widgetDoc } from '../../engine/field-metadata';
import { readPath } from '../../engine/visibility';

@Component({
  selector: 'app-schema-inspector',
  imports: [JsonPipe],
  templateUrl: './schema-inspector.component.html',
  styleUrl: './schema-inspector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchemaInspectorComponent {
  readonly entries = input.required<readonly FieldIndexEntry[]>();
  readonly selected = input<FieldIndexEntry | null>(null);
  readonly rootValue = input<unknown>({});
  readonly select = output<string>();

  protected readonly activeDoc = computed<WidgetDoc | undefined>(() => {
    const entry = this.selected();

    if (!entry) return undefined;

    const widget = resolveWidget(entry.field);

    return widget ? widgetDoc(widget) : undefined;
  });

  protected readonly activeRules = computed<readonly string[]>(() => {
    const entry = this.selected();

    return entry ? describeRules(entry.field) : [];
  });

  protected readonly activeShape = computed(() => {
    const entry = this.selected();

    return entry ? valueShapeOf(entry.field) : '';
  });

  protected readonly activeOptions = computed(() => {
    const entry = this.selected();

    return entry && entry.field.type === 'enum' ? entry.field.options : [];
  });

  protected indent(entry: FieldIndexEntry): number {
    return 8 + entry.depth * 16;
  }

  protected widgetLabel(field: FieldSchema): string {
    return resolveWidget(field) ?? 'grupo';
  }

  protected currentValue(entry: FieldIndexEntry): string {
    if (entry.isItemTemplate) return 'template de item, repete a cada linha';

    const value = readPath(this.rootValue(), entry.path);

    return JSON.stringify(value ?? null, null, 2);
  }
}
