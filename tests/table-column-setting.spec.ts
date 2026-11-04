import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import TableColumnSetting from '@/common/components/TableColumnSetting/index.vue'

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: 'zh-CN',
  messages: { 'zh-CN': {}, 'en-US': {} },
  missingWarn: false,
  fallbackWarn: false,
})

const mountOptions = {
  global: {
    plugins: [i18n],
    stubs: {
      Icon: true,
      'el-popover': { template: '<div><slot /><slot name="reference" /></div>' },
      'el-button': { template: '<button><slot /></button>' },
      'el-checkbox': {
        props: ['modelValue', 'disabled', 'title'],
        template:
          '<label class="cb" :data-disabled="String(!!disabled)"><slot /><input type="checkbox" :checked="modelValue" :disabled="disabled" /></label>',
      },
    },
  },
}

const columns = [
  { prop: 'a', label: 'A 列', visible: true, order: 0 },
  { prop: 'b', label: 'B 列', visible: true, order: 1 },
  { prop: 'c', label: 'C 列', visible: false, order: 2 },
]

describe('TableColumnSetting', () => {
  it('按 order 渲染列名', () => {
    const wrapper = mount(TableColumnSetting, { ...mountOptions, props: { columns } })
    const items = wrapper.findAll('.column-setting-item')
    expect(items.map((item) => item.text())).toEqual(['A 列', 'B 列', 'C 列'])
  })

  it('勾选状态跟随 visible，切换时发出 toggle(prop)', async () => {
    const wrapper = mount(TableColumnSetting, { ...mountOptions, props: { columns } })

    const boxes = wrapper.findAll('input[type="checkbox"]')
    expect((boxes[0].element as HTMLInputElement).checked).toBe(true)
    expect((boxes[2].element as HTMLInputElement).checked).toBe(false)

    await boxes[1].trigger('change')
    expect(wrapper.emitted('toggle')?.[0]).toEqual(['b'])
  })

  it('拖拽后发出 reorder(from, to)', async () => {
    const wrapper = mount(TableColumnSetting, { ...mountOptions, props: { columns } })
    const items = wrapper.findAll('.column-setting-item')

    await items[0].trigger('dragstart')
    await items[2].trigger('drop')

    expect(wrapper.emitted('reorder')?.[0]).toEqual([0, 2])
  })

  it('只剩一列可见时禁用勾选，避免表格变空壳', () => {
    const onlyOne = columns.map((col) => ({ ...col, visible: col.prop === 'a' }))
    const wrapper = mount(TableColumnSetting, { ...mountOptions, props: { columns: onlyOne } })

    const boxes = wrapper.findAll('input[type="checkbox"]')
    expect((boxes[0].element as HTMLInputElement).disabled).toBe(true)
    expect((boxes[1].element as HTMLInputElement).disabled).toBe(false)
  })

  it('点击重置发出 reset', async () => {
    const wrapper = mount(TableColumnSetting, { ...mountOptions, props: { columns } })
    const resetButton = wrapper.findAll('button').find((btn) => btn.text() === 'common.reset')

    expect(resetButton, 'reset 按钮').toBeDefined()
    await resetButton!.trigger('click')
    expect(wrapper.emitted('reset')).toHaveLength(1)
  })
})
