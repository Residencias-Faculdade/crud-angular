export const FIELD_TYPES = [
  'string',
  'number',
  'boolean',
  'enum',
  'date',
  'time',
  'color',
  'json',
  'object',
  'array',
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_WIDGETS = [
  'text',
  'textarea',
  'email',
  'url',
  'password',
  'number',
  'range',
  'select',
  'radio',
  'checkbox-group',
  'switch',
  'date',
  'time',
  'color',
  'json',
  'repeater',
] as const;

export type FieldWidget = (typeof FIELD_WIDGETS)[number];

export const WIDGET_ACCEPTS: Record<FieldWidget, readonly FieldType[]> = {
  text: ['string'],
  textarea: ['string'],
  email: ['string'],
  url: ['string'],
  password: ['string'],
  number: ['number'],
  range: ['number'],
  select: ['enum'],
  radio: ['enum'],
  'checkbox-group': ['enum'],
  switch: ['boolean'],
  date: ['date'],
  time: ['time'],
  color: ['color'],
  json: ['json'],
  repeater: ['array'],
};

export const DEFAULT_WIDGET: Record<Exclude<FieldType, 'object'>, FieldWidget> = {
  string: 'text',
  number: 'number',
  boolean: 'switch',
  enum: 'select',
  date: 'date',
  time: 'time',
  color: 'color',
  json: 'json',
  array: 'repeater',
};

export type OptionValue = string | number | boolean;

export interface FieldOption {
  label: string;
  value: OptionValue;
  description?: string;
}

export interface FieldRules {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  step?: number;
}

export interface FieldVisibility {
  field: string;
  equals?: unknown;
  in?: readonly unknown[];
}

export interface BaseField {
  name: string;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  widget?: FieldWidget;
  defaultValue?: unknown;
  rules?: FieldRules;
  visibleWhen?: FieldVisibility;
}

export interface StringField extends BaseField {
  type: 'string';
}

export interface NumberField extends BaseField {
  type: 'number';
}

export interface BooleanField extends BaseField {
  type: 'boolean';
}

export interface EnumField extends BaseField {
  type: 'enum';
  options: readonly FieldOption[];
  multiple?: boolean;
}

export interface DateField extends BaseField {
  type: 'date';
}

export interface TimeField extends BaseField {
  type: 'time';
}

export interface ColorField extends BaseField {
  type: 'color';
}

export interface JsonField extends BaseField {
  type: 'json';
}

export interface ObjectField extends BaseField {
  type: 'object';
  fields: readonly FieldSchema[];
}

export interface ArrayField extends BaseField {
  type: 'array';
  items: FieldSchema;
  minItems?: number;
  maxItems?: number;
}

export type ScalarField = StringField | NumberField | DateField | TimeField | ColorField;

export type FieldSchema =
  ScalarField | EnumField | BooleanField | JsonField | ObjectField | ArrayField;

export function isFieldType(value: string): value is FieldType {
  return (FIELD_TYPES as readonly string[]).includes(value);
}

export function isFieldWidget(value: string): value is FieldWidget {
  return (FIELD_WIDGETS as readonly string[]).includes(value);
}

export function resolveWidget(field: FieldSchema): FieldWidget | null {
  if (field.type === 'object') return null;
  if (field.widget) return field.widget;

  if (field.type === 'enum') return field.multiple ? 'checkbox-group' : 'select';

  return DEFAULT_WIDGET[field.type];
}

export function isObjectField(field: FieldSchema): field is ObjectField {
  return field.type === 'object';
}

export function isArrayField(field: FieldSchema): field is ArrayField {
  return field.type === 'array';
}

export function isEnumField(field: FieldSchema): field is EnumField {
  return field.type === 'enum';
}

export function isBooleanField(field: FieldSchema): field is BooleanField {
  return field.type === 'boolean';
}
