import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createI18n } from 'vue-i18n'
import UseCrudView from '@/common/components/useCrud/index.vue'

/**
 * 壳的结构测试。
 *
 * 这几个断言来自真实踩过的坑：
 *  1) 页面必须在 <transition mode="out-in"> 下有**单一根节点**，否则整个内容区白屏；
 *  2) 三段骨架类必须渲染，否则页面间距/分页会跑偏；
 *  3) readonly 不应渲染新增/编辑弹窗；
 *  4) hidePagination 应隐藏分页区。
 */

// 组件内部调用了 useI18n()，必须真的装上 i18n 插件（只 mock $t 不够）
// 壳里用 useRoute() 取列偏好的默认键，测试环境需要一个真 router（否则 inject 告警）
const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', name: 'crud-test', component: { template: '<div />' } }],
})

const defaultColumns = [{ prop: 'name', label: '名称' }]

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
    tableData: [],
    tableLoading: false,
    tableError: false,
    tableSelection: [],
    handleSelectionChange: () => {},
    paginationData: {
      total: 0,
      currentPage: 1,
      pageSize: 10,
      pageSizes: [10, 20, 50],
      layout: 'total, sizes, prev, pager, next',
    },
    handleCurrentChange: () => {},
    handleSizeChange: () => {},
    formData: {},
    dialogVisible: false,
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

const mountOptions = {
  global: {
    plugins: [i18n, router],
    directives: { 'table-loading': {} },
    stubs: {
      'el-card': stub('el-card'),
      'el-form': stub('el-form'),
      'el-form-item': stub('el-form-item'),
      'el-row': stub('el-row'),
      'el-col': stub('el-col'),
      'el-table': stub('el-table'),
      'el-table-column': { template: '<div />' },
      'el-pagination': stub('el-pagination'),
      'el-dialog': stub('el-dialog', 'el-dialog-stub'),
      'el-button': { template: '<button><slot /></button>' },
      'el-tooltip': { template: '<span><slot /></span>' },
      'el-input': { template: '<input />' },
      'el-select': { template: '<div><slot /></div>' },
      'el-option': { template: '<div />' },
      'el-empty': { template: '<div class="el-empty-stub"><slot /></div>' },
      'el-popover': { template: '<div><slot /><slot name="reference" /></div>' },
      'el-checkbox': { template: '<label><slot /></label>' },
    },
  },
}

describe('UseCrudView 结构契约', () => {
  it('渲染搜索区、表格区、分页区三段骨架', () => {
    const wrapper = mount(UseCrudView, {
      ...mountOptions,
      props: { slotProps: makeSlotProps(), columns: defaultColumns },
    })

    expect(wrapper.find('.search-wrapper').exists()).toBe(true)
    expect(wrapper.find('.table-wrapper').exists()).toBe(true)
    expect(wrapper.find('.page-wrapper').exists()).toBe(true)
  })

  it('冷启动（加载中且无数据）显示骨架屏，不渲染空表', () => {
    const wrapper = mount(UseCrudView, {
      ...mountOptions,
      props: {
        slotProps: makeSlotProps({ tableLoading: true, tableData: [] }),
        columns: defaultColumns,
      },
    })

    // 断言壳的接线：冷启动走 Skeleton 分支、表格不渲染、带无障碍状态标记。
    // （骨架块本身有 180ms 延迟，避免快接口闪一下，那是 Skeleton 自己的行为，
    //   由 tests/skeleton.spec.ts 单独验证。）
    expect(wrapper.find('.skeleton-wrapper').exists()).toBe(true)
    expect(wrapper.find('[data-stub="el-table"]').exists()).toBe(false)
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
  })

  it('翻页/刷新（加载中但已有数据）保留表格，不闪骨架', () => {
    const wrapper = mount(UseCrudView, {
      ...mountOptions,
      props: {
        slotProps: makeSlotProps({ tableLoading: true, tableData: [{ id: 1 }] }),
        columns: defaultColumns,
      },
    })

    expect(wrapper.find('.skeleton-wrapper').exists()).toBe(false)
    expect(wrapper.find('[data-stub="el-table"]').exists()).toBe(true)
  })

  it('整页只有一个根元素（多根节点会白屏）', () => {
    const wrapper = mount(UseCrudView, {
      ...mountOptions,
      props: { slotProps: makeSlotProps(), columns: defaultColumns },
    })

    const root = wrapper.element
    expect(root.parentElement?.children.length).toBe(1)
  })

  it('readonly 模式不渲染新增/编辑弹窗', () => {
    const wrapper = mount(UseCrudView, {
      ...mountOptions,
      props: { slotProps: makeSlotProps(), columns: defaultColumns, readonly: true },
    })

    expect(wrapper.find('.el-dialog-stub').exists()).toBe(false)
  })

  it('加载失败时显示错误态与重试按钮，并隐藏表格和分页', async () => {
    const refresh = vi.fn()
    const wrapper = mount(UseCrudView, {
      ...mountOptions,
      props: { slotProps: makeSlotProps({ tableError: true, refresh }), columns: defaultColumns },
    })

    const error = wrapper.find('.table-error')
    expect(error.exists()).toBe(true)
    expect(error.attributes('role')).toBe('alert')
    expect(wrapper.find('.page-wrapper').exists()).toBe(false)

    await error.find('button').trigger('click')
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('hidePagination 隐藏分页区', () => {
    const wrapper = mount(UseCrudView, {
      ...mountOptions,
      props: { slotProps: makeSlotProps(), columns: defaultColumns, hidePagination: true },
    })

    expect(wrapper.find('.page-wrapper').exists()).toBe(false)
  })
})
