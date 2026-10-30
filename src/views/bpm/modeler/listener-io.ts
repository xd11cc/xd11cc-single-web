import type { ListenerConfig } from './types'

/**
 * 监听器与 bpmn-js 扩展属性之间的纯数据转换。
 *
 * 从 PropertyPanel 里抽出来的原因：这几个函数是纯函数（输入 businessObject / JSON 字符串，
 * 输出普通对象），但此前内联在 1,567 行的组件里，既无法单独测试，也把「数据格式」
 * 和「表单渲染」混在一起。抽出来后，格式变化只改这里，面板组件只负责展示。
 */

/** 新建一个监听器草稿：id 只是为了在列表里区分，保存时会重建 */
export function createEmptyListener(
  listenerType: ListenerConfig['listenerType'] = 'task',
): ListenerConfig {
  return {
    id: `listener_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    listenerType,
    event: listenerType === 'task' ? 'create' : 'start',
    implementationType: 'class',
    implementation: '',
    expressionConfigKey: '',
    expressionParameters: {},
    fields: [],
  }
}

/** 深拷贝：避免编辑弹窗直接改到列表里的对象 */
export function cloneListener(listener: ListenerConfig): ListenerConfig {
  return {
    ...listener,
    expressionParameters: { ...(listener.expressionParameters ?? {}) },
    fields: (listener.fields ?? []).map((field) => ({
      ...field,
      expressionParameters: { ...(field.expressionParameters ?? {}) },
    })),
  }
}

/** 解析 JSON 对象；空值与非法内容一律返回空对象，不抛错 */
export function parseJsonObject(value?: string): Record<string, any> {
  if (!value) return {}
  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

/** 解析 JSON 数组；非数组内容一律返回空数组，不抛错 */
export function parseJsonArray<T = any>(value?: string): T[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * 从 bpmn-js 元素上读出监听器列表。
 *
 * Flowable 把监听器挂在 extensionElements 下，且有多种实现方式
 * （class / delegateExpression / expression），需要归一化成一个结构。
 */
export function readListeners(businessObject: any): ListenerConfig[] {
  return (businessObject?.extensionElements?.values ?? [])
    .filter(
      (value: any) =>
        value.$type === 'flowable:TaskListener' || value.$type === 'flowable:ExecutionListener',
    )
    .map((value: any, index: number) => {
      const implementationType = value.class
        ? 'class'
        : value.delegateExpression
          ? 'delegateExpression'
          : 'expression'
      const isTaskListener = value.$type === 'flowable:TaskListener'
      return {
        id: `${value.$type}_${index}_${value.event ?? 'event'}`,
        listenerType: isTaskListener ? 'task' : 'execution',
        event: value.event ?? (isTaskListener ? 'create' : 'start'),
        implementationType,
        implementation: value[implementationType] ?? '',
        expressionConfigKey: value.expressionConfigKey ?? '',
        expressionParameters: parseJsonObject(value.expressionParameters),
        fields: (value.fields ?? []).map((field: any) => ({
          name: field.name ?? '',
          valueType: field.expression !== undefined ? 'expression' : 'stringValue',
          value: field.expression ?? field.stringValue ?? '',
          expressionConfigKey: field.expressionConfigKey ?? '',
          expressionParameters: parseJsonObject(field.expressionParameters),
        })),
      } as ListenerConfig
    })
}
