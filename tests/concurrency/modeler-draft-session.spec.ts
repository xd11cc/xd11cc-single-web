import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, reactive } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

const fixture = vi.hoisted(() => ({
  request: vi.fn(),
  responses: new Map<string, unknown>(),
  route: null as any,
  exporter: null as null | (() => Promise<string>),
  importGate: null as null | ((xml: string) => Promise<void>),
  router: { push: vi.fn(), replace: vi.fn(async () => undefined) },
}))
vi.mock('@@/utils/request', () => ({ default: (config: any) => fixture.request(config) }))
vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('vue-router', () => ({ useRoute: () => fixture.route, useRouter: () => fixture.router }))
vi.mock('@/views/bpm/modeler/components/PropertyPanel.vue', () => ({
  default: { render: () => null },
}))
vi.mock('@/views/tool/generateCode/components/CodeBlock.vue', () => ({
  default: { render: () => null },
}))
// The real editor imports xml only on initialization or explicit importXml calls.
vi.mock('@/views/bpm/modeler/components/BpmnDesigner.vue', async () => {
  const { defineComponent, h, onMounted, ref } = await import('vue')
  return {
    default: defineComponent({
      name: 'ReviewBpmnDesigner',
      props: ['xml'],
      emits: ['ready', 'selected', 'changed', 'editing'],
      setup(props, { expose, emit }) {
        const editorXml = ref(props.xml)
        // Mirror BpmnDesigner.importXml's documented "selected process root" event.
        const selectRoot = (xml: string) => {
          // happy-dom does not reliably resolve prefixed XML namespaces. Only parse
          // the known fixture root attributes here; XML validation belongs to bpmn-js.
          const tag = xml.match(/<(?:[\w.-]+:)?process\b[^>]*>/)?.[0]
          if (tag)
            emit('selected', {
              type: 'bpmn:Process',
              businessObject: {
                id: tag.match(/\bid="([^"]+)"/)?.[1],
                name: tag.match(/\bname="([^"]*)"/)?.[1],
                get: () => '',
              },
            })
        }
        expose({
          importXml: async (xml: string) => {
            await fixture.importGate?.(xml)
            editorXml.value = xml
            selectRoot(xml)
          },
          saveXml: async () => (fixture.exporter ? fixture.exporter() : editorXml.value),
        })
        onMounted(() => {
          selectRoot(editorXml.value)
          emit('ready')
        })
        return () => h('div', { class: 'review-editor' }, editorXml.value)
      },
    }),
  }
})
import Modeler from '@/views/bpm/modeler/index.vue'

const wrappers: any[] = []
const xmlA =
  '<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" targetNamespace="review"><process id="draft_A" name="A"/></definitions>'
const xmlB =
  '<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" targetNamespace="review"><process id="draft_B" name="B"/></definitions>'
const Button = defineComponent({
  props: ['loading', 'disabled'],
  setup:
    (props, { slots }) =>
    () =>
      h('button', { disabled: props.loading || props.disabled }, slots.default?.()),
})
const Container = defineComponent({
  setup:
    (_, { slots }) =>
    () =>
      h('div', slots.default?.()),
})
const Dialog = defineComponent({
  props: ['modelValue'],
  setup:
    (props, { slots }) =>
    () =>
      props.modelValue ? h('div', slots.default?.()) : null,
})
function deferred() {
  let resolve!: (value: any) => void
  const promise = new Promise<any>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
function response(id: string, xml: string) {
  return { code: 200, data: { id, name: id, key: id, editorSource: xml } }
}
function saveCalls() {
  return fixture.request.mock.calls
    .map((call) => call[0])
    .filter((config) => config.url === '/workflow/draft/save')
}
beforeEach(() => {
  fixture.exporter = null
  fixture.importGate = null
  fixture.router.push.mockClear()
  fixture.router.replace.mockClear()
  fixture.route = reactive({ query: { modelId: 'A' } })
  fixture.responses.clear()
  fixture.responses.set('/workflow/draft/A', Promise.resolve(response('A', xmlA)))
  fixture.responses.set('/workflow/draft/B', Promise.resolve(response('B', xmlB)))
  fixture.request
    .mockReset()
    .mockImplementation(
      (config: any) => fixture.responses.get(config.url) || new Promise(() => undefined),
    )
})
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))
async function render() {
  const wrapper = mount(Modeler, {
    global: {
      stubs: {
        ElButton: Button,
        ElDropdown: Container,
        ElDropdownItem: Container,
        ElDropdownMenu: Container,
        ElDialog: Dialog,
        ElRadioGroup: Container,
        ElRadioButton: Container,
        ElInput: Container,
      },
    },
  })
  wrappers.push(wrapper)
  await flushPromises()
  return wrapper
}

