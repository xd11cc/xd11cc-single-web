import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import ListenerSection from '@/views/bpm/modeler/components/ListenerSection.vue'
import type { ListenerConfig } from '@/views/bpm/modeler/types'

/**
 * ListenerSection 的结构契约。
 *
 * 从 PropertyPanel 拆出来之后，主文件不再直接渲染监听器列表，
 * 这里钉死「列表怎么显示、按钮发出什么事件」，避免拆分时把接口接错。
 */

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: 'zh-CN',
  messages: { 'zh-CN': {}, 'en-US': {} },
  missingWarn: false,
  fallbackWarn: false,
})

const baseListener: ListenerConfig = {
  id: 'l1',
  listenerType: 'task',
  event: 'create',
  implementationType: 'class',
  implementation: 'com.demo.Listener',
  fields: [{ name: 'f1', valueType: 'stringValue', value: 'v', expressionParameters: {} }],
}

const mountOptions = {
  global: {
    plugins: [i18n],
    stubs: {
      ListenerDialog: true,
      Icon: true,
      'el-button': { template: '<button><slot /></button>' },
    },
  },
}

describe('ListenerSection', () => {
  it('渲染监听器的事件与实现方式', () => {
    const wrapper = mount(ListenerSection, {
      ...mountOptions,
      props: { listeners: [baseListener] },
    })

    expect(wrapper.find('.listener-card').exists()).toBe(true)
    // 事件名走 i18n key（测试环境无翻译，显示 key 本身）
    expect(wrapper.find('.listener-event').text()).toBe('bpm.modeler.listener.events.create')
    expect(wrapper.find('.listener-implementation').text()).toContain('com.demo.Listener')
  })

  it('显示字段数量', () => {
    const wrapper = mount(ListenerSection, {
      ...mountOptions,
      props: { listeners: [baseListener] },
    })

    expect(wrapper.find('.listener-fields').exists()).toBe(true)
  })

  it('点击删除发出 remove 事件', async () => {
    const wrapper = mount(ListenerSection, {
      ...mountOptions,
      props: { listeners: [baseListener] },
    })

    await wrapper.find('.listener-actions .danger').trigger('click')

    expect(wrapper.emitted('remove')?.[0]).toEqual(['l1'])
  })

  it('没有监听器时渲染空态按钮', () => {
    const wrapper = mount(ListenerSection, {
      ...mountOptions,
      props: { listeners: [] },
    })

    expect(wrapper.find('.listener-empty').exists()).toBe(true)
    expect(wrapper.find('.listener-card').exists()).toBe(false)
  })
})
