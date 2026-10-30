import { describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { ELEMENT_CONTEXT } from '@/views/bpm/modeler/element-context'
import UserTaskPanel from '@/views/bpm/modeler/components/UserTaskPanel.vue'
import SequenceFlowPanel from '@/views/bpm/modeler/components/SequenceFlowPanel.vue'

/**
 * 元素面板的结构契约。
 *
 * 拆分后每个面板通过 inject 拿上下文，这里验证：
 *  1) 缺上下文时立刻报错（而不是渲染空表单）；
 *  2) 注入上下文后能渲染出对应的控件。
 */

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: 'zh-CN',
  messages: { 'zh-CN': {}, 'en-US': {} },
  missingWarn: false,
  fallbackWarn: false,
})

const form = {
  id: 't1',
  name: '审批',
  category: '',
  description: '',
  assignee: '',
  candidateUsers: [],
  candidateGroups: [],
  formKey: '',
  approvalMode: 'single',
  collection: '${approverList}',
  elementVariable: 'approver',
  serviceClass: '',
  delegateExpression: '',
  condition: '',
  conditionConfigKey: '',
  conditionParameters: {},
  collectionConfigKey: '',
  collectionParameters: {},
  assigneeConfigKey: '',
  assigneeParameters: {},
  serviceExpressionConfigKey: '',
  serviceExpressionParameters: {},
}

const expressionCatalog = computed(() => ({
  resolve: () => ({ parameters: {}, expression: '' }),
  options: () => [],
  parameters: () => [],
}))

function makeContext(overrides: Record<string, any> = {}) {
  return {
    element: computed(() => ({ type: 'bpmn:UserTask' })),
    form,
    isProcess: computed(() => false),
    isUserTask: computed(() => true),
    isServiceTask: computed(() => false),
    isSequenceFlow: computed(() => false),
    update: vi.fn(),
    updateProcessDescription: vi.fn(),
    updateCandidateUsers: vi.fn(),
    updateCandidateGroups: vi.fn(),
    updateApprovalConfig: vi.fn(),
    changeApprovalMode: vi.fn(),
    updateCondition: vi.fn(),
    expressionCatalog,
    processVariableOptions: computed(() => []),
    applyCollectionConfig: vi.fn(),
    applyConditionConfig: vi.fn(),
    applyAssigneeExpression: vi.fn(),
    processCategoryOptions: ref([]),
    candidateUserOptions: ref([]),
    candidateGroupOptions: ref([]),
    candidateUsersLoading: ref(false),
    candidateGroupsLoading: ref(false),
    loadCandidateUsers: vi.fn(),
    loadCandidateGroups: vi.fn(),
    approvalModeOptions: [
      { value: 'single', labelKey: 'a', descriptionKey: 'a', icon: 'x' },
      { value: 'countersign', labelKey: 'b', descriptionKey: 'b', icon: 'x' },
      { value: 'orsign', labelKey: 'c', descriptionKey: 'c', icon: 'x' },
    ],
    listeners: ref([]),
    ...overrides,
  }
}

const stubs = {
  Icon: true,
  'el-form-item': { template: '<div class="form-item"><slot /></div>' },
  'el-input': { template: '<input />' },
  'el-select': { template: '<div class="el-select"><slot /></div>' },
  'el-option': { template: '<div />' },
  'el-switch': { template: '<div />' },
  'el-button': { template: '<button><slot /></button>' },
  'el-tooltip': { template: '<span><slot /></span>' },
}

describe('元素面板', () => {
  it('缺少上下文时立刻报错', () => {
    expect(() => mount(UserTaskPanel, { global: { plugins: [i18n], stubs } })).toThrow(
      /属性子面板必须渲染在 PropertyPanel 内/,
    )
  })

  it('用户任务面板渲染三种审批模式', () => {
    const wrapper = mount(UserTaskPanel, {
      global: {
        plugins: [i18n],
        stubs,
        provide: { [ELEMENT_CONTEXT as any]: makeContext() },
      },
    })

    expect(wrapper.findAll('.approval-mode-card')).toHaveLength(3)
  })

  it('用户任务面板点击审批模式卡片会调用 changeApprovalMode', async () => {
    const ctx = makeContext()
    const wrapper = mount(UserTaskPanel, {
      global: { plugins: [i18n], stubs, provide: { [ELEMENT_CONTEXT as any]: ctx } },
    })

    await wrapper.findAll('.approval-mode-card')[1].trigger('click')

    expect(ctx.changeApprovalMode).toHaveBeenCalledWith('countersign')
  })

  it('连线面板渲染条件表达式配置区', () => {
    const wrapper = mount(SequenceFlowPanel, {
      global: {
        plugins: [i18n],
        stubs,
        provide: {
          [ELEMENT_CONTEXT as any]: makeContext({
            isUserTask: computed(() => false),
            isSequenceFlow: computed(() => true),
          }),
        },
      },
    })

    expect(wrapper.find('.condition-section').exists()).toBe(true)
    expect(wrapper.find('.condition-badge').exists()).toBe(true)
  })
})
