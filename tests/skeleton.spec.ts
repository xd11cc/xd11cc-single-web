import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Skeleton from '@/common/components/Skeleton/index.vue'

/**
 * 骨架屏的延迟策略。
 *
 * 它决定「首屏到底闪不闪」：接口比 delay 快时完全不出骨架，
 * 否则会出现"骨架闪一下就被真实内容替换"，比不显示更难受。
 */
describe('Skeleton 延迟', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('180ms 内返回数据时不显示骨架', async () => {
    const wrapper = mount(Skeleton, { props: { loading: true, variant: 'table' } })

    vi.advanceTimersByTime(179)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.skeleton-table').exists()).toBe(false)

    await wrapper.setProps({ loading: false })
    expect(wrapper.find('.skeleton-table').exists()).toBe(false)
  })

  it('超过 delay 才显示骨架', async () => {
    const wrapper = mount(Skeleton, { props: { loading: true, variant: 'table', delay: 180 } })

    vi.advanceTimersByTime(180)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.skeleton-table').exists()).toBe(true)
  })

  it('delay=0 立即显示', async () => {
    const wrapper = mount(Skeleton, { props: { loading: true, variant: 'table', delay: 0 } })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.skeleton-table').exists()).toBe(true)
  })

  it('行数与列数按 props 渲染', async () => {
    const wrapper = mount(Skeleton, {
      props: { loading: true, variant: 'table', delay: 0, rows: 3, columns: 2 },
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.skeleton-table-row')).toHaveLength(3)
    expect(wrapper.findAll('.skeleton-table-cell')).toHaveLength(6)
  })
})
