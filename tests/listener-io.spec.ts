import { describe, expect, it } from 'vitest'
import {
  cloneListener,
  createEmptyListener,
  parseJsonArray,
  parseJsonObject,
  readListeners,
} from '@/views/bpm/modeler/listener-io'
import type { ListenerConfig } from '@/views/bpm/modeler/types'

/**
 * 监听器数据转换的纯函数测试。
 *
 * 这些函数决定「bpmn-js 扩展属性 ↔ 表单对象」的映射方向，
 * 之前内联在 1,567 行的 PropertyPanel 里，无法单独验证。
 */

const businessObject = (values: any[]) => ({ extensionElements: { values } })

describe('createEmptyListener', () => {
  it('任务监听器默认事件是 create', () => {
    const listener = createEmptyListener()
    expect(listener.listenerType).toBe('task')
    expect(listener.event).toBe('create')
    expect(listener.implementationType).toBe('class')
    expect(listener.fields).toEqual([])
    expect(listener.id.startsWith('listener_')).toBe(true)
  })

  it('执行监听器默认事件是 start', () => {
    expect(createEmptyListener('execution').event).toBe('start')
  })
})

describe('parseJsonObject / parseJsonArray', () => {
  it('空值与非法 JSON 都降级为空容器', () => {
    expect(parseJsonObject()).toEqual({})
    expect(parseJsonObject('not json')).toEqual({})
    expect(parseJsonArray()).toEqual([])
    expect(parseJsonArray('{"a":1}')).toEqual([]) // 不是数组
  })

  it('合法 JSON 正常解析', () => {
    expect(parseJsonObject('{"a":1}')).toEqual({ a: 1 })
    expect(parseJsonArray('[{"key":"x"}]')).toEqual([{ key: 'x' }])
  })
})

describe('readListeners', () => {
  it('没有扩展元素时返回空数组', () => {
    expect(readListeners(null)).toEqual([])
    expect(readListeners({})).toEqual([])
  })

  it('只识别 TaskListener / ExecutionListener', () => {
    const result = readListeners(
      businessObject([
        { $type: 'flowable:FormProperty', id: 'x' },
        { $type: 'flowable:TaskListener', event: 'create', class: 'com.A' },
        { $type: 'flowable:ExecutionListener', event: 'end', class: 'com.B' },
      ]),
    )

    expect(result).toHaveLength(2)
    expect(result.map((l) => l.listenerType)).toEqual(['task', 'execution'])
  })

  it('三种实现方式被归一化为 implementationType', () => {
    const result = readListeners(
      businessObject([
        { $type: 'flowable:TaskListener', event: 'create', class: 'com.ClassImpl' },
        { $type: 'flowable:TaskListener', event: 'create', delegateExpression: '${bean}' },
        { $type: 'flowable:TaskListener', event: 'create', expression: '${1 + 1}' },
      ]),
    )

    expect(result.map((l) => l.implementationType)).toEqual([
      'class',
      'delegateExpression',
      'expression',
    ])
    expect(result.map((l) => l.implementation)).toEqual(['com.ClassImpl', '${bean}', '${1 + 1}'])
  })

  it('缺少 event 时按监听器类型给默认值', () => {
    const result = readListeners(
      businessObject([
        { $type: 'flowable:TaskListener', class: 'a' },
        { $type: 'flowable:ExecutionListener', class: 'b' },
      ]),
    )

    expect(result.map((l) => l.event)).toEqual(['create', 'start'])
  })

  it('字段区分 stringValue / expression 并解析参数', () => {
    const result = readListeners(
      businessObject([
        {
          $type: 'flowable:TaskListener',
          event: 'create',
          class: 'a',
          expressionParameters: '{"k":"v"}',
          fields: [
            { name: 'plain', stringValue: 'abc' },
            {
              name: 'expr',
              expression: '${x}',
              expressionConfigKey: 'cfg-1',
              expressionParameters: '{"n":1}',
            },
          ],
        },
      ]),
    )

    const [listener] = result
    expect(listener.expressionParameters).toEqual({ k: 'v' })
    expect(listener.fields.map((f) => f.valueType)).toEqual(['stringValue', 'expression'])
    expect(listener.fields.map((f) => f.value)).toEqual(['abc', '${x}'])
    expect(listener.fields[1].expressionConfigKey).toBe('cfg-1')
    expect(listener.fields[1].expressionParameters).toEqual({ n: 1 })
  })
})

describe('cloneListener', () => {
  it('字段数组与参数对象是深拷贝', () => {
    const original: ListenerConfig = {
      ...createEmptyListener(),
      expressionParameters: { a: '1' },
      fields: [
        { name: 'f', valueType: 'stringValue', value: 'v', expressionParameters: { b: '2' } },
      ],
    }

    const copy = cloneListener(original)
    copy.fields[0].name = 'changed'
    copy.expressionParameters!.a = 'changed'

    expect(original.fields[0].name).toBe('f')
    expect(original.expressionParameters!.a).toBe('1')
    expect(copy.fields).not.toBe(original.fields)
  })
})
