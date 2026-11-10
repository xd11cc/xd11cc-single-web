import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'

const fixture = vi.hoisted(() => ({
  token: '', request: vi.fn(), getUserInfo: vi.fn(), getRoutes: vi.fn(), logout: vi.fn(),
}))
vi.mock('@/views/login/apis/index', () => ({
  getUserInfo: () => fixture.getUserInfo(), getRoutes: () => fixture.getRoutes(),
  loginByPassword: vi.fn(), logout: () => fixture.logout(),
}))
vi.mock('@@/utils/cache/cookies', () => ({
  getToken: () => fixture.token,
  setToken: (value: string) => { fixture.token = value },
  removeToken: () => { fixture.token = '' },
}))
vi.mock('@/router', () => ({ resetRouter: vi.fn(), publicRoutes: [] }))
vi.mock('@/router/config', () => ({ routerConfig: { defaultRoles: ['default'] } }))
vi.mock('@/pinia/stores/settings', () => ({ useSettingsStore: () => ({ cacheTagsView: false }) }))
vi.mock('@/pinia/stores/tags-view', () => ({ useTagsViewStore: () => ({ delAllVisitedViews: vi.fn(), delAllCachedViews: vi.fn() }) }))
vi.mock('@@/utils/request', () => ({
  default: (config: any) => fixture.request(config), LONG_REQUEST_TIMEOUT: 60_000,
  resetUnauthorizedHandling: vi.fn(),
}))
vi.mock('@@/composables/useTitle', () => ({ useTitle: () => ({ setTitle: vi.fn() }) }))
vi.mock('@@/composables/useRouteListener', () => ({ setRouteChange: vi.fn() }))
vi.mock('@/i18n', () => ({ i18n: { global: { t: (key: string) => key } } }))
vi.mock('nprogress', () => ({ default: { configure: vi.fn(), start: vi.fn(), done: vi.fn() } }))
vi.mock('element-plus', () => ({ ElMessage: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@@/composables/useOssUrl', async () => {
  const { ref } = await import('vue')
  return { useOssUrl: () => ({ ossUrl: ref('https://review.invalid/oss/') }) }
})
vi.mock('@@/composables/useDict', () => ({ useDict: () => ({ getDictList: () => [], getDictItem: () => undefined }) }))

import { useUserStore } from '@/pinia/stores/user'
import { usePermissionStore } from '@/pinia/stores/permission'
import { registerNavigationGuard } from '@/router/guard'
import { getPermissionInitialization } from '@/router/permission-init'
import Profile from '@/views/system/user/profile/index.vue'

function deferred() {
  let resolve!: (value: any) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<any>((done, fail) => { resolve = done; reject = fail })
  return { promise, resolve, reject }
}
function user(id: number) {
  return { code: 200, data: { id, username: `user-${id}`, nickname: `User ${id}`, roles: [`role-${id}`], permissions: [`permission-${id}`] } }
}
const backendRoute = { id: 1, parentId: null, name: 'AccountARoute', path: '/account-a-page', component: 'system/user/index', meta: { title: 'A only' } }
let pinia: ReturnType<typeof createPinia>
const wrappers: any[] = []
beforeEach(() => {
  fixture.token = ''
  fixture.getUserInfo.mockReset().mockImplementation(async () => user(fixture.token === 'token-b' ? 2 : 1))
  fixture.getRoutes.mockReset().mockResolvedValue({ code: 200, data: [backendRoute] })
  fixture.logout.mockReset().mockResolvedValue({ code: 200 })
  fixture.request.mockReset().mockResolvedValue({ code: 200, data: 1 })
  pinia = createPinia()
  setActivePinia(pinia)
})
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount())
  vi.useRealTimers()
})
async function loginAs(id: number) {
  const store = useUserStore()
  store.setToken(id === 2 ? 'token-b' : 'token-a')
  await store.getInfo()
  return store
}
function guardHarness() {
  let before: any
  const router = {
    beforeEach: (fn: any) => { before = fn }, afterEach: vi.fn(), onError: vi.fn(), addRoute: vi.fn(),
  }
  registerNavigationGuard(router as any)
  return {
    router,
    navigate: () => before({ path: '/account-a-page', fullPath: '/account-a-page', query: {}, meta: {} }, { path: '/login' }),
  }
}

