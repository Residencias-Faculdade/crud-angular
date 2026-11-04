import { parseDocument } from 'yaml';

import {
  FieldOption,
  FieldRules,
  FieldSchema,
  FieldType,
  FieldVisibility,
  FieldWidget,
  OptionValue,
  WIDGET_ACCEPTS,
  isFieldType,
  isFieldWidget,
} from './field-schema.model';
import {
  FormSchema,
  FormSection,
  SchemaFormat,
  SchemaIssue,
  SchemaParseResult,
} from './form-schema.model';

const NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_-]*$/;

export function parseFormSchema(source: string, format: SchemaFormat): SchemaParseResult {
  if (!source.trim()) {
    return failure('$', 'O schema está vazio.');
  }

  if (format === 'json') {
    try {
      return normalizeFormSchema(JSON.parse(source));
    } catch (error) {
      return failure('$', `JSON inválido: ${describeError(error)}`);
    }
  }

  const document = parseDocument(source);

  if (document.errors.length > 0) {
    return {
      schema: null,
      issues: document.errors.map((error) => ({
        path: '$',
        severity: 'error' as const,
        message: `YAML inválido: ${error.message}`,
      })),
    };
  }

  return normalizeFormSchema(document.toJS());
}

export function normalizeFormSchema(raw: unknown): SchemaParseResult {
  const issues: SchemaIssue[] = [];

  if (!isRecord(raw)) {
    issues.push(error('$', 'O schema precisa ser um objeto.'));
    return { schema: null, issues };
  }

  const id = readString(raw['id']);
  const title = readString(raw['title']);
  const sectionsValue = raw['sections'];

  if (!id) issues.push(warning('$.id', 'Sem id definido, usando "dynamic-form".'));
  if (!title) issues.push(warning('$.title', 'Sem title definido, usando "Formulário".'));

  if (!Array.isArray(sectionsValue) || sectionsValue.length === 0) {
    issues.push(error('$.sections', 'O schema precisa de ao menos uma seção.'));
    return { schema: null, issues };
  }

  const sections: FormSection[] = [];

  sectionsValue.forEach((sectionValue, index) => {
    const section = normalizeSection(sectionValue, `$.sections[${index}]`, issues);

    if (section) sections.push(section);
  });

  if (issues.some((issue) => issue.severity === 'error')) {
    return { schema: null, issues };
  }

  if (sections.length === 0) {
    issues.push(error('$.sections', 'Nenhuma seção válida encontrada.'));
    return { schema: null, issues };
  }

  const schema: FormSchema = {
    id: id ?? 'dynamic-form',
    title: title ?? 'Formulário',
    description: readString(raw['description']),
    submitLabel: readString(raw['submitLabel']),
    sections,
  };

  return { schema, issues };
}

function normalizeSection(raw: unknown, path: string, issues: SchemaIssue[]): FormSection | null {
  if (!isRecord(raw)) {
    issues.push(error(path, 'A seção precisa ser um objeto.'));
    return null;
  }

  const fieldsValue = raw['fields'];

  if (!Array.isArray(fieldsValue) || fieldsValue.length === 0) {
    issues.push(error(`${path}.fields`, 'A seção precisa de ao menos um campo.'));
    return null;
  }

  const fields = normalizeFields(fieldsValue, `${path}.fields`, issues);

  if (fields.length === 0) return null;

  return {
    id: readString(raw['id']) ?? `section-${fields[0].name}`,
    title: readString(raw['title']) ?? 'Seção',
    description: readString(raw['description']),
    fields,
  };
}

function normalizeFields(
  values: readonly unknown[],
  path: string,
  issues: SchemaIssue[],
): FieldSchema[] {
  const fields: FieldSchema[] = [];
  const names = new Set<string>();

  values.forEach((value, index) => {
    const field = normalizeField(value, `${path}[${index}]`, issues);

    if (!field) return;

    if (names.has(field.name)) {
      issues.push(error(`${path}[${index}].name`, `Campo duplicado: "${field.name}".`));
      return;
    }

    names.add(field.name);
    fields.push(field);
  });

  return fields;
}

