import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { SchemaIssue } from '../dynamic-form/domain/form-schema.model';

@Component({
  selector: 'app-schema-issues',
  templateUrl: './schema-issues.component.html',
  styleUrl: './schema-issues.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchemaIssuesComponent {
  readonly issues = input.required<readonly SchemaIssue[]>();

  protected readonly errors = computed(() =>
    this.issues().filter((issue) => issue.severity === 'error'),
  );

  protected readonly warnings = computed(() =>
    this.issues().filter((issue) => issue.severity === 'warning'),
  );
}