describe('本轮新增：权限初始化的会话一致性', () => {
  it('B 已完成菜单初始化后，迟到的 A 路由不能覆盖 B 的侧栏菜单', async () => {
    const pendingA = deferred()
    const routeB = { ...backendRoute, name: 'AccountBRoute', path: '/account-b-page' }
    fixture.getRoutes.mockReturnValueOnce(pendingA.promise).mockResolvedValueOnce({ code: 200, data: [routeB] })
    const store = await loginAs(1)
    const harness = guardHarness()
    const navigatingA = harness.navigate()
    await flushPromises()
    store.resetToken()
    await loginAs(2)
    await harness.navigate()
    expect(usePermissionStore().routes.map(route => route.name)).toEqual(['AccountBRoute'])
    pendingA.resolve({ code: 200, data: [backendRoute] })
    await navigatingA
    expect(store.token).toBe('token-b')
    expect(usePermissionStore().routes.map(route => route.name)).toEqual(['AccountBRoute'])
  })

  it('A 的初始化 finally 不应清掉正在执行的 B 初始化 Promise', async () => {
    const pendingA = deferred()
    const pendingB = deferred()
    fixture.getRoutes.mockReturnValueOnce(pendingA.promise).mockReturnValueOnce(pendingB.promise)
    const store = await loginAs(1)
    const harness = guardHarness()
    const navigatingA = harness.navigate()
    await flushPromises()
    store.resetToken()
    await loginAs(2)
    const navigatingB = harness.navigate()
    await flushPromises()
    expect(getPermissionInitialization()).not.toBeNull()
    pendingA.resolve({ code: 200, data: [backendRoute] })
    await navigatingA
    const bInitialization = getPermissionInitialization()
    pendingB.resolve({ code: 200, data: [] })
    await navigatingB
    expect(bInitialization).not.toBeNull()
  })
  it('对照：当前账号的路由正常完成注册', async () => {
    await loginAs(1)
    const harness = guardHarness()
    await harness.navigate()
    expect(harness.router.addRoute).toHaveBeenCalled()
    expect(usePermissionStore().routesReady).toBe(true)
  })

  it('拉取 A 路由期间换成 B，不应把 A 路由注册进 B 会话', async () => {
    const pending = deferred()
    fixture.getRoutes.mockReturnValue(pending.promise)
    const store = await loginAs(1)
    const harness = guardHarness()
    const navigation = harness.navigate()
    await flushPromises()
    expect(fixture.getRoutes).toHaveBeenCalledTimes(1)
    store.resetToken()
    await loginAs(2)
    pending.resolve({ code: 200, data: [backendRoute] })
    await navigation
    expect(store.token).toBe('token-b')
    expect(harness.router.addRoute).not.toHaveBeenCalled()
    expect(usePermissionStore().routesReady).toBe(false)
  })

  it('A 的迟到初始化失败不应清掉 B 的 token', async () => {
    const pending = deferred()
    fixture.getRoutes.mockReturnValue(pending.promise)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const store = await loginAs(1)
    const harness = guardHarness()
    const navigation = harness.navigate()
    await flushPromises()
    store.resetToken()
    await loginAs(2)
    pending.reject(new Error('synthetic A route failure'))
    await navigation
    expect(store.token).toBe('token-b')
  })

  it('A 的迟到登出完成不应清掉后来登录的 B', async () => {
    const pending = deferred()
    fixture.logout.mockReturnValue(pending.promise)
    const store = await loginAs(1)
    const loggingOut = store.logout()
    store.resetToken()
    await loginAs(2)
    pending.resolve({ code: 200 })
    await loggingOut
    expect(store.token).toBe('token-b')
  })
})

const Container = defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) })
const Button = defineComponent({
  props: ['loading', 'disabled'],
  setup: (props, { slots }) => () => h('button', { disabled: props.loading || props.disabled }, slots.default?.()),
})
const Form = defineComponent({
  setup(_, { expose, slots }) {
    expose({ validate: (callback: (valid: boolean) => void) => callback(true), resetFields: vi.fn() })
    return () => h('form', slots.default?.())
  },
})
const Dialog = defineComponent({
  props: ['modelValue'],
  setup: (props, { slots }) => () => props.modelValue ? h('section', [slots.default?.(), slots.footer?.()]) : null,
})
async function renderProfile() {
  usePermissionStore().markRoutesReady()
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/dashboard', component: Container }, { path: '/login', component: Container },
    { path: '/user/profile', component: Container },
  ] })
  registerNavigationGuard(router)
  await router.push('/user/profile')
  await router.isReady()
  const wrapper = mount(Profile, { global: { plugins: [pinia, router], stubs: {
    ElButton: Button, ElForm: Form, ElFormItem: Container, ElRow: Container, ElCol: Container,
    ElInput: Container, ElTabs: Container, ElTabPane: Container, ElDialog: Dialog, ElSlider: Container,
    ElAvatar: Container, ElTag: Container, ElDivider: Container, ElRadioGroup: Container, ElRadio: Container,
  } } })
  wrappers.push(wrapper)
  await flushPromises()
  return { wrapper, router }
}
function button(wrapper: any, label: string) {
  const result = wrapper.findAll('button').find((item: any) => item.text() === label)
  if (!result) throw new Error(`Review harness could not find button ${label}`)
  return result
}

