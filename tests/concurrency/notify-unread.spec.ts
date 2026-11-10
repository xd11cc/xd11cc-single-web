import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

const fixture = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('@@/utils/request', () => ({ default: (config: any) => fixture.request(config) }))
vi.mock('@@/composables/useWebSocket', () => ({ useWebSocket: () => ({ on: vi.fn(), off: vi.fn() }) }))
vi.mock('@@/composables/useTodoQueue', () => ({ useTodoQueue: () => ({ push: vi.fn(), flushIfIdle: vi.fn() }) }))
vi.mock('@/pinia/stores/settings', () => ({ useSettingsStore: () => ({ todoPopup: false }) }))
vi.mock('vue-router', () => ({ useRouter: () => ({}) }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('element-plus', () => ({ ElNotification: vi.fn(), ElMessage: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/common/components/Notify/TodoPopup.vue', () => ({ default: { render: () => null } }))

import Notify from '@/common/components/Notify/index.vue'

const Container = defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) })
const TabPane = defineComponent({ setup: (_, { slots }) => () => h('div', [slots.label?.(), slots.default?.()]) })
const Badge = defineComponent({
  props: ['value', 'hidden'],
  setup: (props, { slots }) => () => h('span', { 'data-review-badge': props.value }, slots.default?.()),
})
const Popover = defineComponent({
  emits: ['show'],
  setup(_, { emit, slots }) {
    const visible = ref(false)
    return () => h('div', [
      h('div', { 'data-review-open': true, onClick: () => { visible.value = true; emit('show') } }, slots.reference?.()),
      visible.value ? h('section', slots.default?.()) : null,
    ])
  },
})
const wrappers: any[] = []
function deferred() {
  let resolve!: (value: any) => void
  const promise = new Promise<any>(done => { resolve = done })
  return { promise, resolve }
}
function response(data: any) { return { code: 200, data } }
beforeEach(() => {
  fixture.request.mockReset().mockImplementation(async (config: any) => {
    if (config.url === '/system/notice-user/unreadCount') return response({ notice: 2 })
    if (config.url === '/system/notice-user/myPage') return response({ total: config.data.type === '1' ? 2 : 0, rows: config.data.type === '1' ? [
      { id: 1, noticeId: 11, title: 'First', type: '1', readStatus: '0' },
      { id: 2, noticeId: 22, title: 'Second', type: '1', readStatus: '0' },
    ] : [] })
    return response(undefined)
  })
})
afterEach(() => wrappers.splice(0).forEach(wrapper => wrapper.unmount()))
async function render() {
  const wrapper = mount(Notify, { global: { stubs: {
    ElPopover: Popover, ElBadge: Badge, ElTooltip: Container, ElTabs: Container,
    ElTabPane: TabPane, ElScrollbar: Container, ElTag: Container, ElEmpty: Container, ElButton: Container,
  } } })
  wrappers.push(wrapper)
  await flushPromises()
  await wrapper.get('[data-review-open]').trigger('click')
  await flushPromises()
  return wrapper
}

describe('本轮新增：通知未读数', () => {
  it('对照：读取一条通知后，其余一条仍应保持未读', async () => {
    const wrapper = await render()
    expect(wrapper.get('[data-review-badge]').attributes('data-review-badge')).toBe('2')
    await wrapper.findAll('.notify-item')[0].trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-review-badge]').attributes('data-review-badge')).toBe('1')
    expect(wrapper.findAll('.notify-item.unread')).toHaveLength(1)
  })

  it('同一条通知的两次已读响应不能让未读数减少两次', async () => {
    const pending = deferred()
    const normal = fixture.request.getMockImplementation()!
    fixture.request.mockImplementation((config: any) => config.url === '/system/notice-user/markAsRead/11' ? pending.promise : normal(config))
    const wrapper = await render()
    const first = wrapper.findAll('.notify-item')[0]
    await first.trigger('click')
    await first.trigger('click')
    pending.resolve(response(undefined))
    await flushPromises()
    expect(wrapper.findAll('.notify-item.unread')).toHaveLength(1)
    expect(wrapper.get('[data-review-badge]').attributes('data-review-badge')).toBe('1')
  })

  it('未读数查询失败时保留原计数并收口 rejection', async () => {
    const wrapper = await render()
    const normal = fixture.request.getMockImplementation()!
    fixture.request.mockImplementation((config: any) =>
      config.url === '/system/notice-user/unreadCount'
        ? Promise.reject(new Error('offline'))
        : normal(config),
    )

    await wrapper.get('[data-review-open]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-review-badge]').attributes('data-review-badge')).toBe('2')
  })

  it('通知列表查询失败时保留已有列表并收口 rejection', async () => {
    const wrapper = await render()
    const normal = fixture.request.getMockImplementation()!
    fixture.request.mockImplementation((config: any) =>
      config.url === '/system/notice-user/myPage' && config.data.type === '1'
        ? Promise.reject(new Error('offline'))
        : normal(config),
    )

    await wrapper.get('[data-review-open]').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.notify-item')).toHaveLength(2)
    expect(wrapper.findAll('.notify-item.unread')).toHaveLength(2)
  })

  it('单条标记已读失败时保留未读且允许重试', async () => {
    const wrapper = await render()
    const normal = fixture.request.getMockImplementation()!
    fixture.request.mockImplementation((config: any) =>
      config.url === '/system/notice-user/markAsRead/11'
        ? Promise.reject(new Error('offline'))
        : normal(config),
    )
    const first = wrapper.findAll('.notify-item')[0]

    await first.trigger('click')
    await flushPromises()
    expect(wrapper.findAll('.notify-item.unread')).toHaveLength(2)
    expect(wrapper.get('[data-review-badge]').attributes('data-review-badge')).toBe('2')

    fixture.request.mockImplementation(normal)
    await first.trigger('click')
    await flushPromises()
    expect(wrapper.findAll('.notify-item.unread')).toHaveLength(1)
    expect(wrapper.get('[data-review-badge]').attributes('data-review-badge')).toBe('1')
  })

  it('全部标记已读失败时保留未读状态并收口 rejection', async () => {
    const wrapper = await render()
    const normal = fixture.request.getMockImplementation()!
    fixture.request.mockImplementation((config: any) =>
      config.url === '/system/notice-user/markAllAsRead'
        ? Promise.reject(new Error('offline'))
        : normal(config),
    )

    await wrapper.find('.notify-footer > div').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.notify-item.unread')).toHaveLength(2)
    expect(wrapper.get('[data-review-badge]').attributes('data-review-badge')).toBe('2')
  })
})
