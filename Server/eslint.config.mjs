// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      "prettier/prettier": ["error", { endOfLine: "auto" }],

      // ── Prisma raw SQL injection prevention ──────────────────────────────
      // $queryRaw used as a regular function call allows string interpolation
      // and is vulnerable to SQL injection. Always use the tagged template form:
      //   SAFE:    prisma.$queryRaw`SELECT * FROM "User" WHERE id = ${userId}`
      //   UNSAFE:  prisma.$queryRaw(`SELECT * FROM "User" WHERE id = ${userId}`)
      // $queryRawUnsafe is always dangerous regardless of usage.
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='$queryRaw']",
          message:
            'Use $queryRaw as a tagged template literal, not a function call. ' +
            'Function call form allows SQL injection via string interpolation.',
        },
        {
          selector: "CallExpression[callee.property.name='$queryRawUnsafe']",
          message:
            '$queryRawUnsafe is not allowed — it bypasses SQL injection protection entirely. Use $queryRaw`...` instead.',
        },
        {
          selector: "TaggedTemplateExpression[tag.property.name='$queryRawUnsafe']",
          message:
            '$queryRawUnsafe is not allowed — it bypasses SQL injection protection entirely. Use $queryRaw`...` instead.',
        },
      ],
    },
  },
);
