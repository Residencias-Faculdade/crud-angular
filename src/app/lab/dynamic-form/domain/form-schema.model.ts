import { FieldSchema } from './field-schema.model';

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: readonly FieldSchema[];
}

export interface FormSchema {
  id: string;
  title: string;
  description?: string;
  submitLabel?: string;
  sections: readonly FormSection[];
}

export type SchemaFormat = 'json' | 'yaml';

export interface SchemaIssue {
  path: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface SchemaParseResult {
  schema: FormSchema | null;
  issues: readonly SchemaIssue[];
}
