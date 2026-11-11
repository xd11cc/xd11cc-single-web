import { describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import FormDialog from '@/common/components/crudShell/FormDialog.vue'

/**
 * 弹窗提交锁的**会话语义**。
 *
 * 锁曾经是组件级布尔值，于是「旧请求在途时关掉弹窗、打开另一条记录」会让新弹窗
 * 继承上一个会话的 loading，并且无法提交——用户没点过任何东西，按钮却在转。
 * 现在锁绑定会话号：同一会话内串行，跨会话互不阻塞。
 */

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: 'zh-CN',
  messages: { 'zh-CN': {}, 'en-US': {} },
  missingWarn: false,
  fallbackWarn: false,
})

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

function makeSlotProps(overrides: Record<string, unknown> = {}) {
  return reactive({
    formData: { name: 'A' },
    dialogVisible: true,
    sessionId: 1,
    handleSubmit: vi.fn(() => Promise.resolve({ code: 200, msg: 'ok', data: 1 })),
    handleClose: () => {},
    ...overrides,
  })
}

function mountDialog(slotProps: any) {
  return mount(FormDialog, {
    props: { slotProps },
    global: {
      plugins: [i18n],
      stubs: {
        'el-dialog': { template: '<div><slot /><slot name="footer" /></div>' },
        'el-form': {
          template: '<form><slot /></form>',
          methods: { validate: () => Promise.resolve(true), clearValidate() {} },
        },
        'el-row': { template: '<div><slot /></div>' },
        'el-button': {
          template:
            '<button :disabled="disabled" :class="{ \'is-loading\': isLoading }"><slot /></button>',
          props: ['disabled', 'loading'],
          computed: {
            isLoading() {
              return this.loading
            },
          },
        },
      },
    },
  })
}

/** 弹窗底部第二个按钮是「确定」 */
const confirmButton = (wrapper: ReturnType<typeof mountDialog>) => wrapper.findAll('button')[1]

describe('FormDialog 提交锁的会话语义', () => {
  it('同一会话内连点，只提交一次', async () => {
    const pending = deferred<any>()
    const handleSubmit = vi.fn(() => pending.promise)
    const slotProps = makeSlotProps({ handleSubmit })
    const wrapper = mountDialog(slotProps)
    await nextTick()

    await confirmButton(wrapper).trigger('click')
    await nextTick()
    await confirmButton(wrapper).trigger('click')
    await nextTick()

    expect(handleSubmit).toHaveBeenCalledTimes(1)
    pending.resolve({ code: 200, msg: 'ok', data: 1 })
    wrapper.unmount()
  })

  it('旧请求在途时新会话不继承 loading，且可以提交', async () => {
    const first = deferred<any>()
    const handleSubmit = vi.fn().mockReturnValueOnce(first.promise).mockResolvedValue({
      code: 200,
      msg: 'ok',
      data: 2,
    })
    const slotProps = makeSlotProps({ handleSubmit })
    const wrapper = mountDialog(slotProps)
    await nextTick()

    // 会话 1 提交（挂起）
    await confirmButton(wrapper).trigger('click')
    await nextTick()
    expect(handleSubmit).toHaveBeenCalledTimes(1)

    // 关掉弹窗、打开另一条记录 → 会话 2
    slotProps.dialogVisible = false
    slotProps.sessionId = 2
    slotProps.formData = { name: 'B' }
    slotProps.dialogVisible = true
    await nextTick()
    await nextTick()

    expect(
      confirmButton(wrapper).classes(),
      '新会话的「确定」不该显示上一个会话的 loading',
    ).not.toContain('is-loading')

    await confirmButton(wrapper).trigger('click')
    await nextTick()
    expect(handleSubmit, '新会话应当能提交').toHaveBeenCalledTimes(2)

    // 旧请求结束后：不能关掉新弹窗，也不该把新会话的锁清掉
    first.resolve({ code: 200, msg: 'ok', data: 1 })
    await new Promise((r) => setTimeout(r, 0))
    await nextTick()
    expect(slotProps.dialogVisible, '旧请求把新弹窗关掉了').toBe(true)

    wrapper.unmount()
  })

  it('会话切换后，旧会话的收尾不会影响新会话的锁', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    const handleSubmit = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const slotProps = makeSlotProps({ handleSubmit })
    const wrapper = mountDialog(slotProps)
    await nextTick()

    await confirmButton(wrapper).trigger('click')
    await nextTick()

    slotProps.sessionId = 2
    slotProps.formData = { name: 'B' }
    await nextTick()
    await confirmButton(wrapper).trigger('click')
    await nextTick()
    expect(handleSubmit).toHaveBeenCalledTimes(2)

    // 旧请求先结束，新请求仍在途 → 新会话的按钮应保持 loading
    first.resolve({ code: 200, msg: 'ok', data: 1 })
    await new Promise((r) => setTimeout(r, 0))
    await nextTick()
    expect(confirmButton(wrapper).classes()).toContain('is-loading')

    second.resolve({ code: 200, msg: 'ok', data: 2 })
    await new Promise((r) => setTimeout(r, 0))
    await nextTick()
    expect(confirmButton(wrapper).classes()).not.toContain('is-loading')

    wrapper.unmount()
  })
})
