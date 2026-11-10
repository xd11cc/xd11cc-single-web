import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import type { ResponseVO } from 'types/api'

/**
 * 三个已修复缺陷的回归用例。
 *
 * 这三条最初是先写用例确认问题存在（当时全部失败），再改实现让其转绿：
 *   1. 角色「数据权限」的 label / value 写反，导致显示编码、提交翻译文案、
 *      且 `=== '5'` 的自定义分支永不命中；
 *   2. 列表提交缺少会话校验，旧响应会把用户新打开的弹窗关掉；
 *   3. handleAddChild 忽略 childForm，菜单「新增子级」的默认类型不对。
 *
 * 第 1 条在 SFC 内部、不便单测，改由浏览器验收覆盖（见交付说明）。
 */

const confirmMock = vi.fn(() => Promise.resolve())

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus')
  return {
    ...actual,
    ElMessage: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
    ElMessageBox: { confirm: (...args: unknown[]) => confirmMock(...args) },
  }
})

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key, locale: { value: 'zh-CN' } }),
}))

import { useCrud } from '@/common/composables/useCrud'
import { useTreeCrud } from '@/common/composables/useTreeCrud'

interface Row {
  id: number
  name: string
}

function deferred<Value>() {
  let resolve!: (value: Value) => void
  const promise = new Promise<Value>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

function withSetup<T>(fn: () => T) {
  let result!: T
  const wrapper = mount(
    defineComponent({
      setup() {
        result = fn()
        return () => null
      },
    }),
  )
  return { result, wrapper }
}

const pageApi = async () => ({
  code: 200,
  msg: 'ok',
  data: { rows: [{ id: 1, name: 'a' }], total: 1 },
})

describe('缺陷 2：列表提交缺少会话校验', () => {
  it('提交进行中关闭并打开另一个弹窗，旧响应不应关掉新弹窗', async () => {
    const addResult = deferred<ResponseVO<unknown>>()
    const addApi = vi.fn(() => addResult.promise)
    const { result: crud, wrapper } = withSetup(() =>
      useCrud<Record<string, unknown>, Row>({ pageApi, addApi }),
    )
    await flushPromises()

    // 打开新增弹窗并提交（请求挂起）
    crud.slotProps.handleAdd()
    expect(crud.slotProps.dialogVisible).toBe(true)
    const submitting = crud.slotProps.handleSubmit(true)

    // 请求还没回来，用户关掉弹窗，又打开另一行的编辑弹窗
    crud.slotProps.handleClose()
    crud.slotProps.handleEdit({ id: 9, name: 'other' })
    expect(crud.slotProps.dialogVisible, '新弹窗已打开').toBe(true)

    // 旧请求现在返回
    addResult.resolve({ code: 200, msg: 'ok', data: null })
    await submitting
    await flushPromises()

    // 期望：新弹窗不受旧请求影响
    expect(crud.slotProps.dialogVisible, '旧响应把新弹窗关掉了').toBe(true)
    wrapper.unmount()
  })
})

describe('缺陷 3：handleAddChild 忽略 childForm', () => {
  it('新增子级时应使用 childForm 给出的初始值', async () => {
    const { result: crud, wrapper } = withSetup(() =>
      useTreeCrud<Record<string, unknown>, Row & { menuType?: string }>({
        treeApi: async () => ({ code: 200, msg: 'ok', data: [] }),
        defaultForm: () => ({ menuType: 'M', visible: '0' }),
        // 业务配置：父级是目录(M)时，子级默认新增菜单(C)；否则默认按钮(B)
        childForm: (parent) => ({ menuType: parent?.menuType === 'M' ? 'C' : 'B' }),
      }),
    )
    await flushPromises()

    crud.slotProps.handleAddChild({ id: 1, name: 'dir', menuType: 'M' })

    expect(crud.slotProps.formData.menuType, '未应用 childForm，仍是 defaultForm 的 M').toBe('C')
    expect(crud.slotProps.formData.parentId, 'parentId 仍应写入').toBe(1)
    wrapper.unmount()
  })

  it('没有配置 childForm 时回退到 defaultForm（部门页等不受影响）', async () => {
    const { result: crud, wrapper } = withSetup(() =>
      useTreeCrud<Record<string, unknown>, Row>({
        treeApi: async () => ({ code: 200, msg: 'ok', data: [] }),
        defaultForm: () => ({ name: 'default' }),
      }),
    )
    await flushPromises()

    crud.slotProps.handleAddChild({ id: 7, name: 'parent' })

    expect(crud.slotProps.formData.name).toBe('default')
    expect(crud.slotProps.formData.parentId).toBe(7)
    wrapper.unmount()
  })
})
