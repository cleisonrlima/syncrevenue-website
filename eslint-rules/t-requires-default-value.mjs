/**
 * t-requires-default-value
 *
 * Flags any `t('key')` callsite that lacks `{ defaultValue: '...' }` in the
 * options-object argument. i18next returns the key string itself on a miss,
 * which produces silently broken UI. Forcing `defaultValue` makes the fallback
 * explicit.
 *
 * Detection:
 *   - callee is the bare identifier `t` (not `i18n.t` / `someObj.t` — those
 *     are accepted out-of-scope).
 *   - first argument is a string literal OR a template literal with no
 *     interpolation expressions. Dynamic keys (`t(getKey())`, `t(\`pre.${x}\`)`)
 *     are accepted out-of-scope.
 *   - second argument must be an ObjectExpression containing a `defaultValue`
 *     property whose value is NOT `undefined` and NOT `null`. Empty string
 *     `defaultValue: ''` is valid (legitimate "render nothing on miss").
 *
 * Out-of-scope skips:
 *   - `i18n.t(...)`, `someObj.t(...)` — member expressions
 *   - `t(getDynamicKey())` — non-literal first arg
 *   - `t(\`pre.${suffix}\`)` — template literal with expressions
 *
 * Linked from the error message:
 *   - vault/Code/i18n.md
 *   - vault/Code/Patterns-Gallery.md §7
 */

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        "Every t('key') call must include `{ defaultValue: '...' }` to avoid silent i18next misses rendering the raw key.",
      recommended: true,
    },
    schema: [],
    messages: {
      missingDefaultValue:
        "i18n: t('{{key}}') is missing { defaultValue: '...' }. See vault/Code/i18n.md and Patterns-Gallery §7.",
      missingDefaultValueDynamic:
        "i18n: t(...) is missing { defaultValue: '...' }. See vault/Code/i18n.md and Patterns-Gallery §7.",
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== 'Identifier' || node.callee.name !== 't') {
          return
        }

        const firstArg = node.arguments[0]
        if (!firstArg) return

        let keyText
        if (firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
          keyText = firstArg.value
        } else if (
          firstArg.type === 'TemplateLiteral' &&
          firstArg.expressions.length === 0 &&
          firstArg.quasis.length === 1
        ) {
          keyText = firstArg.quasis[0].value.cooked
        } else {
          return
        }

        const optsArg = node.arguments[1]
        const report = () =>
          context.report({
            node,
            messageId: 'missingDefaultValue',
            data: { key: keyText },
          })

        if (!optsArg || optsArg.type !== 'ObjectExpression') {
          report()
          return
        }

        const defaultValueProp = optsArg.properties.find((prop) => {
          if (prop.type !== 'Property') return false
          if (prop.computed) {
            return (
              prop.key.type === 'Literal' && prop.key.value === 'defaultValue'
            )
          }
          if (prop.key.type === 'Identifier') {
            return prop.key.name === 'defaultValue'
          }
          if (prop.key.type === 'Literal') {
            return prop.key.value === 'defaultValue'
          }
          return false
        })

        if (!defaultValueProp) {
          report()
          return
        }

        const value = defaultValueProp.value
        if (
          value.type === 'Identifier' &&
          value.name === 'undefined'
        ) {
          report()
          return
        }
        if (value.type === 'Literal' && value.value === null) {
          report()
          return
        }
      },
    }
  },
}

export default rule
