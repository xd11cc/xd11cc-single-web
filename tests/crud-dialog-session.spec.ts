import { describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createI18n } from 'vue-i18n'
import UseCrudView from '@/common/components/useCrud/index.vue'

/**
 * 提交弹窗的会话保护。
 *
 * 树形壳（TreeCrudView）早就有这套防护，列表壳（UseCrudView）一直缺：
 *   - 没有「重复提交」守卫：校验是异步的，连点两次「确定」会发两次请求；
 *   - 没有「会话」校验：用户在校验期间关掉弹窗，回调仍会拿旧 formData 提交。
 *
 * 这两个用例是针对**当前缺陷**写的，抽取公共弹窗组件时应转为通过。
 * 断言的是行为（handleSubmit 被调几次），不是实现细节，
 * 因此重构后仍然有效。
 */

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', name: 'crud-dialog-test', component: { template: '<div />' } }],
})

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: 'zh-CN',
  messages: { 'zh-CN': {}, 'en-US': {} },
  missingWarn: false,
  fallbackWarn: false,
})

function makeSlotProps(overrides: Record<string, any> = {}) {
  return {
    searchData: {},
    refresh: () => Promise.resolve(),
    handleSearch: () => {},
    resetSearch: () => {},
    tableData: [{ id: 1 }],
    tableLoading: false,
    tableError: false,
    tableSelection: [],
    handleSelectionChange: () => {},
    paginationData: {
      total: 1,
      currentPage: 1,
      pageSize: 10,
      pageSizes: [10, 20, 50],
      layout: 'total, sizes, prev, pager, next',
    },
    handleCurrentChange: () => {},
    handleSizeChange: () => {},
    formData: { name: 'x' },
    dialogVisible: true,
    handleAdd: () => {},
    handleEdit: () => {},
    handleRemove: () => {},
    handleBatchRemove: () => {},
    handleClose: () => {},
    handleSubmit: () => Promise.resolve(),
    rowSelection: [],
    ...overrides,
  }
}

const stub = (tag: string, cls = '') => ({
  template: `<div class="${cls}" data-stub="${tag}"><slot /></div>`,
})

/**
 * 可控制 resolve 时机的 el-form 桩。
 * 记录 validate 被调用几次，并收集所有待 resolve 的 promise，
 * 用来模拟「校验慢于用户点击」这个真实空窗。
 */
function makeFormStub() {
  const state = { resolvers: [] as (() => void)[], validateCalls: 0 }
  const component = {
    template: '<form><slot /></form>',
    methods: {
      validate(cb?: (valid: boolean) => void) {
        state.validateCalls++
        const p = new Promise<boolean>((res) => {
          state.resolvers.push(() => res(true))
        })
        if (typeof cb === 'function') {
          void p.then((v) => cb(v))
          return undefined
        }
        return p
      },
      clearValidate() {},
    },
  }
  return { component, state }
}

function mountView(slotProps: any, formStub: any) {
  return mount(UseCrudView, {
    props: { slotProps, columns: [{ prop: 'name', label: '名称' }] },
    global: {
      plugins: [i18n, router],
      directives: { 'table-loading': {} },
      stubs: {
        'el-card': stub('el-card'),
        'el-form': formStub,
        'el-form-item': stub('el-form-item'),
        'el-row': stub('el-row'),
        'el-col': stub('el-col'),
        'el-table': stub('el-table'),
        'el-table-column': { template: '<div />' },
        'el-pagination': stub('el-pagination'),
        // 必须把 footer 插槽也渲染出来，否则「确定」按钮不存在
        'el-dialog': { template: '<div><slot /><slot name="footer" /></div>' },
        'el-button': { template: '<button><slot /></button>' },
        'el-empty': stub('el-empty'),
        'el-popover': { template: '<div><slot /><slot name="reference" /></div>' },
      },
    },
  })
}

/** 点弹窗底部「确定」（footer 里最后一个 el-button 桩） */
async function clickConfirm(wrapper: ReturnType<typeof mountView>) {
  const texts = wrapper.findAll('button').map((b) => b.text())
  const confirm = wrapper.findAll('button').find((b) => b.text() === 'common.confirm')
  expect(confirm, `找不到「确定」按钮，实际：${texts.join('|')}`).toBeTruthy()
  await confirm!.trigger('click')
}

describe('提交弹窗的会话保护', () => {
  it('校验期间用户关闭弹窗，不应再提交', async () => {
    const handleSubmit = vi.fn(() => Promise.resolve())
    const slotProps = reactive(makeSlotProps({ handleSubmit, dialogVisible: true }))
    const { component: formStub, state } = makeFormStub()

    const wrapper = mountView(slotProps, formStub)
    await nextTick()

    await clickConfirm(wrapper)
    await nextTick()

    // 校验还挂着的时候，用户把弹窗关了
    slotProps.dialogVisible = false
    await nextTick()

    // 校验这才回来
    state.resolvers.forEach((r) => r())
    await nextTick()
    await nextTick()

    expect(handleSubmit).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('校验进行中连点两次，只发起一次校验、只提交一次', async () => {
    const handleSubmit = vi.fn(() => Promise.resolve())
    const slotProps = reactive(makeSlotProps({ handleSubmit, dialogVisible: true }))
    const { component: formStub, state } = makeFormStub()

    const wrapper = mountView(slotProps, formStub)
    await nextTick()

    const confirm = wrapper.findAll('button').find((b) => b.text() === 'common.confirm')!

    // 校验挂起期间连点两次（按钮 loading 尚未生效的真实空窗）
    confirm.element.click()
    confirm.element.click()
    await nextTick()

    // 关键契约：校验还没回来，就不该再起第二次
    expect(state.validateCalls).toBe(1)

    // 让校验回来，断言只提交一次
    state.resolvers.forEach((r) => r())
    await nextTick()
    await nextTick()
    await nextTick()

    expect(handleSubmit).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})