describe('本轮新增：草稿保存与发布会话', () => {
  it('切换到没有 editorSource 的 B 草稿时不应向 B 提交 A 的旧流程', async () => {
    const wrapper = await render()
    fixture.responses.set(
      '/workflow/draft/B',
      Promise.resolve({ code: 200, data: { id: 'B', name: 'B', key: 'draft_B' } }),
    )
    fixture.route.query = { modelId: 'B' }
    await flushPromises()
    await wrapper.get('.save-button').trigger('click')
    await flushPromises()
    const payload = saveCalls()[0].data
    expect(payload.modelId).toBe('B')
    expect(payload.editorSource).not.toBe(xmlA)
  })
  it('保存 A 的 XML 期间切到 B，A 的保存载荷仍应使用 A 的元数据', async () => {
    const xmlPending = deferred()
    fixture.exporter = () => xmlPending.promise
    const wrapper = await render()
    await wrapper.get('.save-button').trigger('click')
    await flushPromises()
    fixture.route.query = { modelId: 'B' }
    await flushPromises()
    expect(wrapper.get('.review-editor').text()).toBe(xmlB)
    xmlPending.resolve(xmlA)
    await flushPromises()
    expect(saveCalls()[0].data).toMatchObject({
      modelId: 'A',
      name: 'A',
      key: 'draft_A',
      editorSource: xmlA,
    })
  })

  it('保存 A 的接口迟到返回时不应把当前 B 草稿切回 A', async () => {
    const pending = deferred()
    fixture.responses.set('/workflow/draft/save', pending.promise)
    const wrapper = await render()
    await wrapper.get('.save-button').trigger('click')
    await flushPromises()
    expect(saveCalls()[0].data.modelId).toBe('A')
    fixture.route.query = { modelId: 'B' }
    await flushPromises()
    expect(wrapper.get('.review-editor').text()).toBe(xmlB)
    pending.resolve(response('A', xmlA))
    await flushPromises()
    expect(wrapper.get('.review-editor').text()).toBe(xmlB)
  })

  it('新建草稿保存期间切到别的草稿再回到新建，旧响应不应绑定到当前新建草稿', async () => {
    // 起点是「新建」状态（没有 modelId）
    fixture.route.query = {}
    const pending = deferred()
    fixture.responses.set('/workflow/draft/save', pending.promise)
    const wrapper = await render()

    await wrapper.get('.save-button').trigger('click')
    await flushPromises()
    expect(saveCalls()[0].data.modelId, '新建草稿不应带 modelId').toBeUndefined()

    // 保存还在路上：切到 B，再切回「新建」
    fixture.route.query = { modelId: 'B' }
    await flushPromises()
    fixture.route.query = {}
    await flushPromises()

    // 旧保存响应这时才回来
    pending.resolve({
      code: 200,
      data: { id: 'saved-from-old-session', name: 'x', key: 'draft_x' },
    })
    await flushPromises()

    // 当前是全新的空白草稿：不能被旧响应改造成「已保存的草稿 A」
    expect(fixture.router.replace, '旧响应把新草稿替换成了旧草稿的地址').not.toHaveBeenCalled()

    await wrapper.get('.save-button').trigger('click')
    await flushPromises()
    expect(saveCalls()[1]?.data.modelId, '旧响应的 savedId 被写进了当前新建草稿').toBeUndefined()
  })

  it('发布 A 的参数检查期间切到 B，部署目标仍应是 A', async () => {
    const paramsPending = deferred()
    const xmlWithExpression =
      '<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:flowable="http://flowable.org/bpmn" targetNamespace="review"><process id="draft_A" name="A"><userTask id="task_A" flowable:expressionConfigKey="chooseApprover" /></process></definitions>'
    fixture.responses.set('/workflow/draft/A', Promise.resolve(response('A', xmlWithExpression)))
    fixture.responses.set('/workflow/draft/save', Promise.resolve(response('A', xmlWithExpression)))
    fixture.responses.set('/workflow/expression-config/options', paramsPending.promise)
    fixture.responses.set(
      '/workflow/draft/deploy',
      Promise.resolve({ code: 200, data: 'deployment' }),
    )
    const wrapper = await render()
    const publish = wrapper
      .findAll('button')
      .find((button) => button.text() === 'bpm.modeler.actions.publish')
    expect(publish).toBeDefined()
    await publish!.trigger('click')
    await flushPromises()
    expect(
      fixture.request.mock.calls.filter(
        (call) => call[0].url === '/workflow/expression-config/options',
      ),
    ).toHaveLength(4)
    fixture.route.query = { modelId: 'B' }
    await flushPromises()
    paramsPending.resolve({ code: 200, data: [] })
    await flushPromises()
    const deployments = fixture.request.mock.calls.filter(
      (call) => call[0].url === '/workflow/draft/deploy',
    )
    expect(deployments.map((call) => call[0].data.modelId)).toEqual(['A'])
  })

  it('保存后回读 XML 期间用户继续编辑，迟到回读不应覆盖新改动', async () => {
    const detailPending = deferred()
    const wrapper = await render()
    fixture.responses.set('/workflow/draft/save', Promise.resolve(response('A', xmlA)))
    fixture.responses.set('/workflow/draft/A', detailPending.promise)
    await wrapper.get('.save-button').trigger('click')
    await flushPromises()
    const modified = xmlA.replace('name="A"', 'name="A 新改动"')
    const designer = wrapper.findComponent({ name: 'ReviewBpmnDesigner' })
    await (designer.vm as any).importXml(modified)
    // Real BpmnDesigner emits editing synchronously, while changed waits for its 220ms export debounce.
    designer.vm.$emit('editing')
    detailPending.resolve(response('A', xmlA))
    await flushPromises()
    expect(wrapper.get('.review-editor').text()).toBe(modified)
  })

  it('同一设计器先后新建两个流程时 XML 内的流程标识应不同', async () => {
    const wrapper = await render()
    fixture.route.query = {}
    await flushPromises()
    const firstXml = wrapper.get('.review-editor').text()
    const firstId = firstXml.match(/<(?:[\w.-]+:)?process\b[^>]*\bid="([^"]+)"/)?.[1]
    expect(firstId).toBeTruthy()
    fixture.route.query = { modelId: 'B' }
    await flushPromises()
    fixture.route.query = {}
    await flushPromises()
    const secondXml = wrapper.get('.review-editor').text()
    const secondId = secondXml.match(/<(?:[\w.-]+:)?process\b[^>]*\bid="([^"]+)"/)?.[1]
    expect(secondId).toBeTruthy()
    expect(secondId).not.toBe(firstId)
  })
})

