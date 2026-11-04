import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

import { SchemaFormat } from '../dynamic-form/domain/form-schema.model';
import { parseFormSchema } from '../dynamic-form/domain/schema-normalizer';
import { ControlMap, buildFormGroup } from '../dynamic-form/engine/control-factory';
import { buildFieldIndex } from '../dynamic-form/engine/field-index';
import { DynamicFormComponent } from '../dynamic-form/presentation/dynamic-form/dynamic-form.component';
import { SchemaInspectorComponent } from '../dynamic-form/presentation/schema-inspector/schema-inspector.component';
import { DEFAULT_SCHEMA_SAMPLE, SCHEMA_SAMPLES, SchemaSample } from './demo-schemas';
import { CopyState, PayloadPanelComponent } from './payload-panel.component';
import { SchemaIssuesComponent } from './schema-issues.component';
import { SourcePanelComponent } from './source-panel.component';

type LabTab = 'form' | 'schema' | 'inspector' | 'payload';

interface AppliedSource {
  source: string;
  format: SchemaFormat;
}

@Component({
  selector: 'app-crud-lab',
  imports: [
    DynamicFormComponent,
    SchemaInspectorComponent,
    SchemaIssuesComponent,
    SourcePanelComponent,
    PayloadPanelComponent,
  ],
  templateUrl: './crud-lab.component.html',
  styleUrl: './crud-lab.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrudLabComponent {
  protected readonly samples = SCHEMA_SAMPLES;
  protected readonly tabs: readonly { id: LabTab; label: string }[] = [
    { id: 'form', label: 'Formulário' },
    { id: 'schema', label: 'Fonte do schema' },
    { id: 'inspector', label: 'Tipagem' },
    { id: 'payload', label: 'Payload' },
  ];

  protected readonly sampleId = signal(DEFAULT_SCHEMA_SAMPLE.id);
  protected readonly draft = signal(DEFAULT_SCHEMA_SAMPLE.source);
  protected readonly format = signal<SchemaFormat>(DEFAULT_SCHEMA_SAMPLE.format);
  protected readonly applied = signal<AppliedSource>({
    source: DEFAULT_SCHEMA_SAMPLE.source,
    format: DEFAULT_SCHEMA_SAMPLE.format,
  });

  protected readonly activeTab = signal<LabTab>('form');
  protected readonly selectedPath = signal<string | null>(null);
  protected readonly payload = signal<Record<string, unknown>>({});
  protected readonly submittedPayload = signal<Record<string, unknown> | null>(null);
  protected readonly rootValue = signal<unknown>({});
  protected readonly copyState = signal<CopyState>('idle');

  protected readonly result = computed(() =>
    parseFormSchema(this.applied().source, this.applied().format),
  );
  protected readonly schema = computed(() => this.result().schema);
  protected readonly issues = computed(() => this.result().issues);
  protected readonly errorCount = computed(
    () => this.issues().filter((issue) => issue.severity === 'error').length,
  );
  protected readonly warningCount = computed(
    () => this.issues().filter((issue) => issue.severity === 'warning').length,
  );

  protected readonly form = computed<FormGroup<ControlMap> | null>(() => {
    const schema = this.schema();

    return schema ? buildFormGroup(schema) : null;
  });

  protected readonly entries = computed(() => {
    const schema = this.schema();

    return schema ? buildFieldIndex(schema) : [];
  });

  protected readonly selectedEntry = computed(() => {
    const entries = this.entries();
    const path = this.selectedPath();

    return entries.find((entry) => entry.path === path) ?? entries[0] ?? null;
  });

  protected readonly fieldTotal = computed(() =>
    (this.schema()?.sections ?? []).reduce((total, section) => total + section.fields.length, 0),
  );

  protected readonly payloadJson = computed(() => JSON.stringify(this.payload(), null, 2));
  protected readonly submittedJson = computed(() => {
    const payload = this.submittedPayload();

    return payload ? JSON.stringify(payload, null, 2) : null;
  });

  constructor() {
    effect(() => {
      const form = this.form();

      this.payload.set(form ? form.value : {});
      this.rootValue.set(form ? form.getRawValue() : {});
      this.submittedPayload.set(null);
      this.copyState.set('idle');
    });
  }

  protected selectSample(sample: SchemaSample): void {
    this.sampleId.set(sample.id);
    this.draft.set(sample.source);
    this.format.set(sample.format);
    this.applied.set({ source: sample.source, format: sample.format });
    this.selectedPath.set(null);
    this.activeTab.set('form');
  }

  protected restoreDraft(): void {
    const sample = this.samples.find((candidate) => candidate.id === this.sampleId());

    if (!sample) return;

    this.draft.set(sample.source);
    this.format.set(sample.format);
  }

  protected selectFormat(format: SchemaFormat): void {
    if (format === this.format()) return;

    const converted = convertSource(this.draft(), this.format(), format);

    if (converted !== null) this.draft.set(converted);

    this.format.set(format);
    this.applyDraft();
  }

  protected applyDraft(): void {
    this.applied.set({ source: this.draft(), format: this.format() });
    this.selectedPath.set(null);
    this.copyState.set('idle');
  }

  protected selectTab(tab: LabTab): void {
    this.activeTab.set(tab);
  }

  protected inspectField(path: string): void {
    this.selectedPath.set(path);
    this.activeTab.set('inspector');
  }

  protected selectField(path: string): void {
    this.selectedPath.set(path);
  }

  protected onPayloadChange(payload: Record<string, unknown>): void {
    const form = this.form();

    this.payload.set(payload);
    this.rootValue.set(form ? form.getRawValue() : {});
    this.copyState.set('idle');
  }

  protected onSubmitted(payload: Record<string, unknown>): void {
    this.submittedPayload.set(payload);
    this.activeTab.set('payload');
  }

  protected async copyPayload(): Promise<void> {
    const text = this.submittedJson() ?? this.payloadJson();

    try {
      await navigator.clipboard.writeText(text);
      this.copyState.set('copied');
    } catch {
      this.copyState.set('failed');
    }
  }
}

function convertSource(source: string, from: SchemaFormat, to: SchemaFormat): string | null {
  try {
    const raw: unknown = from === 'json' ? JSON.parse(source) : parseYaml(source);

    return to === 'json' ? JSON.stringify(raw, null, 2) : stringifyYaml(raw);
  } catch {
    return null;
  }
}
