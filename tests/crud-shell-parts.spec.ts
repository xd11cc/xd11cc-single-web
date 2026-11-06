import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { ElTable, ElTableColumn } from 'element-plus'
import TableColumns from '@/common/components/crudShell/TableColumns.vue'
import SearchCard from '@/common/components/crudShell/SearchCard.vue'

/**
 * 两个壳抽出来的共用碎片的契约。
 *
 * 这些断言保证「抽取没有改变行为」：
 *  - 列仍然由定义生成、顺序与显隐由调用方决定；
 *  - `#cell-<prop>` 仍然能覆盖单元格，未覆盖时回落到 `row[prop] ?? '-'`；
 *  - 搜索卡片仍然把「查询/重置」接到传入的回调上。
 */

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: 'zh-CN',
  messages: { 'zh-CN': {}, 'en-US': {} },
  missingWarn: false,
  fallbackWarn: false,
})

const cols = (list: Array<Record<string, unknown>>) =>
  list.map((c, i) => ({ visible: true, order: i, ...c })) as any[]

describe('TableColumns', () => {
  /** 用真实 el-table 挂载：el-table-column 通过 provide/inject 注册，包一层组件必须仍能注册 */
  function mountInTable(columns: any[], slots: Record<string, any> = {}, data: any[] = []) {
    const Host = defineComponent({
      setup() {
        return () => h(ElTable, { data }, () => [h(TableColumns, { columns }, slots)])
      },
    })
    return mount(Host, { global: { plugins: [i18n], components: { ElTableColumn } } })
  }

  it('按定义渲染表头（真实 el-table 中仍能注册）', async () => {
    const w = mountInTable(
      cols([
        { prop: 'name', label: '名称' },
        { prop: 'age', label: '年龄' },
      ]),
    )
    await nextTick()
    await nextTick()
    expect(w.findAll('th').map((t) => t.text())).toEqual(['名称', '年龄'])
  })

  it('#cell-<prop> 覆盖单元格，未覆盖的回落为 row[prop] ?? "-"', async () => {
    const w = mountInTable(
      cols([
        { prop: 'name', label: '名称' },
        { prop: 'age', label: '年龄' },
      ]),
      { 'cell-age': ({ row }: any) => h('b', `AGE=${row.age}`) },
      [{ name: 'Alice', age: 30 }],
    )
    await nextTick()
    await nextTick()
    const text = w.text()
    expect(text).toContain('AGE=30') // 自定义生效
    expect(text).toContain('Alice') // 未自定义的列走默认取值
  })

  it('缺失字段显示占位符 "-"', async () => {
    const w = mountInTable(cols([{ prop: 'missing', label: '缺失' }]), {}, [{ id: 1 }])
    await nextTick()
    await nextTick()
    expect(w.text()).toContain('-')
  })

  it('列多时全部渲染（不因包一层而丢列）', async () => {
    const list = cols(Array.from({ length: 6 }, (_, i) => ({ prop: `f${i}`, label: `列${i}` })))
    const w = mountInTable(list)
    await nextTick()
    await nextTick()
    expect(w.findAll('th')).toHaveLength(6)
  })
})

describe('SearchCard', () => {
  function mountCard(overrides: Record<string, any> = {}) {
    const slotProps = {
      searchData: {},
      handleSearch: vi.fn(),
      resetSearch: vi.fn(),
      // 额外的字段也应在插槽作用域里可见（壳的完整 slotProps 透传）
      refresh: vi.fn(),
      ...overrides,
    }
    const w = mount(SearchCard, {
      props: { slotProps },
      slots: {
        default: `<input class="probe-input" :value="String(!!refresh)" />`,
      },
      global: {
        plugins: [i18n],
        stubs: {
          'el-card': { template: '<div class="search-wrapper"><slot /></div>' },
          'el-form': { template: '<form><slot /></form>' },
          'el-form-item': { template: '<div><slot /></div>' },
          'el-button': { template: '<button><slot /></button>' },
        },
      },
    })
    return { w, slotProps }
  }

  it('渲染搜索卡片容器与两个按钮', () => {
    const { w } = mountCard()
    expect(w.find('.search-wrapper').exists()).toBe(true)
    expect(w.findAll('button')).toHaveLength(2)
  })

  it('点「查询」调 handleSearch，点「重置」调 resetSearch', async () => {
    const { w, slotProps } = mountCard()
    const [search, reset] = w.findAll('button')
    await search.trigger('click')
    await reset.trigger('click')
    expect(slotProps.handleSearch).toHaveBeenCalledTimes(1)
    expect(slotProps.resetSearch).toHaveBeenCalledTimes(1)
  })

  it('插槽拿到完整的 slotProps（不只是搜索相关字段）', () => {
    const { w } = mountCard()
    // probe-input 的 value 来自 refresh 是否存在，证明作用域没被收窄
    expect((w.find('.probe-input').element as HTMLInputElement).value).toBe('true')
  })
})
