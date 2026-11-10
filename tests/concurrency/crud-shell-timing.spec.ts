import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h as vnode, inject, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import axios from 'axios'

const fixture = vi.hoisted(() => ({
  responses: new Map<string, unknown>(),
  request: vi.fn(),
  route: null as any,
  permissions: [] as string[],
  router: { push: vi.fn() },
}))

vi.mock('@@/utils/request', () => ({
  default: (config: any) => fixture.request(config),
  LONG_REQUEST_TIMEOUT: 60_000,
}))
vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
  ElMessageBox: { confirm: vi.fn(async () => undefined), prompt: vi.fn() },
}))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/views/tool/generateCode/components/CodeBlock.vue', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    default: defineComponent({
      props: ['code'],
      setup: (props) => () => h('pre', { class: 'review-code' }, String(props.code)),
    }),
  }
})
vi.mock('vue-router', () => ({ useRoute: () => fixture.route, useRouter: () => fixture.router }))
vi.mock('@/pinia/stores/user', () => ({
  useUserStore: () => ({ permissions: fixture.permissions }),
}))
vi.mock('@@/composables/useOssUrl', async () => {
  const { ref } = await import('vue')
  return { useOssUrl: () => ({ ossUrl: ref('https://review.invalid/oss/') }) }
})
vi.mock('@/common/composables/useDict', () => ({
  useDict: () => {
    const labels: Record<string, Record<string, string>> = {
      system_notice_type: { '1': '通知' },
      system_notice_status: { '0': '草稿' },
      system_read_status: { '0': '未读', '1': '已读' },
      workflow_definition_status: { ACTIVE: '运行中', SUSPENDED: '已挂起', DRAFT: '草稿' },
    }
    return {
      getDictList: () => [],
      getDictItem: (type: string, code: string) => ({
        value: code,
        label: labels[type]?.[code] || code,
      }),
    }
  },
}))
// Render caller-provided slots and use the real CRUD public Interface.
vi.mock('@/common/components/useCrud/index.vue', async () => {
  const { computed, defineComponent, h, provide } = await import('vue')
  return {
    default: defineComponent({
      name: 'ReviewCrudView',
      props: ['slotProps', 'columns', 'submitDisabled'],
      setup(props, { slots }) {
        provide(
          'review-active-row',
          computed(() => props.slotProps.tableData?.[0]),
        )
        provide(
          'review-rows',
          computed(() => props.slotProps.tableData || []),
        )
        return () =>
          h('div', [
            h('div', { class: 'review-search' }, slots['search-form']?.(props.slotProps)),
            slots['table-prefix']
              ? h('div', { class: 'review-table-prefix' }, slots['table-prefix'](props.slotProps))
              : null,
            slots.actions?.(props.slotProps),
            ...(props.slotProps.tableData || []).map((row: any) =>
              h(
                'button',
                {
                  'data-edit-id': row.id,
                  onClick: () => props.slotProps.handleEdit(row),
                },
                'Edit',
              ),
            ),
            h(
              'div',
              { class: 'review-cell-type' },
              props.slotProps.tableData?.[0]
                ? slots['cell-type']?.({ row: props.slotProps.tableData[0] })
                : [],
            ),
            h(
              'div',
              { class: 'review-cell-status' },
              props.slotProps.tableData?.[0]
                ? slots['cell-status']?.({ row: props.slotProps.tableData[0] })
                : [],
            ),
            h('div', { class: 'review-table-append' }, slots['table-append']?.(props.slotProps)),
            props.slotProps.dialogVisible
              ? h('div', { class: 'review-form' }, slots['form-fields']?.(props.slotProps))
              : null,
            props.slotProps.dialogVisible
              ? h(
                  'button',
                  {
                    'data-review-submit': true,
                    disabled: props.submitDisabled,
                    onClick: () => {
                      void props.slotProps.handleSubmit(false).catch(() => undefined)
                    },
                  },
                  'Save',
                )
              : null,
            slots.extra?.(props.slotProps),
          ])
      },
    }),
  }
})

import UserPage from '@/views/system/user/index.vue'
import RolePage from '@/views/system/role/index.vue'
import AuthClientPage from '@/views/system/authClient/index.vue'
import DictDataPage from '@/views/system/dict/data.vue'
import NoticePage from '@/views/system/notice/index.vue'
import PostPage from '@/views/system/post/index.vue'
import NoticeUserPage from '@/views/system/noticeUser/index.vue'
import DefinitionPage from '@/views/bpm/definition/index.vue'
import GenerateCodePage from '@/views/tool/generateCode/index.vue'
import { resetPassword } from '@/views/system/user/apis'

