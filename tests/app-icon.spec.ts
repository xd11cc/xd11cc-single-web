import { describe, expect, it, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import AppIcon from '@/common/components/AppIcon/index.vue'

const iconLoaded = vi.fn<(name: string) => boolean>()
const ensureIconCollection = vi.fn<(prefix: string) => Promise<void>>()

vi.mock('@iconify/vue', () => ({
  Icon: {
    name: 'Icon',
    props: ['icon'],
    template: '<i class="stub-icon" :data-icon="icon" />',
  },
  iconLoaded: (name: string) => iconLoaded(name),
}))

vi.mock('@/plugins/iconify', () => ({
  ensureIconCollection: (prefix: string) => ensureIconCollection(prefix),
}))

/**
 * 后端菜单的图标名在构建期不可知，只能运行时兜底：
 * 已在随包子集里的图标要同步渲染（不闪），不在的才等完整集合加载。
 */
describe('AppIcon', () => {
  beforeEach(() => {
    iconLoaded.mockReset()
    ensureIconCollection.mockReset().mockResolvedValue(undefined)
  })

  it('图标已在子集里：直接渲染，不触发懒加载', () => {
    iconLoaded.mockReturnValue(true)
    const wrapper = mount(AppIcon, { props: { icon: 'lucide:user' } })

    expect(wrapper.find('.stub-icon').attributes('data-icon')).toBe('lucide:user')
    expect(ensureIconCollection).not.toHaveBeenCalled()
  })

  it('图标不在子集里：懒加载完整集合后再渲染', async () => {
    let resolve!: () => void
    iconLoaded.mockReturnValue(false)
    ensureIconCollection.mockImplementation(
      () => new Promise<void>((r) => (resolve = () => r())),
    )

    const wrapper = mount(AppIcon, { props: { icon: 'lucide:some-rare-icon' } })
    expect(wrapper.find('.stub-icon').exists()).toBe(false)
    expect(ensureIconCollection).toHaveBeenCalledWith('lucide')

    resolve()
    await flushPromises()
    expect(wrapper.find('.stub-icon').attributes('data-icon')).toBe('lucide:some-rare-icon')
  })

  it('空图标名不渲染，也不请求集合', () => {
    const wrapper = mount(AppIcon, { props: { icon: '' } })

    expect(wrapper.find('.stub-icon').exists()).toBe(false)
    expect(ensureIconCollection).not.toHaveBeenCalled()
  })

  it('非内置前缀（在线图标）不会误触发本地集合加载', async () => {
    iconLoaded.mockReturnValue(false)
    const wrapper = mount(AppIcon, { props: { icon: 'mdi:home' } })
    await flushPromises()

    expect(ensureIconCollection).toHaveBeenCalledWith('mdi')
    // 交给 Iconify 的在线解析；本地不做任何事
    expect(wrapper.find('.stub-icon').exists()).toBe(true)
  })
})
