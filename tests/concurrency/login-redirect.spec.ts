import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'

const fixture = vi.hoisted(() => ({ userLogin: vi.fn(), captcha: vi.fn() }))
vi.mock('@/pinia/stores/user', () => ({ useUserStore: () => ({ userLogin: fixture.userLogin }) }))
vi.mock('@/views/login/apis', () => ({
  getCaptcha: () => fixture.captcha(), socialLogin: vi.fn(),
  getSocialClientConfigList: vi.fn(async () => ({ code: 200, data: [] })),
}))
vi.mock('@@/composables/useOssUrl', () => ({ useOssUrl: () => ({ ossUrl: ref('') }) }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('element-plus', () => ({ ElNotification: vi.fn() }))

import LoginForm from '@/views/login/components/LoginForm.vue'

const Container = defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) })
const Button = defineComponent({ props: ['loading'], setup: (props, { slots }) => () => h('button', { disabled: props.loading }, slots.default?.()) })
const Form = defineComponent({
  setup(_, { expose, slots }) {
    expose({ validate: (callback: (valid: boolean) => void) => callback(true) })
    return () => h('form', slots.default?.())
  },
})
const wrappers: any[] = []
beforeEach(() => {
  fixture.userLogin.mockReset().mockResolvedValue(undefined)
  fixture.captcha.mockReset().mockResolvedValue({ code: 200, data: { captchaId: 'review', image: '' } })
})
afterEach(() => wrappers.splice(0).forEach(wrapper => wrapper.unmount()))
async function loginTo(target: string) {
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/login', component: Container }, { path: '/target', component: Container },
  ] })
  await router.push({ path: '/login', query: { redirect: target } })
  await router.isReady()
  // vue-router has already decoded the outer redirect value by this point.
  expect(router.currentRoute.value.query.redirect).toBe(target)
  const wrapper = mount(LoginForm, { global: { plugins: [router], stubs: {
    ElForm: Form, ElFormItem: Container, ElInput: Container, ElCheckbox: Container,
    ElButton: Button, ElDivider: Container,
  } } })
  wrappers.push(wrapper)
  await flushPromises()
  await wrapper.get('.login-btn').trigger('click')
  await flushPromises()
  expect(fixture.userLogin).toHaveBeenCalledOnce()
  return router.currentRoute.value
}

describe('本轮新增：登录后恢复原始地址', () => {
  it('对照：普通参数能够在登录后保留', async () => {
    const route = await loginTo('/target?status=ACTIVE')
    expect(route.path).toBe('/target')
    expect(route.query).toEqual({ status: 'ACTIVE' })
  })

  it('redirect 内的编码参数不应被再解码而拆成另一条查询参数', async () => {
    const value = '/workflow/definition?status=ACTIVE&name=A'
    const route = await loginTo(`/target?returnTo=${encodeURIComponent(value)}`)
    expect(route.path).toBe('/target')
    expect(route.query).toEqual({ returnTo: value })
  })
})