const Container = defineComponent({
  setup:
    (_, { slots }) =>
    () =>
      vnode('div', slots.default?.()),
})
const Button = defineComponent({
  props: ['loading', 'disabled'],
  setup:
    (props, { slots }) =>
    () =>
      vnode('button', { disabled: props.disabled || props.loading }, slots.default?.()),
})
const FormItem = defineComponent({
  props: ['prop', 'label'],
  setup:
    (props, { slots }) =>
    () =>
      vnode('div', { 'data-prop': props.prop }, slots.default?.()),
})
const Input = defineComponent({
  props: ['modelValue', 'disabled'],
  emits: ['update:modelValue'],
  setup:
    (props, { emit }) =>
    () =>
      vnode('input', {
        value: props.modelValue,
        disabled: props.disabled,
        onInput: (event: any) => emit('update:modelValue', event.target.value),
      }),
})
const Select = defineComponent({
  props: ['modelValue', 'disabled'],
  emits: ['update:modelValue', 'change'],
  setup:
    (props, { slots, emit }) =>
    () =>
      vnode(
        'select',
        {
          value: props.modelValue,
          disabled: props.disabled,
          onChange: (event: any) => {
            emit('update:modelValue', event.target.value)
            emit('change', event.target.value)
          },
        },
        slots.default?.(),
      ),
})
const TreeSelect = defineComponent({
  props: ['modelValue', 'data'],
  emits: ['update:modelValue', 'change'],
  setup:
    (props, { emit }) =>
    () =>
      vnode(
        'select',
        {
          value: props.modelValue,
          onChange: (event: any) => {
            const value = Number(event.target.value)
            emit('update:modelValue', value)
            emit('change', value)
          },
        },
        (props.data || []).map((row: any) => vnode('option', { value: row.id }, row.deptName)),
      ),
})
const Option = defineComponent({
  props: ['label', 'value'],
  setup: (props) => () => vnode('option', { value: props.value }, String(props.label)),
})
const Tree = defineComponent({
  props: ['data'],
  setup(props, { expose }) {
    const checked = ref<Array<number | string>>([])
    expose({
      setCheckedKeys: (keys: Array<number | string>) => {
        checked.value = [...keys]
      },
      setChecked: (key: number | string, value: boolean) => {
        checked.value = value
          ? [...new Set([...checked.value, key])]
          : checked.value.filter((item) => item !== key)
      },
      getCheckedKeys: () => [...checked.value],
      getHalfCheckedKeys: () => [],
    })
    return () =>
      vnode(
        'div',
        { 'data-checked': checked.value.join(',') },
        (props.data || []).map((row: any) => vnode('span', String(row.id))),
      )
  },
})
const TableColumn = defineComponent({
  props: ['type'],
  setup(props, { slots }) {
    const rows = inject<any>('review-rows')
    return () =>
      props.type === 'selection'
        ? vnode('div', { 'data-column-type': 'selection' })
        : vnode(
            'div',
            (rows?.value || []).flatMap((row: any) => slots.default?.({ row }) || []),
          )
  },
})
const Tooltip = defineComponent({
  props: ['content'],
  setup:
    (props, { slots }) =>
    () =>
      vnode('span', { 'data-tooltip': props.content }, slots.default?.()),
})
const Dialog = defineComponent({
  props: ['modelValue', 'title'],
  emits: ['update:modelValue'],
  setup:
    (props, { slots, emit }) =>
    () =>
      props.modelValue
        ? vnode('section', { 'data-dialog': props.title }, [
            vnode(
              'button',
              { 'data-close-dialog': true, onClick: () => emit('update:modelValue', false) },
              'close',
            ),
            slots.header?.(),
            slots.default?.(),
            slots.footer?.(),
          ])
        : null,
})
const Description = defineComponent({
  props: ['label'],
  setup:
    (props, { slots }) =>
    () =>
      vnode('div', { 'data-description': props.label }, slots.default?.()),
})
const Upload = defineComponent({
  props: ['httpRequest', 'fileList'],
  setup:
    (_, { slots }) =>
    () =>
      vnode('div', slots.default?.()),
})
const stubs = {
  ElButton: Button,
  ElForm: Container,
  ElFormItem: FormItem,
  ElRow: Container,
  ElCol: Container,
  ElInput: Input,
  ElSelect: Select,
  ElOption: Option,
  ElTreeSelect: TreeSelect,
  ElTree: Tree,
  ElRadio: Container,
  ElRadioGroup: Container,
  ElTableColumn: TableColumn,
  ElTooltip: Tooltip,
  ElDialog: Dialog,
  ElTag: Container,
  ElDescriptions: Container,
  ElDescriptionsItem: Description,
  ElInputNumber: Input,
  ElUpload: Upload,
  ElSwitch: Container,
  ElTabs: Container,
  ElTabPane: Container,
}
const permissionDirective = {
  mounted(el: Element, binding: { value: string[] }) {
    const granted = fixture.permissions
    const allowed =
      granted.includes('*:*:*') || binding.value.some((permission) => granted.includes(permission))
    if (!allowed) el.parentNode?.removeChild(el)
  },
}
const wrappers: any[] = []
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))
beforeEach(async () => {
  const { reactive } = await import('vue')
  fixture.route = reactive({ query: { dictType: 'dict_a' } })
  fixture.permissions = []
  fixture.responses.clear()
  fixture.request.mockReset().mockImplementation((config: any) => {
    if (fixture.responses.has(config.url)) return fixture.responses.get(config.url)
    const data = config.url.endsWith('/page') ? { rows: [], total: 0 } : []
    return Promise.resolve({ code: 200, msg: 'review-fixture', data })
  })
  fixture.responses.set(
    '/system/dept/treeList',
    ok([
      { id: 1, deptName: 'A 部门' },
      { id: 2, deptName: 'B 部门' },
    ]),
  )
  fixture.responses.set(
    '/menu/treeList',
    ok([
      { id: 11, menuName: 'A 菜单' },
      { id: 22, menuName: 'B 菜单' },
    ]),
  )
})
function ok(data: any) {
  return Promise.resolve({ code: 200, msg: 'review-fixture', data })
}
function deferred() {
  let resolve!: (value: any) => void
  const promise = new Promise<any>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
async function render(page: any) {
  const wrapper = mount(page, {
    global: { stubs, directives: { permission: {}, 'table-loading': {} } },
  })
  wrappers.push(wrapper)
  await flushPromises()
  return wrapper
}
async function renderWithPermissions(page: any, permissions: string[]) {
  fixture.permissions = permissions
  const wrapper = mount(page, {
    global: { stubs, directives: { permission: permissionDirective, 'table-loading': {} } },
  })
  wrappers.push(wrapper)
  await flushPromises()
  return wrapper
}
function crud(wrapper: any) {
  return wrapper.findComponent({ name: 'ReviewCrudView' }).props('slotProps')
}
function calls(url: string) {
  return fixture.request.mock.calls.map((call) => call[0]).filter((config) => config.url === url)
}

describe('本轮新增：业务请求的遗漏路径', () => {
  it('编辑自定义范围角色时，部门 watcher 不能在菜单仍加载中时放开保存', async () => {
    const menuPending = deferred()
    fixture.responses.set('/system/role/menuIds/1', menuPending.promise)
    fixture.responses.set('/system/role/deptIds/1', ok([1]))
    const wrapper = await render(RolePage)
    crud(wrapper).handleEdit({ id: 1, roleName: 'A', roleCode: 'a', dataScope: '5' })
    await flushPromises()
    await wrapper.get('[data-review-submit]').trigger('click')
    await flushPromises()
    expect(calls('/system/role/modifyById')).toEqual([])
  })

  it('部门树未返回时，自定义数据范围角色不能提交空权限', async () => {
    const deptTreePending = deferred()
    fixture.responses.set('/system/dept/treeList', deptTreePending.promise)
    fixture.responses.set('/system/role/menuIds/1', ok([]))
    fixture.responses.set('/system/role/deptIds/1', ok([1]))
    const wrapper = await render(RolePage)
    crud(wrapper).handleEdit({ id: 1, roleName: 'A', roleCode: 'a', dataScope: '5' })
    await flushPromises()

    expect(wrapper.get('[data-review-submit]').attributes('disabled')).toBeDefined()
    await crud(wrapper).handleSubmit(false)
    expect(calls('/system/role/modifyById')).toEqual([])

    deptTreePending.resolve({ code: 200, data: [{ id: 1, deptName: 'A 部门' }] })
    await flushPromises()
    expect(wrapper.get('[data-review-submit]').attributes('disabled')).toBeUndefined()
    await crud(wrapper).handleSubmit(false)
    expect(calls('/system/role/modifyById')[0].data.deptIds).toEqual([1])
  })

  it('菜单树加载失败时，编辑角色仍保持禁用保存', async () => {
    const fallback = fixture.request.getMockImplementation()!
    fixture.request.mockImplementation((config: any) =>
      config.url === '/menu/treeList'
        ? Promise.reject(new Error('menu tree offline'))
        : fallback(config),
    )
    const wrapper = await render(RolePage)
    crud(wrapper).handleEdit({ id: 1, roleName: 'A', roleCode: 'a', dataScope: '1' })
    await flushPromises()

    expect(wrapper.get('[data-review-submit]').attributes('disabled')).toBeDefined()
    await crud(wrapper).handleSubmit(false)
    expect(calls('/system/role/modifyById')).toEqual([])
  })

  it('菜单树加载失败时，新建角色仍可提交（只有编辑才被拦住）', async () => {
    const fallback = fixture.request.getMockImplementation()!
    fixture.request.mockImplementation((config: any) =>
      config.url === '/menu/treeList'
        ? Promise.reject(new Error('menu tree offline'))
        : fallback(config),
    )
    const wrapper = await render(RolePage)
    crud(wrapper).handleAdd()
    await flushPromises()

    // 新增没有历史权限会被覆盖：菜单树挂了也应允许先把角色建出来
    expect(wrapper.get('[data-review-submit]').attributes('disabled')).toBeUndefined()
    await crud(wrapper).handleSubmit(true)
    expect(calls('/system/role/add')).toHaveLength(1)
  })

  it('同一角色的数据范围快速切换时，旧部门权限响应不能覆盖新回填', async () => {
    const older = deferred()
    const original = fixture.request.getMockImplementation()!
    let deptPermissionCalls = 0
    fixture.request.mockImplementation((config: any) => {
      if (config.url === '/system/role/deptIds/1') {
        deptPermissionCalls++
        return deptPermissionCalls === 1 ? older.promise : ok([2])
      }
      return original(config)
    })
    fixture.responses.set('/system/role/menuIds/1', ok([]))
    const wrapper = await render(RolePage)
    crud(wrapper).handleEdit({ id: 1, roleName: 'A', roleCode: 'a', dataScope: '1' })
    await flushPromises()
    const dataScope = wrapper.get('.review-form [data-prop="dataScope"] select')
    await dataScope.setValue('5')
    await flushPromises()
    await dataScope.setValue('1')
    await flushPromises()
    await dataScope.setValue('5')
    await flushPromises()

    expect(deptPermissionCalls).toBe(2)
    expect(wrapper.get('[data-review-submit]').attributes('disabled')).toBeUndefined()
    older.resolve({ code: 200, data: [1] })
    await flushPromises()
    await crud(wrapper).handleSubmit(false)
    expect(calls('/system/role/modifyById')[0].data.deptIds).toEqual([2])
  })

  it('重新打开同一角色后，上一弹窗的权限响应不能撤销本次手动取消勾选', async () => {
    const oldMenu = deferred()
    const newMenu = deferred()
    fixture.responses.set('/system/role/menuIds/1', oldMenu.promise)
    const wrapper = await render(RolePage)
    wrappers.push(wrapper)
    await flushPromises()
    const row = { id: 1, roleName: 'A', roleCode: 'a', dataScope: '1' }
    crud(wrapper).handleEdit(row)
    await flushPromises()
    crud(wrapper).handleClose()
    await flushPromises()
    fixture.responses.set('/system/role/menuIds/1', newMenu.promise)
    crud(wrapper).handleEdit(row)
    await flushPromises()
    newMenu.resolve({ code: 200, data: [11] })
    await flushPromises()
    const tree = wrapper.findAllComponents(Tree)[0]
    expect(tree.vm.getCheckedKeys()).toEqual([11])
    tree.vm.setChecked(11, false, false)
    expect(tree.vm.getCheckedKeys()).toEqual([])
    oldMenu.resolve({ code: 200, data: [11] })
    await flushPromises()
    await crud(wrapper).handleSubmit(false)
    expect(calls('/system/role/modifyById')[0].data.menuIds).toEqual([])
  })

  it('新增岗位不等部门树就绪即可提交（编辑才需要等）', async () => {
    const deptTreePending = deferred()
    fixture.responses.set('/system/dept/treeList', deptTreePending.promise)
    const wrapper = await render(PostPage)
    crud(wrapper).handleAdd()
    await flushPromises()

    // 新增没有历史部门范围会被覆盖，部门树未就绪也应允许建岗位
    expect(wrapper.get('[data-review-submit]').attributes('disabled')).toBeUndefined()
    await crud(wrapper).handleSubmit(true)
    expect(calls('/system/post/add')[0].data.deptIds).toEqual([])

    deptTreePending.resolve({ code: 200, data: [{ id: 1, deptName: 'A 部门' }] })
    await flushPromises()
  })

  it('岗位编辑在部门树和权限 ID 回填完成前保持禁用，完成后保留原部门', async () => {
    const deptTreePending = deferred()
    fixture.responses.set('/system/dept/treeList', deptTreePending.promise)
    fixture.responses.set('/system/post/deptIds/1', ok([1]))
    const wrapper = await render(PostPage)
    crud(wrapper).handleEdit({ id: 1, postName: 'A', postCode: 'a', status: '0' })
    await flushPromises()

    expect(wrapper.get('[data-review-submit]').attributes('disabled')).toBeDefined()
    await crud(wrapper).handleSubmit(false)
    expect(calls('/system/post/modifyById')).toEqual([])

    deptTreePending.resolve({ code: 200, data: [{ id: 1, deptName: 'A 部门' }] })
    await flushPromises()
    expect(wrapper.get('[data-review-submit]').attributes('disabled')).toBeUndefined()
    await crud(wrapper).handleSubmit(false)
    expect(calls('/system/post/modifyById')[0].data.deptIds).toEqual([1])
  })

  it('岗位部门树加载失败时禁止提交，不覆盖已有部门', async () => {
    const fallback = fixture.request.getMockImplementation()!
    fixture.request.mockImplementation((config: any) =>
      config.url === '/system/dept/treeList'
        ? Promise.reject(new Error('dept tree offline'))
        : fallback(config),
    )
    const wrapper = await render(PostPage)
    crud(wrapper).handleEdit({ id: 1, postName: 'A', postCode: 'a', status: '0' })
    await flushPromises()

    expect(wrapper.get('[data-review-submit]').attributes('disabled')).toBeDefined()
    await crud(wrapper).handleSubmit(false)
    expect(calls('/system/post/modifyById')).toEqual([])
  })

  it('岗位部门权限 ID 加载失败时禁止提交，不覆盖已有部门', async () => {
    const fallback = fixture.request.getMockImplementation()!
    fixture.request.mockImplementation((config: any) =>
      config.url === '/system/post/deptIds/1'
        ? Promise.reject(new Error('dept ids offline'))
        : fallback(config),
    )
    const wrapper = await render(PostPage)
    crud(wrapper).handleEdit({ id: 1, postName: 'A', postCode: 'a', status: '0' })
    await flushPromises()

    expect(wrapper.get('[data-review-submit]').attributes('disabled')).toBeDefined()
    await crud(wrapper).handleSubmit(false)
    expect(calls('/system/post/modifyById')).toEqual([])
  })

  it('重新打开同一岗位后，上一弹窗的部门响应不能撤销本次手动取消勾选', async () => {
    const oldDept = deferred()
    fixture.responses.set('/system/post/deptIds/1', oldDept.promise)
    const wrapper = await render(PostPage)
    wrappers.push(wrapper)
    await flushPromises()
    const row = { id: 1, postName: 'A', postCode: 'a', status: '0' }
    crud(wrapper).handleEdit(row)
    await flushPromises()
    crud(wrapper).handleClose()
    await flushPromises()
    fixture.responses.set('/system/post/deptIds/1', ok([1]))
    crud(wrapper).handleEdit(row)
    await flushPromises()
    const tree = wrapper.findAllComponents(Tree)[0]
    expect(tree.vm.getCheckedKeys()).toEqual([1])
    tree.vm.setChecked(1, false, false)
    expect(tree.vm.getCheckedKeys()).toEqual([])
    oldDept.resolve({ code: 200, data: [1] })
    await flushPromises()
    await crud(wrapper).handleSubmit(false)
    expect(calls('/system/post/modifyById')[0].data.deptIds).toEqual([])
  })

  it('表 B 的预览还没加载时不应继续展示可复制的表 A 代码', async () => {
    const pendingB = deferred()
    fixture.responses.set(
      '/generate/code/page',
      ok({
        rows: [
          { tableName: 'table_a', tableComment: 'A' },
          { tableName: 'table_b', tableComment: 'B' },
        ],
        total: 2,
      }),
    )
    fixture.responses.set(
      '/generate/code?tableName=table_a',
      ok([{ fileName: 'A.java', content: 'class TableA {}' }]),
    )
    fixture.responses.set('/generate/code?tableName=table_b', pendingB.promise)
    const wrapper = await render(GenerateCodePage)
    const previews = wrapper.findAll('[data-tooltip="tool.generateCode.actions.generate"] button')
    await previews[0].trigger('click')
    await flushPromises()
    expect(wrapper.get('.review-code').text()).toContain('TableA')
    await wrapper.get('[data-close-dialog]').trigger('click')
    await previews[1].trigger('click')
    await flushPromises()
    expect(wrapper.text()).not.toContain('class TableA {}')
  })
  it('切换到表 B 的代码预览后，表 A 的迟到响应不应替换 B 代码', async () => {
    const pendingA = deferred()
    fixture.responses.set(
      '/generate/code/page',
      ok({
        rows: [
          { tableName: 'table_a', tableComment: 'A' },
          { tableName: 'table_b', tableComment: 'B' },
        ],
        total: 2,
      }),
    )
    fixture.responses.set('/generate/code?tableName=table_a', pendingA.promise)
    fixture.responses.set(
      '/generate/code?tableName=table_b',
      ok([{ fileName: 'B.java', content: 'class TableB {}' }]),
    )
    const wrapper = await render(GenerateCodePage)
    const previews = wrapper.findAll('[data-tooltip="tool.generateCode.actions.generate"] button')
    expect(previews).toHaveLength(2)
    await previews[0].trigger('click')
    await flushPromises()
    await wrapper.get('[data-close-dialog]').trigger('click')
    await previews[1].trigger('click')
    await flushPromises()
    expect(wrapper.get('.review-code').text()).toContain('TableB')
    pendingA.resolve({ code: 200, data: [{ fileName: 'A.java', content: 'class TableA {}' }] })
    await flushPromises()
    expect(wrapper.get('.review-code').text()).toContain('TableB')
  })
  it('角色 A 自定义部门的迟到回填不应混入角色 B 的保存', async () => {
    const older = deferred()
    fixture.responses.set(
      '/system/role/page',
      ok({
        rows: [
          { id: 1, roleName: 'A', roleCode: 'a', dataScope: '1' },
          { id: 2, roleName: 'B', roleCode: 'b', dataScope: '1' },
        ],
        total: 2,
      }),
    )
    fixture.responses.set('/system/role/deptIds/1', older.promise)
    fixture.responses.set('/system/role/deptIds/2', ok([]))
    const wrapper = await render(RolePage)
    crud(wrapper).handleEdit({ id: 1, roleName: 'A', roleCode: 'a', dataScope: '1' })
    await flushPromises()
    await wrapper.get('.review-form [data-prop="dataScope"] select').setValue('5')
    await flushPromises()
    expect(calls('/system/role/deptIds/1')).toHaveLength(1)
    crud(wrapper).handleClose()
    crud(wrapper).handleEdit({ id: 2, roleName: 'B', roleCode: 'b', dataScope: '1' })
    await flushPromises()
    await wrapper.get('.review-form [data-prop="dataScope"] select').setValue('5')
    await flushPromises()
    older.resolve({ code: 200, data: [1] })
    await flushPromises()
    await crud(wrapper).handleSubmit(false)
    const payload = calls('/system/role/modifyById')[0].data
    expect(payload.id).toBe(2)
    expect(payload.deptIds).toEqual([])
  })

  it('角色原有菜单尚未回填时不应提交空菜单覆盖原权限', async () => {
    const pending = deferred()
    fixture.responses.set('/system/role/menuIds/1', pending.promise)
    const wrapper = await render(RolePage)
    crud(wrapper).handleEdit({ id: 1, roleName: 'A', roleCode: 'a', dataScope: '1' })
    await flushPromises()
    await crud(wrapper)
      .handleSubmit(false)
      .catch(() => undefined)
    expect(calls('/system/role/modifyById')).toEqual([])
  })

  it('自定义部门尚未回填时不能因为菜单先回来就保存空部门权限', async () => {
    const pending = deferred()
    fixture.responses.set('/system/role/menuIds/1', ok([11]))
    fixture.responses.set('/system/role/deptIds/1', pending.promise)
    const wrapper = await render(RolePage)
    crud(wrapper).handleEdit({ id: 1, roleName: 'A', roleCode: 'a', dataScope: '5' })
    await flushPromises()
    await crud(wrapper)
      .handleSubmit(false)
      .catch(() => undefined)
    expect(calls('/system/role/modifyById')).toEqual([])
  })

  it('菜单树选项迟于权限 ID 到达时也应保留角色原有菜单', async () => {
    const treePending = deferred()
    fixture.responses.set('/menu/treeList', treePending.promise)
    fixture.responses.set('/system/role/menuIds/1', ok([11]))
    const actual = await vi.importActual<any>('element-plus')
    const wrapper = mount(RolePage, {
      global: { stubs: { ...stubs, ElTree: actual.ElTree }, directives: { permission: {} } },
    })
    wrappers.push(wrapper)
    await flushPromises()
    crud(wrapper).handleEdit({ id: 1, roleName: 'A', roleCode: 'a', dataScope: '1' })
    await flushPromises()
    treePending.resolve({ code: 200, data: [{ id: 11, menuName: 'A 菜单' }] })
    await flushPromises()
    expect(wrapper.findComponent(actual.ElTree).vm.getNode(11)?.data.id).toBe(11)
    await crud(wrapper)
      .handleSubmit(false)
      .catch(() => undefined)
    expect(calls('/system/role/modifyById')[0].data.menuIds).toEqual([11])
  })

  it('岗位 A 的迟到部门回填不应混入岗位 B 的保存', async () => {
    const older = deferred()
    fixture.responses.set('/system/post/deptIds/1', older.promise)
    fixture.responses.set('/system/post/deptIds/2', ok([2]))
    const wrapper = await render(PostPage)
    crud(wrapper).handleEdit({ id: 1, postName: 'A', postCode: 'a', status: '0' })
    await flushPromises()
    crud(wrapper).handleClose()
    crud(wrapper).handleEdit({ id: 2, postName: 'B', postCode: 'b', status: '0' })
    await flushPromises()
    older.resolve({ code: 200, data: [1] })
    await flushPromises()
    await crud(wrapper).handleSubmit(false)
    const payload = calls('/system/post/modifyById')[0].data
    expect(payload.id).toBe(2)
    expect(payload.deptIds).toEqual([2])
  })

  it('编辑用户的初始岗位请求不应覆盖随后选择的新部门岗位', async () => {
    const older = deferred()
    fixture.responses.set('/system/post/listByDeptId/1', older.promise)
    fixture.responses.set('/system/post/listByDeptId/2', ok([{ id: 22, postName: 'B 岗位' }]))
    const wrapper = await render(UserPage)
    crud(wrapper).handleEdit({ id: 1, username: 'A', deptId: 1, postId: 11 })
    await flushPromises()
    await wrapper.get('.review-form [data-prop="deptId"] select').setValue('2')
    await flushPromises()
    expect(wrapper.get('.review-form [data-prop="postId"] select').text()).toContain('B 岗位')
    older.resolve({ code: 200, data: [{ id: 11, postName: 'A 岗位' }] })
    await flushPromises()
    expect(crud(wrapper).formData.deptId).toBe(2)
    expect(wrapper.get('.review-form [data-prop="postId"] select').text()).toContain('B 岗位')
  })

  it('通知编辑详情加载期间禁止提交，加载成功后保留完整内容', async () => {
    const detailPending = deferred()
    fixture.responses.set('/system/notice/getById/1', detailPending.promise)
    const wrapper = await render(NoticePage)
    crud(wrapper).handleEdit({ id: 1, title: 'A', type: '1', scope: '1' })
    await flushPromises()

    expect(wrapper.get('[data-review-submit]').attributes('disabled')).toBeDefined()
    await crud(wrapper).handleSubmit(false)
    expect(calls('/system/notice/modifyById')).toEqual([])

    detailPending.resolve({
      code: 200,
      data: { id: 1, title: 'A', type: '1', scope: '1', content: '完整通知正文' },
    })
    await flushPromises()
    expect(wrapper.get('[data-review-submit]').attributes('disabled')).toBeUndefined()
    await crud(wrapper).handleSubmit(false)
    expect(calls('/system/notice/modifyById')[0].data.content).toBe('完整通知正文')
  })

  it('通知部门范围树尚未加载和回填时禁止提交', async () => {
    const deptTreePending = deferred()
    fixture.responses.set('/system/dept/treeList', deptTreePending.promise)
    fixture.responses.set(
      '/system/notice/getById/1',
      ok({
        id: 1,
        title: 'A',
        type: '1',
        scope: '2',
        content: '正文',
        scopeDeptIds: '1',
      }),
    )
    const wrapper = await render(NoticePage)
    crud(wrapper).handleEdit({ id: 1, title: 'A', type: '1', scope: '2' })
    await flushPromises()

    expect(wrapper.get('[data-review-submit]').attributes('disabled')).toBeDefined()
    await crud(wrapper).handleSubmit(false)
    expect(calls('/system/notice/modifyById')).toEqual([])

    deptTreePending.resolve({ code: 200, data: [{ id: 1, deptName: 'A 部门' }] })
    await flushPromises()
    expect(wrapper.get('[data-review-submit]').attributes('disabled')).toBeUndefined()
    await crud(wrapper).handleSubmit(false)
    expect(calls('/system/notice/modifyById')[0].data.scopeDeptIds).toEqual([1])
  })

  it('通知详情加载失败时禁止提交，并接住失败结果', async () => {
    const fallback = fixture.request.getMockImplementation()!
    fixture.request.mockImplementation((config: any) =>
      config.url === '/system/notice/getById/1'
        ? Promise.reject(new Error('notice details offline'))
        : fallback(config),
    )
    const wrapper = await render(NoticePage)
    crud(wrapper).handleEdit({ id: 1, title: 'A', type: '1', scope: '1' })
    await flushPromises()

    expect(wrapper.get('[data-review-submit]').attributes('disabled')).toBeDefined()
    await crud(wrapper).handleSubmit(false)
    expect(calls('/system/notice/modifyById')).toEqual([])
  })

  it('通知详情失败后切换发布范围仍不能绕过提交保护', async () => {
    const fallback = fixture.request.getMockImplementation()!
    fixture.request.mockImplementation((config: any) =>
      config.url === '/system/notice/getById/1'
        ? Promise.reject(new Error('notice details offline'))
        : fallback(config),
    )
    const wrapper = await render(NoticePage)
    crud(wrapper).handleEdit({ id: 1, title: 'A', type: '1', scope: '2' })
    await flushPromises()

    crud(wrapper).formData.scope = '1'
    await flushPromises()
    expect(wrapper.get('[data-review-submit]').attributes('disabled')).toBeDefined()
    await crud(wrapper).handleSubmit(false)
    expect(calls('/system/notice/modifyById')).toEqual([])
  })

  it('通知 A 的迟到详情不应把 A 的部门接收范围勾进通知 B', async () => {
    const older = deferred()
    fixture.responses.set('/system/notice/getById/1', older.promise)
    fixture.responses.set(
      '/system/notice/getById/2',
      ok({ id: 2, title: 'B', type: '1', scope: '2', content: 'B 内容', scopeDeptIds: '2' }),
    )
    const wrapper = await render(NoticePage)
    crud(wrapper).handleEdit({ id: 1, title: 'A', type: '1', scope: '2' })
    await flushPromises()
    crud(wrapper).handleClose()
    crud(wrapper).handleEdit({ id: 2, title: 'B', type: '1', scope: '2' })
    await flushPromises()
    older.resolve({
      code: 200,
      data: { id: 1, title: 'A', type: '1', scope: '2', content: 'A 内容', scopeDeptIds: '1' },
    })
    await flushPromises()
    await crud(wrapper).handleSubmit(false)
    const payload = calls('/system/notice/modifyById')[0].data
    expect(payload.id).toBe(2)
    expect(payload.scopeDeptIds).toEqual([2])
  })

  it('消息中心的通知类型也应显示字典文案', async () => {
    fixture.responses.set(
      '/system/notice-user/myPage',
      ok({ rows: [{ id: 1, noticeId: 1, title: '通知', type: '1', readStatus: '0' }], total: 1 }),
    )
    const wrapper = await render(NoticeUserPage)
    expect(wrapper.get('.review-cell-type').text()).toBe('通知')
  })

  it('流程定义状态应显示字典文案', async () => {
    fixture.responses.set(
      '/workflow/definition/page',
      ok({ rows: [{ id: '1', key: 'a', name: 'A', status: 'ACTIVE', version: 1 }], total: 1 }),
    )
    const wrapper = await render(DefinitionPage)
    expect(wrapper.get('.review-cell-status').text()).toBe('运行中')
  })

  it('A 流程版本的迟到响应不应让 B 的版本弹窗操作 A', async () => {
    const older = deferred()
    fixture.responses.set(
      '/workflow/definition/page',
      ok({
        rows: [
          { id: '1', key: 'a', name: 'A', status: 'ACTIVE', version: 1 },
          { id: '2', key: 'b', name: 'B', status: 'ACTIVE', version: 1 },
        ],
        total: 2,
      }),
    )
    const defaultRequest = fixture.request.getMockImplementation()!
    fixture.request.mockImplementation((config: any) => {
      if (config.url === '/workflow/definition/versions') {
        return config.params.key === 'a'
          ? older.promise
          : ok([
              {
                processDefinitionId: 'definition-b',
                key: 'b',
                name: 'B version',
                version: 1,
                status: 'ACTIVE',
              },
            ])
      }
      return defaultRequest(config)
    })
    const wrapper = await render(DefinitionPage)
    const versionButtons = wrapper.findAll(
      '[data-tooltip="bpm.definition.actions.versions"] button',
    )
    expect(versionButtons).toHaveLength(2)
    await versionButtons[0].trigger('click')
    await flushPromises()
    await wrapper.get('[data-close-dialog]').trigger('click')
    await versionButtons[1].trigger('click')
    await flushPromises()
    expect(wrapper.get('.version-dialog-header h2').text()).toBe('B')
    expect(wrapper.get('.version-title').text()).toContain('B version')
    older.resolve({
      code: 200,
      data: [
        {
          processDefinitionId: 'definition-a',
          key: 'a',
          name: 'A version',
          version: 1,
          status: 'ACTIVE',
        },
      ],
    })
    await flushPromises()
    await wrapper.get('.version-card button').trigger('click')
    await flushPromises()
    expect(calls('/workflow/definition/suspend')[0].params.processDefinitionId).toBe('definition-b')
  })
})

describe('继续评估：业务 Interface 的行为复现', () => {
  it('角色 B 的保存不应混入角色 A 的迟到权限回填', async () => {
    const older = deferred()
    fixture.responses.set(
      '/system/role/page',
      ok({
        rows: [
          { id: 1, roleName: 'A', roleCode: 'a', dataScope: '1' },
          { id: 2, roleName: 'B', roleCode: 'b', dataScope: '1' },
        ],
        total: 2,
      }),
    )
    fixture.responses.set('/system/role/menuIds/1', older.promise)
    fixture.responses.set('/system/role/menuIds/2', ok([]))
    const wrapper = await render(RolePage)
    await wrapper.get('[data-edit-id="1"]').trigger('click')
    await flushPromises()
    crud(wrapper).handleClose()
    await flushPromises()
    await wrapper.get('[data-edit-id="2"]').trigger('click')
    await flushPromises()
    older.resolve({ code: 200, data: [11] })
    await flushPromises()
    await crud(wrapper).handleSubmit(false)
    const payload = calls('/system/role/modifyById')[0].data
    expect(payload.id).toBe(2)
    expect(payload.menuIds).toEqual([])
  })

  it('当前选择 B 部门时不应显示迟到的 A 部门岗位', async () => {
    const older = deferred()
    const latest = deferred()
    fixture.responses.set('/system/post/listByDeptId/1', older.promise)
    fixture.responses.set('/system/post/listByDeptId/2', latest.promise)
    const wrapper = await render(UserPage)
    crud(wrapper).handleAdd()
    await flushPromises()
    const department = wrapper.get('.review-form [data-prop="deptId"] select')
    await department.setValue('1')
    await department.setValue('2')
    latest.resolve({ code: 200, data: [{ id: 22, postName: 'B 岗位' }] })
    await flushPromises()
    older.resolve({ code: 200, data: [{ id: 11, postName: 'A 岗位' }] })
    await flushPromises()
    expect(crud(wrapper).formData.deptId).toBe(2)
    expect(wrapper.get('.review-form [data-prop="postId"] select').text()).toContain('B 岗位')
  })

  it('授权应用图标应持久化 objectKey，供 OSS 路径渲染', async () => {
    fixture.responses.set(
      '/file/upload',
      ok({
        fileId: 'synthetic-file-id',
        objectKey: 'assets/review-icon.svg',
        previewUrl: 'https://review.invalid/temporary',
      }),
    )
    const wrapper = await render(AuthClientPage)
    crud(wrapper).handleAdd()
    await flushPromises()
    const upload = wrapper.findComponent(Upload).props('httpRequest')
    await upload({ file: new File(['review'], 'icon.svg'), onSuccess: vi.fn(), onError: vi.fn() })
    expect(crud(wrapper).formData.icon).toBe('assets/review-icon.svg')
  })

  it('A 弹窗的迟到图标上传不应覆盖 B 弹窗的图标', async () => {
    const pending = deferred()
    fixture.responses.set('/file/upload', pending.promise)
    const wrapper = await render(AuthClientPage)
    crud(wrapper).handleAdd()
    await flushPromises()
    const upload = wrapper.findComponent(Upload).props('httpRequest')
    const request = upload({
      file: new File(['review'], 'icon.svg'),
      onSuccess: vi.fn(),
      onError: vi.fn(),
    })
    crud(wrapper).handleClose()
    crud(wrapper).handleEdit({ id: 2, icon: 'existing/b.svg' })
    await flushPromises()
    pending.resolve({ code: 200, data: { fileId: 'a-file-id', objectKey: 'assets/a.svg' } })
    await request
    expect(crud(wrapper).formData.id).toBe(2)
    expect(crud(wrapper).formData.icon).toBe('existing/b.svg')
  })

  it('同一路径切换到字典 B 后，查询和新增默认值应指向 B', async () => {
    const wrapper = await render(DictDataPage)
    fixture.route.query = { dictType: 'dict_b' }
    await flushPromises()
    crud(wrapper).handleAdd()
    await flushPromises()
    expect(crud(wrapper).formData.dictType).toBe('dict_b')
    expect(crud(wrapper).searchData.dictType).toBe('dict_b')
  })

  it('通知类型单元格应显示文案而非编码', async () => {
    fixture.responses.set(
      '/system/notice/page',
      ok({ rows: [{ id: 1, title: '测试通知', type: '1', status: '1' }], total: 1 }),
    )
    const wrapper = await render(NoticePage)
    expect(wrapper.get('.review-cell-type').text()).toBe('通知')
  })

  it('查看通知详情应取得列表省略的完整正文', async () => {
    fixture.responses.set(
      '/system/notice/page',
      ok({ rows: [{ id: 1, title: '测试通知', type: '1', status: '1' }], total: 1 }),
    )
    fixture.responses.set(
      '/system/notice/getById/1',
      ok({ id: 1, title: '测试通知', content: '完整通知正文', type: '1', status: '1' }),
    )
    const wrapper = await render(NoticePage)
    await wrapper.get('[data-tooltip="system.notice.dialogs.detail"] button').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-description="system.notice.form.content"]').text()).toContain(
      '完整通知正文',
    )
  })

  it.each([
    { label: '明确删除权限', permissions: ['system:user:delete'], allowed: true },
    { label: '通配权限', permissions: ['*:*:*'], allowed: true },
    { label: '只有新增权限', permissions: ['system:user:add'], allowed: false },
  ])('用户列表的批量删除入口和选择列遵循权限：$label', async ({ permissions, allowed }) => {
    const wrapper = await renderWithPermissions(UserPage, permissions)
    const batchDeleteButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('common.batchDelete'))

    expect(Boolean(batchDeleteButton)).toBe(allowed)
    expect(wrapper.find('[data-column-type="selection"]').exists()).toBe(allowed)
  })

  it.skip('密码重置的请求 URL 不应包含新密码', async () => {
    const syntheticPassword = 'review-only-password'
    await resetPassword(7, syntheticPassword)
    const config = calls('/system/user/resetPassword/7')[0]
    expect(axios.getUri(config)).not.toContain(syntheticPassword)
  })
})
