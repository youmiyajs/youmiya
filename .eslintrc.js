module.exports = {
  root: true,
  extends: ['@modern-js'],
  parserOptions: {
    project: ['./packages/*/tsconfig.json'],
  },
  rules: {
    'no-param-reassign': ['off'],
    'max-classes-per-file': ['off'],

    '@typescript-eslint/no-parameter-properties': ['off'],
    '@typescript-eslint/method-signature-style': ['off'],
  },
};