function normalizeField(raw: unknown, path: string, issues: SchemaIssue[]): FieldSchema | null {
  if (!isRecord(raw)) {
    issues.push(error(path, 'O campo precisa ser um objeto.'));
    return null;
  }

  const name = readString(raw['name'])?.trim();
  const typeValue = readString(raw['type']);

  if (!name) {
    issues.push(error(`${path}.name`, 'O campo precisa de um name.'));
    return null;
  }

  if (!NAME_PATTERN.test(name)) {
    issues.push(
      error(
        `${path}.name`,
        `Nome inválido: "${name}". Use letras, números, "_" ou "-" e não comece com número.`,
      ),
    );
    return null;
  }

  if (!typeValue || !isFieldType(typeValue)) {
    issues.push(
      error(
        `${path}.type`,
        `Tipo "${typeValue ?? ''}" não suportado. Tipos válidos: string, number, boolean, enum, date, time, color, json, object, array.`,
      ),
    );
    return null;
  }

  const type = typeValue;
  const widget = normalizeWidget(raw['widget'], type, path, issues);
  const rules = normalizeRules(raw['rules'], path, issues);
  const visibleWhen = normalizeVisibility(raw['visibleWhen'], path, issues);

  const base = {
    name,
    label: readString(raw['label']) ?? humanize(name),
    description: readString(raw['description']),
    placeholder: readString(raw['placeholder']),
    required: readBoolean(raw['required']) ?? false,
    widget,
    rules,
    visibleWhen,
  };

  if (type === 'enum') {
    const options = normalizeOptions(raw['options'], path, issues);

    if (options.length === 0) return null;

    const multiple = readBoolean(raw['multiple']) ?? false;
    const enumWidget = multiple && widget === 'radio' ? 'checkbox-group' : widget;

    if (multiple && widget === 'radio') {
      issues.push(
        warning(`${path}.widget`, 'Radio não aceita múltipla escolha. Usando "checkbox-group".'),
      );
    }

    return {
      ...base,
      type,
      options,
      multiple,
      widget: enumWidget,
      defaultValue: normalizeDefault(raw['defaultValue'], type, options, multiple, path, issues),
    };
  }

  if (type === 'object') {
    const fieldsValue = raw['fields'];

    if (!Array.isArray(fieldsValue)) {
      issues.push(error(`${path}.fields`, 'Objeto exige um array fields.'));
      return null;
    }

    const fields = normalizeFields(fieldsValue, `${path}.fields`, issues);

    if (fields.length === 0) {
      issues.push(warning(`${path}.fields`, 'Objeto sem campos renderiza um grupo vazio.'));
    }

    return {
      ...base,
      type,
      fields,
      defaultValue: normalizeDefault(raw['defaultValue'], type, [], false, path, issues),
    };
  }

  if (type === 'array') {
    const itemsValue = raw['items'];

    if (!isRecord(itemsValue)) {
      issues.push(error(`${path}.items`, 'Array exige um objeto items.'));
      return null;
    }

    const items = normalizeField(
      {
        ...itemsValue,
        name: readString(itemsValue['name']) ?? 'item',
        label: readString(itemsValue['label']) ?? 'Item',
      },
      `${path}.items`,
      issues,
    );

    if (!items) return null;

    const minItems = readFiniteNumber(raw['minItems']);
    const maxItems = readFiniteNumber(raw['maxItems']);

    if (minItems !== undefined && minItems < 0) {
      issues.push(warning(`${path}.minItems`, 'minItems não pode ser negativo.'));
    }

    if (minItems !== undefined && maxItems !== undefined && minItems > maxItems) {
      issues.push(warning(`${path}.maxItems`, 'maxItems deve ser maior ou igual a minItems.'));
    }

    return {
      ...base,
      type,
      items,
      minItems,
      maxItems,
      defaultValue: normalizeDefault(raw['defaultValue'], type, [], false, path, issues),
    };
  }

  if (type === 'boolean') {
    return {
      ...base,
      type,
      defaultValue: normalizeDefault(raw['defaultValue'], type, [], false, path, issues),
    };
  }

  if (type === 'json') {
    return {
      ...base,
      type,
      defaultValue: normalizeDefault(raw['defaultValue'], type, [], false, path, issues),
    };
  }

  return {
    ...base,
    type,
    defaultValue: normalizeDefault(raw['defaultValue'], type, [], false, path, issues),
  };
}

function normalizeWidget(
  raw: unknown,
  type: FieldType,
  path: string,
  issues: SchemaIssue[],
): FieldWidget | undefined {
  const value = readString(raw);

  if (!value) return undefined;

  if (!isFieldWidget(value)) {
    issues.push(
      warning(
        `${path}.widget`,
        `Widget "${value}" desconhecido. Usando o padrão do tipo "${type}".`,
      ),
    );
    return undefined;
  }

  if (!WIDGET_ACCEPTS[value].includes(type)) {
    issues.push(
      warning(
        `${path}.widget`,
        `Widget "${value}" não é compatível com o tipo "${type}". Usando o padrão do tipo.`,
      ),
    );
    return undefined;
  }

  return value;
}

