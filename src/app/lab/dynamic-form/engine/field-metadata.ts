import {
  FieldSchema,
  FieldType,
  FieldWidget,
  WIDGET_ACCEPTS,
  resolveWidget,
} from '../domain/field-schema.model';

export interface WidgetDoc {
  widget: FieldWidget;
  title: string;
  description: string;
  payload: string;
  accepts: readonly FieldType[];
}

export const WIDGET_CATALOG: readonly WidgetDoc[] = [
  {
    widget: 'text',
    title: 'Texto curto',
    description: 'Um input de uma linha para valores livres.',
    payload: 'string',
    accepts: WIDGET_ACCEPTS.text,
  },
  {
    widget: 'textarea',
    title: 'Texto longo',
    description: 'Área de texto multilinha para descrições e observações.',
    payload: 'string',
    accepts: WIDGET_ACCEPTS.textarea,
  },
  {
    widget: 'email',
    title: 'E-mail',
    description: 'Input com teclado e autocomplete de e-mail no navegador.',
    payload: 'string',
    accepts: WIDGET_ACCEPTS.email,
  },
  {
    widget: 'url',
    title: 'URL',
    description: 'Input otimizado para endereços web.',
    payload: 'string',
    accepts: WIDGET_ACCEPTS.url,
  },
  {
    widget: 'password',
    title: 'Senha',
    description: 'Campo mascarado, sem autocomplete de valor.',
    payload: 'string',
    accepts: WIDGET_ACCEPTS.password,
  },
  {
    widget: 'number',
    title: 'Número',
    description: 'Converte a entrada em number e aplica min, max e step.',
    payload: 'number | null',
    accepts: WIDGET_ACCEPTS.number,
  },
  {
    widget: 'range',
    title: 'Intervalo',
    description: 'Slider numérico de min até max.',
    payload: 'number | null',
    accepts: WIDGET_ACCEPTS.range,
  },
  {
    widget: 'select',
    title: 'Caixa de seleção',
    description: 'Lista suspensa com uma ou várias opções.',
    payload: 'OptionValue | OptionValue[]',
    accepts: WIDGET_ACCEPTS.select,
  },
  {
    widget: 'radio',
    title: 'Radio',
    description: 'Escolha única visível, com todas as opções na tela.',
    payload: 'OptionValue',
    accepts: WIDGET_ACCEPTS.radio,
  },
  {
    widget: 'checkbox-group',
    title: 'Caixas de seleção',
    description: 'Escolha múltipla; o valor é sempre um array.',
    payload: 'OptionValue[]',
    accepts: WIDGET_ACCEPTS['checkbox-group'],
  },
  {
    widget: 'switch',
    title: 'Interruptor',
    description: 'Booleano explícito para ligar e desligar.',
    payload: 'boolean',
    accepts: WIDGET_ACCEPTS.switch,
  },
  {
    widget: 'date',
    title: 'Data',
    description: 'Data no formato ISO retornado pelo input nativo.',
    payload: 'string (yyyy-mm-dd)',
    accepts: WIDGET_ACCEPTS.date,
  },
  {
    widget: 'time',
    title: 'Hora',
    description: 'Horário no formato HH:mm do input nativo.',
    payload: 'string (HH:mm)',
    accepts: WIDGET_ACCEPTS.time,
  },
  {
    widget: 'color',
    title: 'Cor',
    description: 'Seletor de cor que armazena hexadecimal.',
    payload: 'string (#rrggbb)',
    accepts: WIDGET_ACCEPTS.color,
  },
  {
    widget: 'json',
    title: 'JSON',
    description: 'Editor de JSON válido para estruturas livres.',
    payload: 'objeto | array | primitivo',
    accepts: WIDGET_ACCEPTS.json,
  },
  {
    widget: 'repeater',
    title: 'Lista repetível',
    description: 'FormArray com adicionar e remover itens.',
    payload: 'Array<item>',
    accepts: WIDGET_ACCEPTS.repeater,
  },
];

export function widgetDoc(widget: FieldWidget): WidgetDoc | undefined {
  return WIDGET_CATALOG.find((doc) => doc.widget === widget);
}

export function valueShapeOf(field: FieldSchema): string {
  switch (field.type) {
    case 'enum': {
      const shape = field.options.length > 0 ? optionShape(field.options) : 'OptionValue';

      return field.multiple ? `${shape}[]` : shape;
    }
    case 'array':
      return `${valueShapeOf(field.items)}[]`;
    case 'object':
      return '{ ... }';
    case 'json':
      return 'JSON';
    case 'boolean':
      return 'boolean';
    case 'number':
      return 'number';
    default:
      return 'string';
  }
}

export function describeRules(field: FieldSchema): readonly string[] {
  const rules: string[] = [];
  const extra = field.rules;

  if (field.required) {
    rules.push(field.type === 'boolean' ? 'precisa estar marcado' : 'obrigatório');
  }

  if (extra?.minLength !== undefined) rules.push(`mínimo de ${extra.minLength} caracteres`);
  if (extra?.maxLength !== undefined) rules.push(`máximo de ${extra.maxLength} caracteres`);
  if (extra?.pattern !== undefined) rules.push(`padrão /${extra.pattern}/`);
  if (extra?.min !== undefined) rules.push(`valor mínimo ${extra.min}`);
  if (extra?.max !== undefined) rules.push(`valor máximo ${extra.max}`);
  if (extra?.step !== undefined) rules.push(`incremento de ${extra.step}`);

  if (field.type === 'enum') rules.push('valor precisa existir em options');
  if (field.type === 'array' && field.minItems !== undefined) {
    rules.push(`mínimo de ${field.minItems} itens`);
  }
  if (field.type === 'array' && field.maxItems !== undefined) {
    rules.push(`máximo de ${field.maxItems} itens`);
  }

  return rules;
}

export function summarizeField(field: FieldSchema): string {
  const widget = resolveWidget(field);

  return widget ? `${field.type} → ${widget}` : field.type;
}

function optionShape(options: readonly { value: string | number | boolean }[]): string {
  const kinds = new Set(options.map((option) => typeof option.value));

  return [...kinds].join(' | ');
}
