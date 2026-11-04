import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, reactive } from 'vue'
import { createI18n } from 'vue-i18n'
import TreeCrudView from '@/common/components/treeCrud/index.vue'
import { useTreeCrud } from '@/common/composables/useTreeCrud'
import type { UseTreeCrudSlotProps } from '@/common/composables/useTreeCrud'

function deferred<Value>() {
  let resolve!: (value: Value) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<Value>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

const validate = vi.fn<(callback?: (valid: boolean) => void) => Promise<boolean>>()
const clearValidate = vi.fn()

const FormStub = defineComponent({
  setup(_props, { expose, slots }) {
    expose({ validate: (...args: Parameters<typeof validate>) => validate(...args), clearValidate })
    return () => h('form', slots.default?.())
  },
})

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: 'zh-CN',
  messages: { 'zh-CN': {} },
  missingWarn: false,
  fallbackWarn: false,
})

const global = {
  plugins: [i18n],
  directives: { 'table-loading': {} },
  stubs: {
    TreeTableView: {
      name: 'TreeTableView',
      props: ['data', 'loading', 'defaultExpandAll'],
      methods: { toggleRowExpansion: vi.fn() },
      template:
        '<div class="tree-stub"><slot name="toolbar" /><span v-for="row in data" :key="row.id">{{ row.name }}</span><slot /></div>',
    },
    'el-card': { template: '<div><slot /></div>' },
    'el-form': FormStub,
    'el-form-item': { template: '<div><slot /></div>' },
    'el-row': { template: '<div><slot /></div>' },
    'el-dialog': {
      props: ['modelValue'],
      template: '<div v-if="modelValue" class="dialog-stub"><slot /><slot name="footer" /></div>',
    },
    'el-button': {
      props: ['disabled', 'loading'],
      template: '<button :disabled="disabled || loading"><slot /></button>',
    },
    'el-empty': {
      props: ['description'],
      template: '<div class="empty-stub">{{ description }}<slot /></div>',
    },
  },
}

const wrappers: VueWrapper[] = []

function makeSlotProps(overrides: Partial<UseTreeCrudSlotProps> = {}) {
  return reactive<UseTreeCrudSlotProps>({
    searchData: {},
    handleSearch: vi.fn(),
    resetSearch: vi.fn(),
    treeData: [{ id: 1, name: '原有部门' }],
    loading: false,
    treeError: false,
    refresh: vi.fn(async () => {}),
    formData: { name: '' },
    dialogVisible: true,
    handleAdd: vi.fn(),
    handleAddChild: vi.fn(),
    handleEdit: vi.fn(),
    handleRemove: vi.fn(),
    handleClose: vi.fn(),
    handleSubmit: vi.fn(async () => {}),
    parentRow: null,
    ...overrides,
  })
}

function mountView(slotProps = makeSlotProps(), readonly = false, defaultExpanded = false) {
  const wrapper = mount(TreeCrudView, { props: { slotProps, readonly, defaultExpanded }, global })
  wrappers.push(wrapper)
  return { wrapper, slotProps }
}

function confirmButton(wrapper: VueWrapper) {
  return wrapper
    .find('.dialog-stub')
    .findAll('button')
    .find((button) => button.text() === 'common.confirm')!
}

async function forceConfirm(wrapper: VueWrapper) {
  const button = confirmButton(wrapper)
  const wasDisabled = button.element.hasAttribute('disabled')
  button.element.removeAttribute('disabled')
  await button.trigger('click')
  if (wasDisabled) button.element.setAttribute('disabled', '')
}

beforeEach(() => {
  vi.clearAllMocks()
  validate.mockReset().mockImplementation(async (callback) => {
    callback?.(true)
    return true
  })
})

afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))

