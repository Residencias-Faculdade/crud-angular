import { normalizeFormSchema } from '../domain/schema-normalizer';
import { buildFieldIndex } from './field-index';

describe('buildFieldIndex', () => {
  it('walks objects and array item templates', () => {
    const result = normalizeFormSchema({
      id: 'teste',
      title: 'Teste',
      sections: [
        {
          id: 'dados',
          title: 'Dados',
          fields: [
            {
              name: 'empresa',
              label: 'Empresa',
              type: 'object',
              fields: [{ name: 'nome', label: 'Nome', type: 'string' }],
            },
            {
              name: 'projetos',
              label: 'Projetos',
              type: 'array',
              items: {
                name: 'item',
                label: 'Item',
                type: 'object',
                fields: [{ name: 'titulo', label: 'Título', type: 'string' }],
              },
            },
          ],
        },
      ],
    });

    if (!result.schema) throw new Error('schema should be valid');

    const paths = buildFieldIndex(result.schema).map((entry) => entry.path);

    expect(paths).toEqual(['empresa', 'empresa.nome', 'projetos', 'projetos[].titulo']);
  });

  it('marks items from a repeater as templates', () => {
    const result = normalizeFormSchema({
      id: 'teste',
      title: 'Teste',
      sections: [
        {
          id: 'dados',
          title: 'Dados',
          fields: [
            {
              name: 'itens',
              label: 'Itens',
              type: 'array',
              items: {
                name: 'item',
                label: 'Item',
                type: 'object',
                fields: [{ name: 'nome', label: 'Nome', type: 'string' }],
              },
            },
          ],
        },
      ],
    });

    if (!result.schema) throw new Error('schema should be valid');

    const entry = buildFieldIndex(result.schema).find((item) => item.path === 'itens[].nome');

    expect(entry?.isItemTemplate).toBe(true);
  });
});
