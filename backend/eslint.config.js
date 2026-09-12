import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  // Inherit default ESLint and TypeScript recommended rules
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Global language/environment settings
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },

  // Project-specific rules
  {
    files: ['src/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Folders ESLint should never lint
  {
    ignores: ['dist/', 'node_modules/'],
  },

  // Must be last - turns off any ESLint rule that would conflict with Prettier
  eslintConfigPrettier,
);
