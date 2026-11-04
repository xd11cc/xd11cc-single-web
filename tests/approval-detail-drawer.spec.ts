import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { createI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import ApprovalDetailDrawer from '@/views/approval/components/ApprovalDetailDrawer.vue'
import {
  approveTask,
  getProcessDetail,
  getRejectableNodes,
  rejectTask,
} from '@/views/approval/apis'

vi.mock('@/views/approval/apis', () => ({
  getProcessDetail: vi.fn(),
  getRejectableNodes: vi.fn(),
  approveTask: vi.fn(),
  rejectTask: vi.fn(),
  delegateTask: vi.fn(),
  cancelProcess: vi.fn(),
}))

vi.mock('@/common/composables/useDict', () => ({
  useDict: () => ({ getDictItem: () => undefined }),
}))

vi.mock('element-plus', () => ({
  ElMessage: { warning: vi.fn(), success: vi.fn(), error: vi.fn() },
}))

function deferred<Value>() {
  let resolve!: (value: Value) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<Value>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

type DetailResponse = Awaited<ReturnType<typeof getProcessDetail>>
type NodeResponse = Awaited<ReturnType<typeof getRejectableNodes>>
type ActionResponse = Awaited<ReturnType<typeof approveTask>>

function detailResponse(instanceId = 'p1', taskId = 't1'): DetailResponse {
  return {
    code: 200,
    msg: 'ok',
    data: {
      processInstanceId: instanceId,
      title: `详情-${instanceId}`,
      currentTasks: [{ taskId, processInstanceId: instanceId, taskName: `任务-${taskId}` }],
    },
  }
}

const DrawerStub = defineComponent({
  name: 'ElDrawer',
  props: ['modelValue'],
  emits: ['update:modelValue', 'closed'],
  template: '<div><slot name="header" /><slot /><slot name="footer" /></div>',
})

const ButtonStub = {
  props: ['disabled', 'loading'],
  template: '<button :disabled="disabled || loading"><slot /></button>',
}

const InputStub = {
  props: ['modelValue', 'disabled'],
  emits: ['update:modelValue'],
  template:
    '<textarea :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)" />',
}

const SelectStub = {
  props: ['modelValue', 'disabled', 'loading'],
  emits: ['update:modelValue'],
  template:
    '<select :value="modelValue" :disabled="disabled || loading" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>',
}

const wrappers: VueWrapper[] = []

function mountDrawer(options: { visible?: boolean; instanceId?: string; taskId?: string } = {}) {
  const visible = ref(options.visible ?? true)
  const instanceId = ref(options.instanceId ?? 'p1')
  const taskId = ref(options.taskId ?? 't1')
  const approved = vi.fn()
  const rejected = vi.fn()
  const parent = defineComponent({
    setup: () => () =>
      h(ApprovalDetailDrawer, {
        modelValue: visible.value,
        processInstanceId: instanceId.value,
        taskId: taskId.value,
        'onUpdate:modelValue': (value: boolean) => {
          visible.value = value
        },
        onApproved: approved,
        onRejected: rejected,
      }),
  })
  const wrapper = mount(parent, {
    global: {
      plugins: [
        createI18n({
          legacy: false,
          globalInjection: true,
          locale: 'zh-CN',
          messages: { 'zh-CN': {} },
          missingWarn: false,
          fallbackWarn: false,
        }),
      ],
      directives: { 'table-loading': {} },
      stubs: {
        'el-drawer': DrawerStub,
        'el-button': ButtonStub,
        'el-form': { template: '<div><slot /></div>' },
        'el-form-item': { template: '<div><slot /></div>' },
        'el-tag': { template: '<span><slot /></span>' },
        'el-input': InputStub,
        'el-select': SelectStub,
        'el-option': {
          props: ['value', 'label'],
          template: '<option :value="value">{{ label }}</option>',
        },
        'el-empty': {
          props: ['description'],
          template: '<div class="el-empty-stub">{{ description }}<slot /></div>',
        },
      },
    },
  })
  wrappers.push(wrapper)
  return { wrapper, visible, instanceId, taskId, approved, rejected }
}

function button(wrapper: VueWrapper, key: string) {
  const result = wrapper.findAll('button').find((candidate) => candidate.text() === key)
  expect(result, `按钮 ${key}`).toBeDefined()
  return result!
}

async function forceClick(wrapper: VueWrapper, key: string) {
  const target = button(wrapper, key)
  const wasDisabled = target.element.hasAttribute('disabled')
  target.element.removeAttribute('disabled')
  await target.trigger('click')
  if (wasDisabled) target.element.setAttribute('disabled', '')
}

const approveKey = 'bpm.approval.action.approve'
const rejectKey = 'bpm.approval.action.reject'
const confirmRejectKey = 'bpm.approval.action.confirmReject'
const backKey = 'bpm.approval.action.back'
const noNodeKey = 'bpm.approval.messages.noRejectableNode'

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(getProcessDetail).mockImplementation(async (instanceId) =>
    detailResponse(instanceId, instanceId === 'p1' ? 't1' : 't2'),
  )
  vi.mocked(getRejectableNodes).mockResolvedValue({
    code: 200,
    msg: 'ok',
    data: [{ activityId: 'node1', activityName: '发起' }],
  })
  vi.mocked(approveTask).mockResolvedValue({ code: 200, msg: 'ok' })
  vi.mocked(rejectTask).mockResolvedValue({ code: 200, msg: 'ok' })
})

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
})

