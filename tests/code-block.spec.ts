import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import CodeBlock from '@/views/tool/generateCode/components/CodeBlock.vue'
import { setupHljs } from '@/plugins/hljs'

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: 'zh-CN',
  messages: { 'zh-CN': {}, 'en-US': {} },
  missingWarn: false,
  fallbackWarn: false,
})

// el-button 在源码里由自动导入解析；测试里直接打桩，避免未解析告警
const mountOpts = {
  global: { plugins: [i18n], stubs: { 'el-button': { template: '<button><slot /></button>' } } },
}

/**
 * 代码块高亮。
 *
 * highlight.js（核心 + 4 个语言包，raw 117KB）以前在入口全局注册，
 * 但它只服务这一个组件。改成随组件懒加载后，最容易踩的坑是
 * **组件没被正确局部注册**：`<highlightjs>` 会原样留在 DOM 里，
 * 页面不报错、只是不高亮——所以这里断言渲染结果而不是"没抛错"。
 */
describe('CodeBlock', () => {
  it('注册 hljs 后能渲染出高亮标记', () => {
    setupHljs()
    const wrapper = mount(CodeBlock, {
      props: { code: 'public class A {}', language: 'java' },
      ...mountOpts,
    })

    // 未正确注册时会是未解析的自定义标签
    expect(wrapper.find('highlightjs').exists()).toBe(false)
    expect(wrapper.find('pre code.hljs').exists()).toBe(true)
    expect(wrapper.html()).toContain('hljs-keyword')
  })

  it('重复调用 setupHljs 不会重复注册（幂等）', () => {
    expect(() => {
      setupHljs()
      setupHljs()
    }).not.toThrow()
  })

  it('空代码不报错', () => {
    const wrapper = mount(CodeBlock, { props: { code: '', language: 'java' }, ...mountOpts })
    expect(wrapper.find('.code-block-container').exists()).toBe(true)
  })
})
