/**
 * ESLint configuration file.
 *
 * @module
 */
import js from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import pluginImport from 'eslint-plugin-import';
import pluginTypescript from 'typescript-eslint';
import react from 'eslint-plugin-react';
import { defineConfig, globalIgnores } from 'eslint/config';

/**
 * Exports this module.
 *
 * @exports
 */
export default defineConfig([
  js.configs.recommended,
  jsdoc.configs['flat/recommended-typescript-error'],
  pluginImport.flatConfigs.recommended,
  pluginImport.flatConfigs.typescript,
  pluginTypescript.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  globalIgnores(['.webpack/', '**/generated/*']),
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    plugins: { jsdoc },
    rules: {
      '@typescript-eslint/no-duplicate-enum-values': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unsafe-declaration-merging': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { caughtErrorsIgnorePattern: '^_$' }],
      'import/default': 'off',
      'import/no-named-as-default-member': 'off',
      'jsdoc/check-tag-names': ['off', { definedTags: ['component', 'note'] }],
      'jsdoc/require-returns': 'off',
      'jsdoc/tag-lines': 'off',
      'no-constant-condition': ['error', { checkLoops: false }],
      'react/display-name': 'off',
      'react/prop-types': 'off',
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
      react: {
        version: 'detect',
      },
    },
  },
]);
