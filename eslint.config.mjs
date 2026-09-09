// COMPATIBILIDADE COM ATIVIDADENGX - ESLint
// ARQUIVO NOVO (antes nao existia). Garante qualidade solida para micro frontend isolado,
// mesmo padrao rigoroso de lint que seria exigido para plugar na shell sem warnings.
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'public/**'],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: { projectService: true },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-inferrable-types': 'off',
      'no-console': 'off',
    },
  }
);