function normalizeOptions(raw: unknown, path: string, issues: SchemaIssue[]): FieldOption[] {
  if (!Array.isArray(raw)) {
    issues.push(error(`${path}.options`, 'Tipo enum exige um array options.'));
    return [];
  }

  const options: FieldOption[] = [];
  const values = new Set<OptionValue>();

  raw.forEach((value, index) => {
    if (!isRecord(value)) {
      issues.push(error(`${path}.options[${index}]`, 'Cada opção precisa ser um objeto.'));
      return;
    }

    const optionValue = value['value'];

    if (!isOptionValue(optionValue)) {
      issues.push(
        error(
          `${path}.options[${index}].value`,
          'O value da opção deve ser string, number ou boolean.',
        ),
      );
      return;
    }

    if (values.has(optionValue)) {
      issues.push(
        warning(
          `${path}.options[${index}].value`,
          `Opção duplicada: ${JSON.stringify(optionValue)}.`,
        ),
      );
      return;
    }

    values.add(optionValue);

    options.push({
      label: readString(value['label']) ?? String(optionValue),
      value: optionValue,
      description: readString(value['description']),
    });
  });

  if (options.length === 0) {
    issues.push(error(`${path}.options`, 'Tipo enum exige ao menos uma opção válida.'));
  }

  return options;
}

function normalizeRules(raw: unknown, path: string, issues: SchemaIssue[]): FieldRules | undefined {
  if (raw === undefined) return undefined;

  if (!isRecord(raw)) {
    issues.push(warning(`${path}.rules`, 'rules precisa ser um objeto.'));
    return undefined;
  }

  const rules: FieldRules = {
    min: readFiniteNumber(raw['min']),
    max: readFiniteNumber(raw['max']),
    minLength: readFiniteNumber(raw['minLength']),
    maxLength: readFiniteNumber(raw['maxLength']),
    step: readFiniteNumber(raw['step']),
    pattern: readString(raw['pattern']),
  };

  if (rules.pattern !== undefined) {
    try {
      new RegExp(rules.pattern);
    } catch {
      issues.push(warning(`${path}.rules.pattern`, 'Expressão regular inválida, regra ignorada.'));
      rules.pattern = undefined;
    }
  }

  if (rules.min !== undefined && rules.max !== undefined && rules.min > rules.max) {
    issues.push(warning(`${path}.rules`, 'min deve ser menor ou igual a max.'));
  }

  const hasRule = Object.values(rules).some((value) => value !== undefined);

  return hasRule ? rules : undefined;
}

function normalizeVisibility(
  raw: unknown,
  path: string,
  issues: SchemaIssue[],
): FieldVisibility | undefined {
  if (raw === undefined) return undefined;

  if (!isRecord(raw)) {
    issues.push(warning(`${path}.visibleWhen`, 'visibleWhen precisa ser um objeto.'));
    return undefined;
  }

  const field = readString(raw['field']);

  if (!field) {
    issues.push(warning(`${path}.visibleWhen.field`, 'visibleWhen exige o nome de outro campo.'));
    return undefined;
  }

  const inValues = Array.isArray(raw['in']) ? raw['in'] : undefined;

  return {
    field,
    equals: 'equals' in raw ? raw['equals'] : undefined,
    in: inValues,
  };
}

function normalizeDefault(
  raw: unknown,
  type: FieldType,
  options: readonly FieldOption[],
  multiple: boolean,
  path: string,
  issues: SchemaIssue[],
): unknown {
  if (raw === undefined) return undefined;

  const valid = isDefaultValid(raw, type, options, multiple);

  if (!valid) {
    issues.push(
      warning(`${path}.defaultValue`, `Valor padrão incompatível com o tipo "${type}", ignorado.`),
    );
    return undefined;
  }

  return raw;
}

function isDefaultValid(
  raw: unknown,
  type: FieldType,
  options: readonly FieldOption[],
  multiple: boolean,
): boolean {
  switch (type) {
    case 'string':
    case 'date':
    case 'time':
    case 'color':
      return typeof raw === 'string';
    case 'number':
      return typeof raw === 'number' && Number.isFinite(raw);
    case 'boolean':
      return typeof raw === 'boolean';
    case 'enum':
      if (multiple) {
        return (
          Array.isArray(raw) &&
          raw.every((item) => options.some((option) => Object.is(option.value, item)))
        );
      }

      return options.some((option) => Object.is(option.value, raw));
    case 'json':
      return true;
    case 'object':
      return isRecord(raw);
    case 'array':
      return Array.isArray(raw);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOptionValue(value: unknown): value is OptionValue {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function readFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function humanize(name: string): string {
  const spaced = name
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim();

  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function error(path: string, message: string): SchemaIssue {
  return { path, severity: 'error', message };
}

function warning(path: string, message: string): SchemaIssue {
  return { path, severity: 'warning', message };
}

function failure(path: string, message: string): SchemaParseResult {
  return { schema: null, issues: [error(path, message)] };
}