describe('本轮新增：过期的画布导入', () => {
  it('A 的 bpmn-js 导入迟于 B 完成时，B 仍是最终画布且加载期间不可保存', async () => {
    const aImport = deferred()
    fixture.importGate = (xml) => (xml === xmlA ? aImport.promise : Promise.resolve())
    fixture.responses.set('/workflow/draft/save', Promise.resolve(response('B', xmlB)))
    const wrapper = await render()
    expect(wrapper.get('.save-button').attributes('disabled')).toBeDefined()

    fixture.route.query = { modelId: 'B' }
    await flushPromises()
    expect(wrapper.get('.save-button').attributes('disabled')).toBeDefined()

    aImport.resolve(undefined)
    await flushPromises()
    expect(wrapper.get('.review-editor').text()).toBe(xmlB)
    expect(wrapper.get('.save-button').attributes('disabled')).toBeUndefined()

    await wrapper.get('.save-button').trigger('click')
    await flushPromises()
    expect(saveCalls()[0].data).toMatchObject({ modelId: 'B', editorSource: xmlB })
  })

  it('新建草稿的重置导入期间切到 B 时，迟到的空白导入不能成为最终画布', async () => {
    const blankImport = deferred()
    fixture.responses.set('/workflow/draft/save', Promise.resolve(response('B', xmlB)))
    const wrapper = await render()
    fixture.importGate = (xml) =>
      xml !== xmlA && xml !== xmlB ? blankImport.promise : Promise.resolve()

    fixture.route.query = {}
    await flushPromises()
    expect(wrapper.get('.save-button').attributes('disabled')).toBeDefined()
    fixture.route.query = { modelId: 'B' }
    await flushPromises()
    blankImport.resolve(undefined)
    await flushPromises()

    expect(wrapper.get('.review-editor').text()).toBe(xmlB)
    expect(wrapper.get('.save-button').attributes('disabled')).toBeUndefined()
    await wrapper.get('.save-button').trigger('click')
    await flushPromises()
    expect(saveCalls()[0].data).toMatchObject({ modelId: 'B', editorSource: xmlB })
  })
})

describe('继续评估：设计器上下文', () => {
  it('缓存的设计器从编辑 A 返回新增时，应使用全新的流程内容', async () => {
    const wrapper = await render()
    expect(wrapper.get('.review-editor').text()).toBe(xmlA)
    fixture.route.query = {}
    await flushPromises()
    await wrapper.get('.save-button').trigger('click')
    await flushPromises()
    const payload = saveCalls()[0].data
    expect(payload.modelId).toBeUndefined()
    expect(payload.editorSource).not.toBe(xmlA)
  })

  it('切换到 B、B 尚未加载完成时，不应把 A 的内容保存到 B', async () => {
    const pending = deferred()
    const wrapper = await render()
    fixture.responses.set('/workflow/draft/B', pending.promise)
    fixture.route.query = { modelId: 'B' }
    await flushPromises()
    await wrapper.get('.save-button').trigger('click')
    await flushPromises()
    expect(saveCalls()).toEqual([])
  })

  it('对照：B 已完成加载后，旧 A 详情响应不会覆盖 B', async () => {
    const pending = deferred()
    fixture.responses.set('/workflow/draft/A', pending.promise)
    const wrapper = await render()
    fixture.route.query = { modelId: 'B' }
    await flushPromises()
    pending.resolve(response('A', xmlA))
    await flushPromises()
    await wrapper.get('.save-button').trigger('click')
    await flushPromises()
    expect(saveCalls()[0].data.modelId).toBe('B')
    expect(saveCalls()[0].data.editorSource).toBe(xmlB)
  })
})
