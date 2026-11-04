import { FieldSchema } from '../domain/field-schema.model';
import { isFieldVisible, readPath } from './visibility';

const conditionalField = {
  name: 'cpf',
  label: 'CPF',
  type: 'string',
  visibleWhen: { field: 'tipoPessoa', equals: 'pf' },
} satisfies FieldSchema;

const listField = {
  name: 'cpf',
  label: 'CPF',
  type: 'string',
  visibleWhen: { field: 'tipoPessoa', in: ['pf', 'estrangeiro'] },
} satisfies FieldSchema;

describe('visibility', () => {
  it('resolves nested paths', () => {
    expect(readPath({ empresa: { contato: { email: 'a@b.com' } } }, 'empresa.contato.email')).toBe(
      'a@b.com',
    );
    expect(readPath({ itens: [{ nome: 'x' }] }, 'itens.0.nome')).toBe('x');
  });

  it('compares equality conditions', () => {
    expect(isFieldVisible(conditionalField, { tipoPessoa: 'pf' })).toBe(true);
    expect(isFieldVisible(conditionalField, { tipoPessoa: 'pj' })).toBe(false);
  });

  it('supports a list of accepted values', () => {
    expect(isFieldVisible(listField, { tipoPessoa: 'estrangeiro' })).toBe(true);
    expect(isFieldVisible(listField, { tipoPessoa: 'pj' })).toBe(false);
  });

  it('treats a condition without value as truthy', () => {
    const truthyField = {
      name: 'detalhe',
      label: 'Detalhe',
      type: 'string',
      visibleWhen: { field: 'newsletter' },
    } satisfies FieldSchema;

    expect(isFieldVisible(truthyField, { newsletter: true })).toBe(true);
    expect(isFieldVisible(truthyField, { newsletter: false })).toBe(false);
  });
});
