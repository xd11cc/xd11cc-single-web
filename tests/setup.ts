import { vi } from 'vitest'

// Element Plus 的部分组件依赖这些浏览器 API，happy-dom 里没有实现
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

// 图标组件统一打桩：测试关心的是结构，不是图标内容
vi.mock('@iconify/vue', () => ({
  Icon: { name: 'Icon', render: () => null },
}))
