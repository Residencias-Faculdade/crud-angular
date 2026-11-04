import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { FormGroup } from '@angular/forms';

import { FormSchema, FormSection } from '../../domain/form-schema.model';
import { applyVisibility } from '../../engine/visibility';
import { SchemaFieldsComponent } from '../schema-fields/schema-fields.component';

@Component({
  selector: 'app-dynamic-form',
  imports: [SchemaFieldsComponent],
  templateUrl: './dynamic-form.component.html',
  styleUrl: './dynamic-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFormComponent {
  readonly schema = input.required<FormSchema>();
  readonly form = input.required<FormGroup>();
  readonly selectedPath = input<string | null>(null);

  readonly inspect = output<string>();
  readonly submitted = output<Record<string, unknown>>();
  readonly payloadChange = output<Record<string, unknown>>();

  protected readonly activeSectionId = signal('');
  protected readonly submittedOnce = signal(false);
  protected readonly status = signal('VALID');
  protected readonly rawValue = signal<unknown>({});
  protected readonly fieldCount = computed(() => countFields(this.schema().sections));
  protected readonly statusLabel = computed(() =>
    this.status() === 'VALID' ? 'formulário válido' : 'formulário com pendências',
  );

  protected readonly activeSection = computed<FormSection | undefined>(() => {
    const sections = this.schema().sections;

    return sections.find((section) => section.id === this.activeSectionId()) ?? sections[0];
  });

  constructor() {
    effect(() => {
      const id = this.schema().sections[0]?.id ?? '';

      this.activeSectionId.set(id);
      this.submittedOnce.set(false);
    });

    effect((onCleanup) => {
      const form = this.form();
      const fields = this.schema().sections.flatMap((section) => section.fields);

      const sync = (): void => {
        const raw = form.getRawValue();

        applyVisibility(form, fields, raw);
        this.rawValue.set(raw);
        this.status.set(form.status);
        this.payloadChange.emit(form.value);
      };

      sync();

      const valueSubscription = form.valueChanges.subscribe(sync);
      const statusSubscription = form.statusChanges.subscribe(() => this.status.set(form.status));

      onCleanup(() => {
        valueSubscription.unsubscribe();
        statusSubscription.unsubscribe();
      });
    });
  }

  protected selectSection(id: string): void {
    this.activeSectionId.set(id);
  }

  protected submit(): void {
    this.submittedOnce.set(true);
    this.form().markAllAsTouched();

    if (this.form().invalid) return;

    this.submitted.emit(this.form().value);
  }

  protected reset(): void {
    this.submittedOnce.set(false);
    this.form().reset();
    this.form().markAsUntouched();
  }
}

function countFields(sections: readonly FormSection[]): number {
  return sections.reduce((total, section) => total + section.fields.length, 0);
}
