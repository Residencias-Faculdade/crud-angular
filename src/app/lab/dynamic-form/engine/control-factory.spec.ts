import { FormArray, FormGroup } from '@angular/forms';

import { normalizeFormSchema } from '../domain/schema-normalizer';
import { buildFormGroup } from './control-factory';

function buildTestForm(): FormGroup {
  const result = normalizeFormSchema({
    id: 'teste',
    title: 'Teste',
    sections: [
      {
        id: 'dados',
        title: 'Dados',
        fields: [
          { name: 'nome', label: 'Nome', type: 'string', required: true },
          { name: 'idade', label: 'Idade', type: 'number', rules: { min: 18, max: 120 } },
          {
            name: 'perfil',
            label: 'Perfil',
            type: 'enum',
            defaultValue: 'editor',
            options: [
              { label: 'Editor', value: 'editor' },
              { label: 'Leitor', value: 'viewer' },
            ],
          },
          {
            name: 'tags',
            label: 'Tags',
            type: 'enum',
            multiple: true,
            defaultValue: ['a'],
            options: [
              { label: 'A', value: 'a' },
              { label: 'B', value: 'b' },
            ],
          },
          { name: 'ativo', label: 'Ativo', type: 'boolean', defaultValue: true },
          {
            name: 'endereco',
            label: 'Endereço',
            type: 'object',
            fields: [{ name: 'cidade', label: 'Cidade', type: 'string' }],
          },
          {
            name: 'projetos',
            label: 'Projetos',
            type: 'array',
            items: {
              name: 'item',
              label: 'Item',
              type: 'object',
              fields: [{ name: 'titulo', label: 'Título', type: 'string', required: true }],
            },
          },
        ],
      },
    ],
  });

  if (!result.schema) throw new Error('schema should be valid');

  return buildFormGroup(result.schema);
}

describe('buildFormGroup', () => {
  it('creates groups and arrays from the schema', () => {
    const form = buildTestForm();

    expect(form.get('endereco')).toBeInstanceOf(FormGroup);
    expect(form.get('projetos')).toBeInstanceOf(FormArray);
  });

  it('applies defaults and empty values', () => {
    const form = buildTestForm();

    expect(form.get('nome')?.value).toBe('');
    expect(form.get('idade')?.value).toBeNull();
    expect(form.get('perfil')?.value).toBe('editor');
    expect(form.get('tags')?.value).toEqual(['a']);
    expect(form.get('ativo')?.value).toBe(true);
    expect(form.get('endereco.cidade')?.value).toBe('');
  });

  it('wires validators from the rules', () => {
    const form = buildTestForm();

    expect(form.get('nome')?.valid).toBe(false);

    form.get('nome')?.setValue('Ana');
    form.get('idade')?.setValue(15);

    expect(form.get('nome')?.valid).toBe(true);
    expect(form.get('idade')?.hasError('min')).toBe(true);

    form.get('idade')?.setValue(30);

    expect(form.get('idade')?.valid).toBe(true);
  });

  it('validates enum values against the declared options', () => {
    const form = buildTestForm();

    form.get('perfil')?.setValue('desconhecido');

    expect(form.get('perfil')?.hasError('option')).toBe(true);
  });
});