describe('ApprovalDetailDrawer 会话与审批保护', () => {
  it('初始打开只加载一次，详情就绪前按钮和方法都禁止审批', async () => {
    const request = deferred<DetailResponse>()
    vi.mocked(getProcessDetail).mockReturnValueOnce(request.promise)
    const { wrapper, visible, approved } = mountDrawer()
    await nextTick()

    expect(getProcessDetail).toHaveBeenCalledTimes(1)
    expect(button(wrapper, approveKey).attributes('disabled')).toBeDefined()
    await forceClick(wrapper, approveKey)
    expect(approveTask).not.toHaveBeenCalled()

    request.resolve(detailResponse())
    await flushPromises()
    expect(button(wrapper, approveKey).attributes('disabled')).toBeUndefined()
    await wrapper.find('textarea').setValue('同意')
    await button(wrapper, approveKey).trigger('click')
    await flushPromises()
    expect(approveTask).toHaveBeenCalledWith({ taskId: 't1', comment: '同意' })
    expect(visible.value).toBe(false)
    expect(approved).toHaveBeenCalledTimes(1)
  })

  it('只读详情不显示审批操作', async () => {
    const { wrapper } = mountDrawer({ taskId: '' })
    await flushPromises()
    expect(wrapper.find('textarea').exists()).toBe(false)
    expect(wrapper.findAll('button').map((candidate) => candidate.text())).toEqual(['common.close'])
  })

  it.each(['error', 'instance', 'task'])('详情失败或身份不匹配时禁止审批：%s', async (failure) => {
    if (failure === 'error') vi.mocked(getProcessDetail).mockRejectedValueOnce(new Error('offline'))
    else
      vi.mocked(getProcessDetail).mockResolvedValueOnce(
        failure === 'instance' ? detailResponse('wrong') : detailResponse('p1', 'wrong'),
      )
    const { wrapper } = mountDrawer()
    await flushPromises()
    expect(button(wrapper, approveKey).attributes('disabled')).toBeDefined()
    await forceClick(wrapper, approveKey)
    await forceClick(wrapper, rejectKey)
    expect(approveTask).not.toHaveBeenCalled()
    expect(getRejectableNodes).not.toHaveBeenCalled()
  })

  it('详情失败显示重试，重试成功后恢复操作', async () => {
    vi.mocked(getProcessDetail).mockRejectedValueOnce(new Error('offline'))
    const { wrapper } = mountDrawer()
    await flushPromises()
    expect(wrapper.text()).toContain('common.messages.loadFailed')
    await button(wrapper, 'common.retry').trigger('click')
    await flushPromises()
    expect(getProcessDetail).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).not.toContain('common.messages.loadFailed')
    expect(button(wrapper, approveKey).attributes('disabled')).toBeUndefined()
  })

  it('打开期间切换实例和任务会清空旧表单，合并为一次新请求', async () => {
    const { wrapper, instanceId, taskId } = mountDrawer()
    await flushPromises()
    await wrapper.find('textarea').setValue('旧意见')
    await button(wrapper, rejectKey).trigger('click')
    await flushPromises()
    await wrapper.find('select').setValue('node1')
    const request = deferred<DetailResponse>()
    vi.mocked(getProcessDetail).mockReturnValueOnce(request.promise)
    instanceId.value = 'p2'
    taskId.value = 't2'
    await nextTick()
    await nextTick()
    expect(getProcessDetail).toHaveBeenCalledTimes(2)
    expect(getProcessDetail).toHaveBeenLastCalledWith('p2')
    expect(wrapper.text()).not.toContain('详情-p1')
    expect(wrapper.find('textarea').element.value).toBe('')
    expect(wrapper.find('select').exists()).toBe(false)
    expect(button(wrapper, approveKey).attributes('disabled')).toBeDefined()
    request.resolve(detailResponse('p2', 't2'))
    await flushPromises()
    expect(button(wrapper, approveKey).attributes('disabled')).toBeUndefined()
  })

  it('关闭后同实例重开忽略旧响应和迟到的 closed 事件', async () => {
    const older = deferred<DetailResponse>()
    vi.mocked(getProcessDetail).mockReturnValueOnce(older.promise)
    const { wrapper, visible } = mountDrawer()
    await nextTick()
    visible.value = false
    await nextTick()
    visible.value = true
    await flushPromises()
    expect(getProcessDetail).toHaveBeenCalledTimes(2)
    await wrapper.find('textarea').setValue('新会话意见')
    wrapper.findComponent(DrawerStub).vm.$emit('closed')
    await nextTick()
    older.resolve({ ...detailResponse(), data: { ...detailResponse().data, title: '旧会话' } })
    await flushPromises()
    expect(wrapper.text()).toContain('详情-p1')
    expect(wrapper.text()).not.toContain('旧会话')
    expect(wrapper.find('textarea').element.value).toBe('新会话意见')
    expect(button(wrapper, approveKey).attributes('disabled')).toBeUndefined()
  })

  it.each(['close', 'switch', 'back'])('失效的节点请求不触发无节点提示：%s', async (change) => {
    const request = deferred<NodeResponse>()
    vi.mocked(getRejectableNodes).mockReturnValueOnce(request.promise)
    const { wrapper, visible, instanceId, taskId } = mountDrawer()
    await flushPromises()
    await button(wrapper, rejectKey).trigger('click')
    if (change === 'close') visible.value = false
    else if (change === 'switch') {
      instanceId.value = 'p2'
      taskId.value = 't2'
    } else await button(wrapper, backKey).trigger('click')
    await flushPromises()
    request.resolve({ code: 200, msg: 'ok', data: [] })
    await flushPromises()
    expect(ElMessage.warning).not.toHaveBeenCalled()
  })

  it('节点请求失败不误报无节点，回退后可重试', async () => {
    vi.mocked(getRejectableNodes).mockRejectedValueOnce(new Error('offline'))
    const { wrapper } = mountDrawer()
    await flushPromises()
    await button(wrapper, rejectKey).trigger('click')
    await flushPromises()
    expect(ElMessage.warning).not.toHaveBeenCalled()
    expect(button(wrapper, confirmRejectKey).attributes('disabled')).toBeDefined()
    await button(wrapper, backKey).trigger('click')
    await button(wrapper, rejectKey).trigger('click')
    await flushPromises()
    expect(getRejectableNodes).toHaveBeenCalledTimes(2)
    expect(wrapper.find('select').text()).toContain('发起')
  })

  it('成功的空节点响应提示无节点，重复切换复用缓存', async () => {
    vi.mocked(getRejectableNodes).mockResolvedValueOnce({ code: 200, msg: 'ok', data: [] })
    const { wrapper } = mountDrawer()
    await flushPromises()
    await button(wrapper, rejectKey).trigger('click')
    await flushPromises()
    expect(ElMessage.warning).toHaveBeenCalledWith(noNodeKey)
    await button(wrapper, backKey).trigger('click')
    await button(wrapper, rejectKey).trigger('click')
    await flushPromises()
    expect(getRejectableNodes).toHaveBeenCalledTimes(1)
    expect(button(wrapper, confirmRejectKey).attributes('disabled')).toBeDefined()
  })

  it('驳回必须等待当前节点加载，并校验目标属于当前节点列表', async () => {
    const request = deferred<NodeResponse>()
    vi.mocked(getRejectableNodes).mockReturnValueOnce(request.promise)
    const { wrapper, visible, rejected } = mountDrawer()
    await flushPromises()
    await button(wrapper, rejectKey).trigger('click')
    expect(button(wrapper, confirmRejectKey).attributes('disabled')).toBeDefined()
    await forceClick(wrapper, confirmRejectKey)
    expect(rejectTask).not.toHaveBeenCalled()
    request.resolve({ code: 200, msg: 'ok', data: [{ activityId: 'node1' }] })
    await flushPromises()
    wrapper.findComponent(SelectStub).vm.$emit('update:modelValue', 'oldNode')
    await nextTick()
    expect(button(wrapper, confirmRejectKey).attributes('disabled')).toBeDefined()
    await forceClick(wrapper, confirmRejectKey)
    expect(rejectTask).not.toHaveBeenCalled()
    await wrapper.find('select').setValue('node1')
    expect(button(wrapper, confirmRejectKey).attributes('disabled')).toBeUndefined()
    await button(wrapper, confirmRejectKey).trigger('click')
    await flushPromises()
    expect(rejectTask).toHaveBeenCalledWith({
      taskId: 't1',
      targetActivityId: 'node1',
      comment: undefined,
    })
    expect(visible.value).toBe(false)
    expect(rejected).toHaveBeenCalledTimes(1)
  })

  it.each(['approve', 'reject'])('旧会话提交成功只刷新父列表，不关闭新详情：%s', async (action) => {
    const request = deferred<ActionResponse>()
    if (action === 'approve') vi.mocked(approveTask).mockReturnValueOnce(request.promise)
    else vi.mocked(rejectTask).mockReturnValueOnce(request.promise)
    const { wrapper, visible, instanceId, taskId, approved, rejected } = mountDrawer()
    await flushPromises()
    if (action === 'reject') {
      await button(wrapper, rejectKey).trigger('click')
      await flushPromises()
      await wrapper.find('select').setValue('node1')
    }
    await button(wrapper, action === 'approve' ? approveKey : confirmRejectKey).trigger('click')
    visible.value = false
    await nextTick()
    instanceId.value = 'p2'
    taskId.value = 't2'
    visible.value = true
    await flushPromises()
    expect(button(wrapper, approveKey).attributes('disabled')).toBeDefined()
    await forceClick(wrapper, approveKey)
    expect(approveTask).toHaveBeenCalledTimes(action === 'approve' ? 1 : 0)
    request.resolve({ code: 200, msg: 'ok' })
    await flushPromises()
    expect(visible.value).toBe(true)
    expect(wrapper.text()).toContain('详情-p2')
    expect(button(wrapper, approveKey).attributes('disabled')).toBeUndefined()
    expect(action === 'approve' ? approved : rejected).toHaveBeenCalledTimes(1)
  })
})