describe('TreeCrudView 状态与提交契约', () => {
  it('整页只有一个根节点，正常状态仍显示树和操作区', () => {
    const { wrapper } = mountView()
    expect(wrapper.element.parentElement?.children.length).toBe(1)
    expect(wrapper.find('.tree-stub').exists()).toBe(true)
    expect(wrapper.text()).toContain('原有部门')
    expect(wrapper.text()).toContain('common.expandAll')
  })

  it('加载失败显示持久错误与重试，不展示过期树；重试恢复显示', async () => {
    const slotProps = makeSlotProps({ treeError: true })
    slotProps.refresh = vi.fn(async () => {
      slotProps.treeError = false
    })
    const { wrapper } = mountView(slotProps)
    const error = wrapper.find('.table-error')
    expect(error.exists()).toBe(true)
    expect(error.attributes('role')).toBe('alert')
    expect(error.text()).toContain('common.messages.loadFailed')
    expect(wrapper.find('.tree-stub').exists()).toBe(false)
    await error.find('button').trigger('click')
    expect(slotProps.refresh).toHaveBeenCalledTimes(1)
    expect(wrapper.find('.tree-stub').exists()).toBe(true)
  })

  it('冷启动（加载中且无数据）显示骨架，不渲染树表', () => {
    const wrapper = mount(TreeCrudView, {
      global,
      props: { slotProps: makeSlotProps({ loading: true, treeData: [] }) },
    })

    expect(wrapper.find('.skeleton-wrapper').exists()).toBe(true)
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'TreeTableView' }).exists()).toBe(false)
  })

  it('已有数据时刷新保留树表，不闪骨架', () => {
    const wrapper = mount(TreeCrudView, {
      global,
      props: {
        slotProps: makeSlotProps({ loading: true, treeData: [{ id: 1, name: '总部' }] }),
      },
    })

    expect(wrapper.find('.skeleton-wrapper').exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'TreeTableView' }).exists()).toBe(true)
  })

  it('正常空数据保持树空态，而不是加载错误', () => {
    const { wrapper } = mountView(makeSlotProps({ treeData: [] }))
    expect(wrapper.find('.tree-stub').exists()).toBe(true)
    expect(wrapper.find('.table-error').exists()).toBe(false)
  })

  it('错误重试后重新挂载树仍保留用户选择的收起状态', async () => {
    const { wrapper, slotProps } = mountView(makeSlotProps(), false, true)
    const collapse = wrapper
      .findAll('button')
      .find((button) => button.text() === 'common.collapseAll')!
    await collapse.trigger('click')
    slotProps.treeError = true
    await nextTick()
    slotProps.treeError = false
    await nextTick()
    expect(wrapper.findComponent({ name: 'TreeTableView' }).props('defaultExpandAll')).toBe(false)
    expect(wrapper.text()).toContain('common.expandAll')
  })

  it('只读状态不渲染编辑弹窗', () => {
    const { wrapper } = mountView(makeSlotProps(), true)
    expect(wrapper.find('.dialog-stub').exists()).toBe(false)
  })

  it('表单验证不通过自行接住拒绝，恢复按钮且不提交', async () => {
    validate.mockRejectedValueOnce({ name: ['required'] })
    const { wrapper, slotProps } = mountView()
    await confirmButton(wrapper).trigger('click')
    await flushPromises()
    expect(slotProps.handleSubmit).not.toHaveBeenCalled()
    expect(confirmButton(wrapper).attributes('disabled')).toBeUndefined()
    await confirmButton(wrapper).trigger('click')
    await flushPromises()
    expect(slotProps.handleSubmit).toHaveBeenCalledTimes(1)
  })

  it('验证返回 false 不执行写操作', async () => {
    validate.mockResolvedValueOnce(false)
    const { wrapper, slotProps } = mountView()
    await confirmButton(wrapper).trigger('click')
    await flushPromises()
    expect(slotProps.handleSubmit).not.toHaveBeenCalled()
  })

  it.each(['reject', 'throw'])('自定义提交失败也不会遗留拒绝或卡住按钮：%s', async (mode) => {
    const slotProps = makeSlotProps()
    const handleSubmit = vi
      .fn()
      .mockImplementationOnce(() => {
        if (mode === 'throw') throw new Error('sync failure')
        return Promise.reject(new Error('async failure'))
      })
      .mockResolvedValue(undefined)
    slotProps.handleSubmit = handleSubmit
    const { wrapper } = mountView(slotProps)
    await confirmButton(wrapper).trigger('click')
    await flushPromises()
    expect(slotProps.dialogVisible).toBe(true)
    expect(confirmButton(wrapper).attributes('disabled')).toBeUndefined()
    await confirmButton(wrapper).trigger('click')
    await flushPromises()
    expect(handleSubmit).toHaveBeenCalledTimes(2)
  })

  it('验证期间重复点击只验证一次，不提前提交', async () => {
    const pending = deferred<boolean>()
    validate.mockReturnValueOnce(pending.promise)
    const { wrapper, slotProps } = mountView()
    await confirmButton(wrapper).trigger('click')
    expect(confirmButton(wrapper).attributes('disabled')).toBeDefined()
    await forceConfirm(wrapper)
    expect(validate).toHaveBeenCalledTimes(1)
    expect(slotProps.handleSubmit).not.toHaveBeenCalled()
    pending.resolve(true)
    await flushPromises()
    expect(slotProps.handleSubmit).toHaveBeenCalledTimes(1)
  })

  it('写操作未完成时强制重复点击仍只提交一次', async () => {
    const pending = deferred<void>()
    const handleSubmit = vi.fn().mockReturnValueOnce(pending.promise)
    const { wrapper } = mountView(makeSlotProps({ handleSubmit }))
    await confirmButton(wrapper).trigger('click')
    await flushPromises()
    await forceConfirm(wrapper)
    expect(handleSubmit).toHaveBeenCalledTimes(1)
    pending.resolve()
    await flushPromises()
    expect(confirmButton(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('旧表单验证完成不能提交重新打开的新表单', async () => {
    const pending = deferred<boolean>()
    validate.mockReturnValueOnce(pending.promise)
    const { wrapper, slotProps } = mountView()
    await confirmButton(wrapper).trigger('click')
    slotProps.dialogVisible = false
    await nextTick()
    slotProps.formData = { id: 8, name: '新表单' }
    slotProps.dialogVisible = true
    await nextTick()
    pending.resolve(true)
    await flushPromises()
    expect(slotProps.handleSubmit).not.toHaveBeenCalled()
  })

  it('表单验证期间卸载不执行后续提交', async () => {
    const pending = deferred<boolean>()
    validate.mockReturnValueOnce(pending.promise)
    const { wrapper, slotProps } = mountView()
    await confirmButton(wrapper).trigger('click')
    wrapper.unmount()
    pending.resolve(true)
    await flushPromises()
    expect(slotProps.handleSubmit).not.toHaveBeenCalled()
  })

  it('真实读模型与壳连通：首次失败可重试恢复新树', async () => {
    const treeApi = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({
        code: 200,
        msg: 'ok',
        data: [{ id: 2, name: '最新部门' }],
      })
    const parent = defineComponent({
      setup() {
        const crud = useTreeCrud({ treeApi })
        void crud.refresh()
        return () => h(TreeCrudView, { slotProps: crud.slotProps, readonly: true })
      },
    })
    const wrapper = mount(parent, { global })
    wrappers.push(wrapper)
    await flushPromises()
    expect(wrapper.find('.table-error').exists()).toBe(true)
    await wrapper.find('.table-error button').trigger('click')
    await flushPromises()
    expect(treeApi).toHaveBeenCalledTimes(2)
    expect(wrapper.find('.table-error').exists()).toBe(false)
    expect(wrapper.find('.tree-stub').text()).toContain('最新部门')
  })
})
