import { FieldSchema } from '../domain/field-schema.model';
import { FormSchema } from '../domain/form-schema.model';

export interface FieldIndexEntry {
  path: string;
  field: FieldSchema;
  depth: number;
  sectionId: string;
  sectionTitle: string;
  parentLabel: string | null;
  isItemTemplate: boolean;
}

export function buildFieldIndex(schema: FormSchema): readonly FieldIndexEntry[] {
  const entries: FieldIndexEntry[] = [];

  for (const section of schema.sections) {
    collect(section.fields, '', 0, section.id, section.title, null, entries);
  }

  return entries;
}

export function pathOfField(basePath: string, field: FieldSchema): string {
  return basePath ? `${basePath}.${field.name}` : field.name;
}

function collect(
  fields: readonly FieldSchema[],
  basePath: string,
  depth: number,
  sectionId: string,
  sectionTitle: string,
  parentLabel: string | null,
  entries: FieldIndexEntry[],
): void {
  for (const field of fields) {
    const path = pathOfField(basePath, field);

    entries.push({
      path,
      field,
      depth,
      sectionId,
      sectionTitle,
      parentLabel,
      isItemTemplate: basePath.includes('[]'),
    });

    if (field.type === 'object') {
      collect(field.fields, path, depth + 1, sectionId, sectionTitle, field.label, entries);
    }

    if (field.type === 'array' && field.items.type === 'object') {
      collect(
        field.items.fields,
        `${path}[]`,
        depth + 1,
        sectionId,
        sectionTitle,
        field.label,
        entries,
      );
    }
  }
}
