import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { FormSchema, SchemaFormat, SchemaIssue } from '../dynamic-form/domain/form-schema.model';
import { SchemaIssuesComponent } from './schema-issues.component';

@Component({
  selector: 'app-source-panel',
  imports: [SchemaIssuesComponent],
  templateUrl: './source-panel.component.html',
  styleUrl: './source-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourcePanelComponent {
  readonly draft = input.required<string>();
  readonly format = input.required<SchemaFormat>();
  readonly issues = input.required<readonly SchemaIssue[]>();
  readonly schema = input<FormSchema | null>(null);

  readonly draftChange = output<string>();
  readonly formatChange = output<SchemaFormat>();
  readonly apply = output<void>();
  readonly restore = output<void>();

  protected onInput(event: Event): void {
    this.draftChange.emit((event.target as HTMLTextAreaElement).value);
  }
}
