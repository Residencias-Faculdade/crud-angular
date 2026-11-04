import { FormGroup } from '@angular/forms';

import { FieldSchema } from '../domain/field-schema.model';

export function isFieldVisible(field: FieldSchema, value: unknown): boolean {
  const condition = field.visibleWhen;

  if (!condition) return true;

  const current = readPath(value, condition.field);

  if (condition.in) {
    return condition.in.some((candidate) => Object.is(candidate, current));
  }

  if (condition.equals !== undefined) {
    return Object.is(condition.equals, current);
  }

  return Boolean(current);
}

export function applyVisibility(
  group: FormGroup,
  fields: readonly FieldSchema[],
  value: unknown,
): void {
  for (const field of fields) {
    const control = group.get(field.name);

    if (!control) continue;

    const visible = isFieldVisible(field, value);

    if (visible && control.disabled) control.enable({ emitEvent: false });
    if (!visible && control.enabled) control.disable({ emitEvent: false });

    if (field.type === 'object') {
      const nestedGroup = control instanceof FormGroup ? control : null;

      if (nestedGroup) {
        applyVisibility(nestedGroup, field.fields, readPath(value, field.name));
      }
    }
  }
}

export function readPath(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (current === null || current === undefined) return undefined;

    if (Array.isArray(current)) {
      const index = Number(segment);

      return Number.isInteger(index) ? current[index] : undefined;
    }

    if (typeof current === 'object') {
      return (current as Record<string, unknown>)[segment];
    }

    return undefined;
  }, value);
}
