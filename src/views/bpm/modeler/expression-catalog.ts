import type {
  ExpressionParameterDefinition,
  WorkflowExpressionConfigVO,
} from '../expression-config/apis/type'
import type { ExpressionParameters } from './types'

export type ExpressionConfigOption = WorkflowExpressionConfigVO & { configKey: string }

export function createExpressionCatalog(configs: WorkflowExpressionConfigVO[]) {
  const validConfigs = configs.filter((config): config is ExpressionConfigOption =>
    Boolean(config.configKey),
  )
  const configsByKey = new Map(validConfigs.map((config) => [config.configKey, config]))

  function parameters(configKey?: string): ExpressionParameterDefinition[] {
    const schema = configsByKey.get(configKey ?? '')?.parameterSchema
    if (!schema) return []
    try {
      const parsed = JSON.parse(schema)
      if (!Array.isArray(parsed)) return []
      return parsed.filter((parameter): parameter is ExpressionParameterDefinition =>
        Boolean(
          parameter &&
            typeof parameter.key === 'string' &&
            typeof parameter.name === 'string' &&
            typeof parameter.type === 'string',
        ),
      )
    } catch {
      return []
    }
  }

  return {
    options(expressionType: string) {
      return validConfigs.filter((config) => config.expressionType === expressionType)
    },

    parameters,

    resolve(configKey: string | undefined, current: ExpressionParameters = {}) {
      const definitions = parameters(configKey)
      const next = Object.fromEntries(
        definitions.map((parameter) => [
          parameter.key,
          current[parameter.key] ?? (parameter.type === 'BOOLEAN' ? false : ''),
        ]),
      )
      // 必填参数没填全时返回空表达式，而不是把占位符替换成空串。
      // 否则 XML 里会出现 `${ > }` 这种残缺条件——既看不出缺什么，也没法执行。
      const incomplete = definitions.some(
        (parameter) => parameter.required && String(next[parameter.key] ?? '').trim() === '',
      )
      if (incomplete) {
        return { expression: '', parameters: next }
      }
      // 与后端保持一致：模板可以只写表达式主体，外壳 ${} 在这里统一补齐；
      // 占位符支持 {key}（推荐）与 {{key}}（兼容）。没有配置参数时按同名流程变量处理。
      const template = configsByKey.get(configKey ?? '')?.expressionTemplate ?? ''
      const trimmed = template.trim()
      const body =
        trimmed.startsWith('${') && trimmed.endsWith('}') && trimmed.length > 3
          ? trimmed.slice(2, -1)
          : trimmed
      const resolveToken = (key: string) => {
        const value = next[key]
        return value === undefined || value === null || String(value).trim() === ''
          ? key
          : String(value)
      }
      const rendered = body
        .replace(/\{\{([a-zA-Z][a-zA-Z0-9_.-]*)}}/g, (_, key: string) => resolveToken(key))
        .replace(/\{([a-zA-Z][a-zA-Z0-9_.-]*)\}/g, (_, key: string) => resolveToken(key))
      return { expression: `\${${rendered}}`, parameters: next }
    },
  }
}
