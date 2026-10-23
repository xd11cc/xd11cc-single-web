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
      const next = Object.fromEntries(
        parameters(configKey).map((parameter) => [
          parameter.key,
          current[parameter.key] ?? (parameter.type === 'BOOLEAN' ? false : ''),
        ]),
      )
      const template = configsByKey.get(configKey ?? '')?.expressionTemplate ?? ''
      const expression = template.replace(/\{\{([a-zA-Z][a-zA-Z0-9_.-]*)}}/g, (_, key: string) =>
        String(next[key] ?? ''),
      )
      return { expression, parameters: next }
    },
  }
}
