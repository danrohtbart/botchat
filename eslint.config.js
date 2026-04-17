const nextConfig = require('eslint-config-next/core-web-vitals');

module.exports = [
  {
    ignores: ['amplify-codegen-temp/models/models/**', 'src/models/models/**'],
  },
  ...nextConfig,
  {
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='describe'][callee.property.name='skip']",
          message: 'Do not use describe.skip — disabling test suites violates project guardrails.',
        },
        {
          selector: "CallExpression[callee.object.name='test'][callee.property.name='skip']",
          message: 'Do not use test.skip — disabling tests violates project guardrails.',
        },
        {
          selector: "CallExpression[callee.object.name='it'][callee.property.name='skip']",
          message: 'Do not use it.skip — disabling tests violates project guardrails.',
        },
        {
          selector: "CallExpression[callee.name='xdescribe']",
          message: 'Do not use xdescribe — disabling test suites violates project guardrails.',
        },
        {
          selector: "CallExpression[callee.name='xit']",
          message: 'Do not use xit — disabling tests violates project guardrails.',
        },
        {
          selector: "CallExpression[callee.name='xtest']",
          message: 'Do not use xtest — disabling tests violates project guardrails.',
        },
      ],
    },
  },
];
