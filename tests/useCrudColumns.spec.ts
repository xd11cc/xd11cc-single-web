import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'
import UseCrudView from '@/common/components/useCrud/index.vue'
import TableColumnSetting from '@/common/components/TableColumnSetting/index.vue'
import { CacheKey } from '@@/constants/cache-key'

/**
 * 壳的列管线：`columns` 传进去之后，列的顺序 / 显隐 / 列宽都由壳负责。
 *
 * 页面只声明「这一列长什么样」+ 用 `#cell-<prop>` 覆盖单元格，
 * 这些用例保证壳真的按配置渲染，并且表头拖拽的宽度能落到偏好里。
 */

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', name: 'crud', component: { template: '<div />' } }],
})

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: 'zh-CN',
  messages: { 'zh-CN': {}, 'en-US': {} },
  missingWarn: false,
  fallbackWarn: false,
})

const columnStub = {
  props: ['prop', 'label', 'width', 'minWidth', 'align', 'fixed', 'showOverflowTooltip'],
  template:
    '<div class="col" :data-prop="prop" :data-width="width" :data-label="label" :data-overflow="String(!!showOverflowTooltip)"><slot :row="{ a: 1, b: 2 }" /></div>',
}

const mountOptions = {
  global: {
    plugins: [i18n, router],
    directives: { 'table-loading': {} },
    stubs: {
      Icon: true,
      'el-card': { template: '<div><slot /></div>' },
      'el-form': { template: '<form><slot /></form>' },
      'el-form-item': { template: '<div><slot /></div>' },
      'el-table': { name: 'ElTableStub', template: '<div data-stub="el-table"><slot /></div>' },
      'el-table-column': columnStub,
      'el-pagination': { template: '<div class="page-wrapper" />' },
      'el-dialog': { template: '<div><slot /></div>' },
      'el-button': { template: '<button><slot /></button>' },
      'el-tooltip': { template: '<span><slot /></span>' },
      'el-input': { template: '<input />' },
      'el-select': { template: '<div><slot /></div>' },
      'el-option': { template: '<div />' },
      'el-empty': { template: '<div><slot /></div>' },
      'el-popover': { template: '<div><slot /><slot name="reference" /></div>' },
      'el-checkbox': { template: '<label><slot /></label>' },
    },
  },
}

function makeSlotProps(overrides: Record<string, any> = {}) {
  return {
    searchData: {},
    refresh: () => Promise.resolve(),
    handleSearch: () => {},
    resetSearch: () => {},
    tableData: [{ a: 1, b: 2 }],
    tableLoading: false,
    tableError: false,
    tableSelection: [],
    handleSelectionChange: () => {},
    paginationData: {
      total: 1,
      currentPage: 1,
      pageSize: 10,
      pageSizes: [10],
      layout: 'total, prev, pager, next',
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

const columns = [
  { prop: 'a', label: 'A 列' },
  { prop: 'b', label: 'B 列', width: 120 },
]

const storageKey = `${CacheKey.TABLE_COLUMNS}-crud`

function mountShell(props: Record<string, any> = {}) {
  return mount(UseCrudView, {
    ...mountOptions,
    props: { slotProps: makeSlotProps(), columns, ...props },
  })
}

describe('UseCrudView 列管线', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('按配置生成列：顺序、标签、宽度都来自配置', () => {
    const wrapper = mountShell()
    const cols = wrapper.findAll('.col')

    expect(cols.map((col) => col.attributes('data-prop'))).toEqual(['a', 'b'])
    expect(cols.map((col) => col.attributes('data-label'))).toEqual(['A 列', 'B 列'])
    expect(cols[1].attributes('data-width')).toBe('120')
  })

  it('默认给所有列开 show-overflow-tooltip（单元格全局 nowrap，否则看不到全文）', () => {
    const wrapper = mountShell()
    const cols = wrapper.findAll('.col')

    expect(cols.map((c) => c.attributes('data-overflow'))).toEqual(['true', 'true'])
  })

  it('显式 showOverflowTooltip: false 可关闭 tooltip', () => {
    const wrapper = mountShell({
      columns: [
        { prop: 'a', label: 'A 列' },
        { prop: 'b', label: 'B 列', showOverflowTooltip: false },
      ],
    })
    const cols = wrapper.findAll('.col')

    expect(cols[0].attributes('data-overflow')).toBe('true')
    expect(cols[1].attributes('data-overflow')).toBe('false')
  })

  it('按本地偏好决定顺序与显隐', () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify([
        { prop: 'a', visible: false, order: 0 },
        { prop: 'b', visible: true, order: 1 },
      ]),
    )
    const wrapper = mountShell()
    const cols = wrapper.findAll('.col')

    expect(cols).toHaveLength(1)
    expect(cols[0].attributes('data-prop')).toBe('b')
  })

  it('#cell-<prop> 覆盖默认单元格内容', () => {
    const wrapper = mount(UseCrudView, {
      ...mountOptions,
      props: { slotProps: makeSlotProps(), columns },
      slots: { 'cell-a': '<strong class="custom">自定义</strong>' },
    })

    expect(wrapper.find('.custom').exists()).toBe(true)
  })

  it('未覆盖的列回落到 row[prop]', () => {
    const wrapper = mountShell()
    const firstCol = wrapper.findAll('.col')[0]
    expect(firstCol.text()).toContain('1')
  })

  it('表头拖拽结束把新宽度写进偏好', async () => {
    const wrapper = mountShell()

    wrapper.findComponent({ name: 'ElTableStub' }).vm.$emit('header-dragend', 240, 120, {
      property: 'a',
    })
    await wrapper.vm.$nextTick()

    const stored = JSON.parse(localStorage.getItem(storageKey) ?? '{}')
    expect(stored.a?.width).toBe(240)
  })

  it('传了 columns 时工具栏出现列设置入口', () => {
    const wrapper = mountShell()
    expect(wrapper.findComponent(TableColumnSetting).exists()).toBe(true)
  })
})
