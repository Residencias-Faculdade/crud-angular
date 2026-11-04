import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import { ArrayField, EnumField, FieldSchema, ObjectField } from '../domain/field-schema.model';
import { FormSchema } from '../domain/form-schema.model';

export type ControlMap = Record<string, AbstractControl>;

export function buildFormGroup(schema: FormSchema): FormGroup<ControlMap> {
  const controls: ControlMap = {};

  for (const section of schema.sections) {
    for (const field of section.fields) {
      controls[field.name] = buildControl(field);
    }
  }

  return new FormGroup(controls);
}

export function buildControl(field: FieldSchema): AbstractControl {
  const validators = buildValidators(field);

  if (field.type === 'object') {
    return new FormGroup(buildControlMap(field), { validators });
  }

  if (field.type === 'array') {
    const controls = initialArrayValues(field).map((value) => seedControl(field.items, value));

    return new FormArray(controls, validators);
  }

  return new FormControl(initialValue(field), validators);
}

function buildControlMap(field: ObjectField): ControlMap {
  const controls: ControlMap = {};

  for (const child of field.fields) {
    controls[child.name] = buildControl(child);
  }

  return controls;
}

function initialArrayValues(field: ArrayField): readonly unknown[] {
  return Array.isArray(field.defaultValue) ? field.defaultValue : [];
}

function initialValue(field: FieldSchema): unknown {
  if (field.type === 'enum' && field.multiple) {
    return Array.isArray(field.defaultValue) ? [...field.defaultValue] : [];
  }

  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  switch (field.type) {
    case 'enum':
      return null;
    case 'boolean':
      return false;
    case 'json':
      return null;
    case 'number':
      return null;
    default:
      return '';
  }
}

function seedControl(field: FieldSchema, value: unknown): AbstractControl {
  const control = buildControl(field);

  control.patchValue(value);

  return control;
}

function buildValidators(field: FieldSchema): ValidatorFn[] {
  const validators: ValidatorFn[] = [];
  const rules = field.rules;

  if (field.required) {
    validators.push(field.type === 'boolean' ? Validators.requiredTrue : Validators.required);
  }

  if (rules?.minLength !== undefined) validators.push(Validators.minLength(rules.minLength));
  if (rules?.maxLength !== undefined) validators.push(Validators.maxLength(rules.maxLength));
  if (rules?.min !== undefined) validators.push(Validators.min(rules.min));
  if (rules?.max !== undefined) validators.push(Validators.max(rules.max));

  if (field.type === 'enum') validators.push(optionValidator(field));

  if (field.type === 'array') {
    if (field.minItems !== undefined) validators.push(Validators.minLength(field.minItems));
    if (field.maxItems !== undefined) validators.push(Validators.maxLength(field.maxItems));
  }

  return validators;
}

function optionValidator(field: EnumField): ValidatorFn {
  const allowed = field.options.map((option) => option.value);

  return (control) => {
    const value = control.value;

    if (value === null || value === undefined || value === '') return null;

    if (field.multiple) {
      if (!Array.isArray(value)) return { option: true };
      if (value.length === 0) return null;

      return value.every((item) => allowed.some((candidate) => Object.is(candidate, item)))
        ? null
        : { option: true };
    }

    return allowed.some((candidate) => Object.is(candidate, value)) ? null : { option: true };
  };
}
