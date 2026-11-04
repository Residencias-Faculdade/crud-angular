import { normalizeFormSchema, parseFormSchema } from './schema-normalizer';

const YAML_SCHEMA = `
id: cadastro
title: Cadastro
sections:
  - id: dados
    title: Dados
    fields:
      - name: email
        label: E-mail
        type: string
        widget: email
        required: true
      - name: perfil
        label: Perfil
        type: enum
        defaultValue: editor
        options:
          - label: Editor
            value: editor
          - label: Leitor
            value: viewer
`;

describe('parseFormSchema', () => {
  it('normalizes a yaml schema', () => {
    const result = parseFormSchema(YAML_SCHEMA, 'yaml');

    expect(result.issues.filter((issue) => issue.severity === 'error')).toHaveLength(0);
    expect(result.schema?.sections).toHaveLength(1);
    expect(result.schema?.sections[0].fields[0].name).toBe('email');
    expect(result.schema?.sections[0].fields[0].required).toBe(true);
  });

  it('reports invalid json without throwing', () => {
    const result = parseFormSchema('{ "sections": [ }', 'json');

    expect(result.schema).toBeNull();
    expect(result.issues[0].severity).toBe('error');
    expect(result.issues[0].message).toContain('JSON inválido');
  });

  it('rejects unknown field types', () => {
    const result = normalizeFormSchema({
      id: 'teste',
      title: 'Teste',
      sections: [
        {
          id: 'dados',
          title: 'Dados',
          fields: [{ name: 'preco', label: 'Preço', type: 'money' }],
        },
      ],
    });

    expect(result.schema).toBeNull();
    expect(result.issues.some((issue) => issue.path === '$.sections[0].fields[0].type')).toBe(true);
  });

  it('drops incompatible widgets and keeps a warning', () => {
    const result = normalizeFormSchema({
      id: 'teste',
      title: 'Teste',
      sections: [
        {
          id: 'dados',
          title: 'Dados',
          fields: [{ name: 'nome', label: 'Nome', type: 'string', widget: 'radio' }],
        },
      ],
    });

    expect(result.schema).not.toBeNull();
    expect(result.schema?.sections[0].fields[0].widget).toBeUndefined();
    expect(result.issues.some((issue) => issue.severity === 'warning')).toBe(true);
  });

  it('requires options for enum fields', () => {
    const result = normalizeFormSchema({
      id: 'teste',
      title: 'Teste',
      sections: [
        {
          id: 'dados',
          title: 'Dados',
          fields: [{ name: 'status', label: 'Status', type: 'enum' }],
        },
      ],
    });

    expect(result.schema).toBeNull();
    expect(result.issues.some((issue) => issue.message.includes('options'))).toBe(true);
  });

  it('falls back to checkbox-group when multiple enum uses radio', () => {
    const result = normalizeFormSchema({
      id: 'teste',
      title: 'Teste',
      sections: [
        {
          id: 'dados',
          title: 'Dados',
          fields: [
            {
              name: 'tags',
              label: 'Tags',
              type: 'enum',
              widget: 'radio',
              multiple: true,
              options: [{ label: 'A', value: 'a' }],
            },
          ],
        },
      ],
    });

    const field = result.schema?.sections[0].fields[0];

    expect(field?.type).toBe('enum');
    expect(field?.type === 'enum' ? field.widget : undefined).toBe('checkbox-group');
  });
});
