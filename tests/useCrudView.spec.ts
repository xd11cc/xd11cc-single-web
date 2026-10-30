import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
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
    plugins: [i18n],
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
      'el-empty': { template: '<div />' },
    },
  },
}

describe('UseCrudView 结构契约', () => {
  it('渲染搜索区、表格区、分页区三段骨架', () => {
    const wrapper = mount(UseCrudView, { ...mountOptions, props: { slotProps: makeSlotProps() } })

    expect(wrapper.find('.search-wrapper').exists()).toBe(true)
    expect(wrapper.find('.table-wrapper').exists()).toBe(true)
    expect(wrapper.find('.page-wrapper').exists()).toBe(true)
  })

  it('整页只有一个根元素（多根节点会白屏）', () => {
    const wrapper = mount(UseCrudView, { ...mountOptions, props: { slotProps: makeSlotProps() } })

    const root = wrapper.element
    expect(root.parentElement?.children.length).toBe(1)
  })

  it('readonly 模式不渲染新增/编辑弹窗', () => {
    const wrapper = mount(UseCrudView, {
      ...mountOptions,
      props: { slotProps: makeSlotProps(), readonly: true },
    })

    expect(wrapper.find('.el-dialog-stub').exists()).toBe(false)
  })

  it('hidePagination 隐藏分页区', () => {
    const wrapper = mount(UseCrudView, {
      ...mountOptions,
      props: { slotProps: makeSlotProps(), hidePagination: true },
    })

    expect(wrapper.find('.page-wrapper').exists()).toBe(false)
  })
})