describe('本轮新增：个人中心的异步写入', () => {
  it('A 的改密响应在 B 登录后才返回时，旧响应不能安排登出 B', async () => {
    const changing = deferred()
    fixture.request.mockImplementation((config: any) => config.url === '/system/user/changePassword' ? changing.promise : Promise.resolve({ code: 200, data: 1 }))
    const store = await loginAs(1)
    const { wrapper } = await renderProfile()
    vi.useFakeTimers()
    await button(wrapper, 'system.user.profile.actions.confirmChange').trigger('click')
    await flushPromises()
    expect(fixture.request.mock.calls.some(call => call[0].url === '/system/user/changePassword')).toBe(true)
    store.resetToken()
    await loginAs(2)
    changing.resolve({ code: 200, data: 1 })
    await flushPromises()
    await vi.advanceTimersByTimeAsync(1500)
    await flushPromises()
    expect(store.token).toBe('token-b')
    expect(fixture.logout).not.toHaveBeenCalled()
  })
  it('A 改密后的延迟任务不能登出已登录的 B', async () => {
    const store = await loginAs(1)
    const { wrapper } = await renderProfile()
    vi.useFakeTimers()
    await button(wrapper, 'system.user.profile.actions.confirmChange').trigger('click')
    await flushPromises()
    store.resetToken()
    await loginAs(2)
    await vi.advanceTimersByTimeAsync(1500)
    await flushPromises()
    expect(store.token).toBe('token-b')
    expect(fixture.logout).not.toHaveBeenCalled()
  })
  it('修改密码成功后，延迟的 logout 完成时应停在登录页', async () => {
    const pendingLogout = deferred()
    fixture.logout.mockReturnValue(pendingLogout.promise)
    const store = await loginAs(1)
    const { wrapper, router } = await renderProfile()
    vi.useFakeTimers()
    await button(wrapper, 'system.user.profile.actions.confirmChange').trigger('click')
    await flushPromises()
    expect(fixture.request.mock.calls.some(call => call[0].url === '/system/user/changePassword')).toBe(true)
    await vi.advanceTimersByTimeAsync(1500)
    await flushPromises()
    pendingLogout.resolve({ code: 200 })
    await flushPromises()
    expect(store.token).toBe('')
    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('A 的头像上传迟到时，不能用新账号 B 的 id 更新头像', async () => {
    const pendingUpload = deferred()
    fixture.request.mockImplementation((config: any) => config.url === '/file/upload'
      ? pendingUpload.promise : Promise.resolve({ code: 200, data: 1 }))
    const store = await loginAs(1)
    const { wrapper } = await renderProfile()
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:synthetic-review-avatar')
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as any)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(callback => callback(new Blob(['cropped'], { type: 'image/jpeg' })))
    const input = wrapper.get('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [new File(['image'], 'a.jpg', { type: 'image/jpeg' })], configurable: true })
    await input.trigger('change')
    await flushPromises()
    const image = wrapper.get('.crop-area img').element
    Object.defineProperty(image, 'complete', { value: true, configurable: true })
    Object.defineProperty(image, 'naturalWidth', { value: 256, configurable: true })
    Object.defineProperty(image, 'naturalHeight', { value: 256, configurable: true })
    await button(wrapper, 'system.user.profile.actions.confirmUpload').trigger('click')
    await flushPromises()
    expect(fixture.request.mock.calls.some(call => call[0].url === '/file/upload')).toBe(true)
    wrapper.unmount()
    wrappers.splice(wrappers.indexOf(wrapper), 1)
    store.resetToken()
    await loginAs(2)
    pendingUpload.resolve({ code: 200, data: { fileId: 'a-file', objectKey: 'avatars/a.jpg' } })
    await flushPromises()
    expect(store.userId).toBe(2)
    expect(fixture.request.mock.calls.filter(call => call[0].url === '/system/user/modifyById')).toEqual([])
  })
})
