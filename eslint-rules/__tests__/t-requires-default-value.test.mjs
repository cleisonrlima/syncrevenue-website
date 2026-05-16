import { RuleTester } from 'eslint'
import tsParser from '@typescript-eslint/parser'
import rule from '../t-requires-default-value.mjs'

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
    },
  },
})

ruleTester.run('t-requires-default-value', rule, {
  valid: [
    { code: "t('nav.home', { defaultValue: 'Home' })" },
    { code: "t('nav.home', { defaultValue: 'Home', ns: 'common' })" },
    { code: "t('nav.home', { ns: 'common', defaultValue: 'Home' })" },
    { code: "t('nav.home', { defaultValue: '' })" },
    { code: "t('team.members', { returnObjects: true, defaultValue: [] })" },
    { code: "i18n.t('nav.home')" },
    { code: "someObj.t('nav.home')" },
    { code: "t(getDynamicKey())" },
    { code: "t(`prefix.${suffix}`)" },
  ],
  invalid: [
    {
      code: "t('nav.home')",
      errors: [{ messageId: 'missingDefaultValue' }],
    },
    {
      code: "t('nav.home', { ns: 'common' })",
      errors: [{ messageId: 'missingDefaultValue' }],
    },
    {
      code: "t('nav.home', { defaultValue: undefined })",
      errors: [{ messageId: 'missingDefaultValue' }],
    },
    {
      code: "t('nav.home', { defaultValue: null })",
      errors: [{ messageId: 'missingDefaultValue' }],
    },
    {
      code: "t('nav.home', 'not-an-object')",
      errors: [{ messageId: 'missingDefaultValue' }],
    },
  ],
})
