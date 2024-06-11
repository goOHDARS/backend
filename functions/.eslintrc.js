module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'google',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json', 'tsconfig.dev.json'],
    sourceType: 'module',
  },
  ignorePatterns: [
    '/lib/**/*', // Ignore built files.
    '.eslintrc.js',
  ],
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    quotes: ['error', 'single'],
    'import/no-unresolved': 0,
    indent: ['error', 2, { SwitchCase: 1 }],
    '@typescript-eslint/explicit-module-boundary-types': 0,
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/no-unused-vars': 0,
    '@typescript-eslint/ban-ts-comment': 0,
    'no-console': 0,
    semi: ['error', 'never'],
    'object-curly-spacing': 'off',
    'max-len': 'off',
    'operator-linebreak': 'off',
    'require-jsdoc': 'off',
    'import/namespace': 'off',
  },
}
