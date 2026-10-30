import { describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { readApprovalMode, useElementForm } from '@/views/bpm/modeler/useElementForm'

/**
 * useElementForm 的接口测试。
 *
 * 这个模块是「bpmn-js 业务对象 ↔ 面板 form」的桥：
 * 读靠 get('flowable:xxx')，写靠 emit 给父组件。测试用假 businessObject 驱动，
 * 不需要真的起 bpmn-js。
 */

function makeBusinessObject(attrs: Record<string, any> = {}, extra: Record<string, any> = {}) {
  const businessObject: any = {
    $type: 'bpmn:UserTask',
    id: 'Task_1',
    name: '审批节点',
    documentation: [{ text: '节点说明' }],
    get: (key: string) => attrs[key],
    loopCharacteristics: null,
    conditionExpression: null,
    ...extra,
  }
  return businessObject
}

function setup(initialElement: any) {
  const element = ref(initialElement)
  const update = vi.fn()
  const updateApproval = vi.fn()
  let api!: ReturnType<typeof useElementForm>

  mount(
    defineComponent({
      setup() {
        api = useElementForm(() => element.value, { update, updateApproval })
        return () => null
      },
    }),
  )

  return { api, element, update, updateApproval }
}

describe('useElementForm 读取', () => {
  it('同步基础字段（id / name / 文档说明）', () => {
    const { api } = setup({
      businessObject: makeBusinessObject({ 'flowable:category': 'cat-1' }),
    })

    expect(api.form.id).toBe('Task_1')
    expect(api.form.name).toBe('审批节点')
    expect(api.form.category).toBe('cat-1')
    expect(api.form.description).toBe('节点说明')
  })

  it('逗号分隔的候选人被拆成数组', () => {
    const { api } = setup({
      businessObject: makeBusinessObject({
        'flowable:candidateUsers': ' u1, u2 ,, u3 ',
        'flowable:candidateGroups': 'g1',
      }),
    })

    expect(api.form.candidateUsers).toEqual(['u1', 'u2', 'u3'])
    expect(api.form.candidateGroups).toEqual(['g1'])
  })

  it('流程变量从流程根节点读取（需要向上遍历 $parent）', () => {
    const businessObject = makeBusinessObject()
    businessObject.$parent = {
      $type: 'bpmn:Process',
      get: (key: string) =>
        key === 'flowable:variables' ? '[{"key":"amount","name":"金额"}]' : undefined,
    }

    const { api } = setup({ businessObject })

    expect(api.processVariables.value).toEqual([{ key: 'amount', name: '金额' }])
  })

  it('切换元素时表单跟着刷新', async () => {
    const { api, element } = setup({ businessObject: makeBusinessObject() })
    expect(api.form.name).toBe('审批节点')

    element.value = {
      businessObject: makeBusinessObject({}, { id: 'Task_2', name: '复核节点' }),
    }
    await nextTick()

    expect(api.form.id).toBe('Task_2')
    expect(api.form.name).toBe('复核节点')
  })
})

describe('readApprovalMode', () => {
  it('优先使用 flowable:approvalMode 扩展属性', () => {
    const bo = makeBusinessObject({ 'flowable:approvalMode': 'orsign' })
    expect(readApprovalMode(bo)).toBe('orsign')
  })

  it('没有多实例时是 single', () => {
    expect(readApprovalMode(makeBusinessObject())).toBe('single')
  })

  it('有多实例且含 orsign 完成条件时是 orsign，否则 countersign', () => {
    const orsign = makeBusinessObject(
      {},
      {
        loopCharacteristics: { completionCondition: { body: '${nrOfCompletedInstances > 0}' } },
      },
    )
    const countersign = makeBusinessObject(
      {},
      {
        loopCharacteristics: { completionCondition: null },
      },
    )

    expect(readApprovalMode(orsign)).toBe('orsign')
    expect(readApprovalMode(countersign)).toBe('countersign')
  })
})

describe('useElementForm 写入', () => {
  it('update 把单个字段发给父组件', () => {
    const { api, update } = setup({ businessObject: makeBusinessObject() })

    api.form.name = '新名字'
    api.update('name')

    expect(update).toHaveBeenCalledWith({ name: '新名字' })
  })

  it('空值转成 undefined，避免把空字符串写进 BPMN', () => {
    const { api, update } = setup({ businessObject: makeBusinessObject() })

    api.form.name = ''
    api.update('name')

    expect(update).toHaveBeenCalledWith({ name: undefined })
  })

  it('未知属性不触发写入', () => {
    const { api, update } = setup({ businessObject: makeBusinessObject() })

    api.update('flowable:unknown')

    expect(update).not.toHaveBeenCalled()
  })

  it('候选人写回时拼接成逗号并清空表达式字段', () => {
    const { api, update } = setup({ businessObject: makeBusinessObject() })

    api.form.candidateUsers = ['u1', 'u2']
    api.updateCandidateUsers()

    expect(update).toHaveBeenCalledWith({
      'flowable:candidateUsers': 'u1,u2',
      'flowable:candidateUsersExpressionConfigKey': undefined,
      'flowable:candidateUsersExpressionParameters': undefined,
    })
  })

  it('切换审批模式会补默认集合变量并通知父组件', () => {
    const { api, updateApproval } = setup({ businessObject: makeBusinessObject() })

    api.form.collection = ''
    api.changeApprovalMode('countersign')

    expect(api.form.approvalMode).toBe('countersign')
    expect(api.form.collection).toBe('${approverList}')
    expect(updateApproval).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'countersign', elementVariable: 'approver' }),
    )
  })

  it('updateCondition 组装 FormalExpression', () => {
    const { api, update } = setup({ businessObject: makeBusinessObject() })

    api.form.condition = '${amount > 100}'
    api.form.conditionConfigKey = 'cfg-1'
    api.form.conditionParameters = { amount: 100 }
    api.updateCondition()

    expect(update).toHaveBeenCalledWith({
      conditionExpression: { $type: 'bpmn:FormalExpression', body: '${amount > 100}' },
      'flowable:expressionConfigKey': 'cfg-1',
      'flowable:expressionParameters': JSON.stringify({ amount: 100 }),
    })
  })
})
