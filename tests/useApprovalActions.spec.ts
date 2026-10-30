import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * useApprovalActions 的接口测试。
 *
 * 全部通过注入的假 api 驱动，不 mock HTTP。
 * 关注四件事：前置校验、在途状态、成功回调、失败不抛错。
 */

const warning = vi.fn()
const success = vi.fn()

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus')
  return {
    ...actual,
    ElMessage: { warning: (...a: any[]) => warning(...a), success: (...a: any[]) => success(...a) },
  }
})

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

// 模块默认会 import 真实 api，这里整体打桩避免加载 request 链
vi.mock('@/views/approval/apis', () => ({
  approveTask: vi.fn(),
  rejectTask: vi.fn(),
  delegateTask: vi.fn(),
  cancelProcess: vi.fn(),
}))

import { useApprovalActions } from '@/views/approval/composables/useApprovalActions'

function makeApis() {
  return {
    approve: vi.fn(async () => ({ code: 200 })),
    reject: vi.fn(async () => ({ code: 200 })),
    delegate: vi.fn(async () => ({ code: 200 })),
    cancel: vi.fn(async () => ({ code: 200 })),
  }
}

describe('useApprovalActions', () => {
  beforeEach(() => {
    warning.mockClear()
    success.mockClear()
  })

  it('approve 成功：返回 true、提示成功、触发 onSuccess', async () => {
    const apis = makeApis()
    const onSuccess = vi.fn()
    const { approve, submitting } = useApprovalActions({ apis, onSuccess })

    const ok = await approve({ taskId: 't1', comment: '同意' })

    expect(ok).toBe(true)
    expect(apis.approve).toHaveBeenCalledWith({ taskId: 't1', comment: '同意' })
    expect(success).toHaveBeenCalledWith('common.messages.operationSuccess')
    expect(onSuccess).toHaveBeenCalledWith('approve')
    expect(submitting.value).toBe(false)
  })

  it('approve 失败：返回 false、不触发 onSuccess、状态复位', async () => {
    const apis = makeApis()
    apis.approve.mockRejectedValueOnce(new Error('boom'))
    const onSuccess = vi.fn()
    const { approve, submitting, pendingAction } = useApprovalActions({ apis, onSuccess })

    const ok = await approve({ taskId: 't1' })

    expect(ok).toBe(false)
    expect(onSuccess).not.toHaveBeenCalled()
    expect(submitting.value).toBe(false)
    expect(pendingAction.value).toBeNull()
  })

  it('缺少 taskId 时拦在本地，不发请求', async () => {
    const apis = makeApis()
    const { approve } = useApprovalActions({ apis })

    const ok = await approve({ taskId: '' })

    expect(ok).toBe(false)
    expect(apis.approve).not.toHaveBeenCalled()
    expect(warning).toHaveBeenCalledWith('bpm.approval.messages.missingTask')
  })

  it('reject 缺少目标节点时拦在本地', async () => {
    const apis = makeApis()
    const { reject } = useApprovalActions({ apis })

    const ok = await reject({ taskId: 't1', targetActivityId: '' })

    expect(ok).toBe(false)
    expect(apis.reject).not.toHaveBeenCalled()
    expect(warning).toHaveBeenCalledWith('bpm.approval.messages.selectTargetNode')
  })

  it('delegate 缺少目标用户时拦在本地', async () => {
    const apis = makeApis()
    const { delegate } = useApprovalActions({ apis })

    const ok = await delegate({ taskId: 't1', targetUserId: '' })

    expect(ok).toBe(false)
    expect(apis.delegate).not.toHaveBeenCalled()
    expect(warning).toHaveBeenCalledWith('bpm.approval.messages.inputTargetUser')
  })

  it('提交中重复调用不会重复发请求', async () => {
    const apis = makeApis()
    let release!: () => void
    apis.approve.mockImplementationOnce(
      () => new Promise<void>((resolve) => { release = () => resolve() }),
    )
    const { approve, submitting, pendingAction } = useApprovalActions({ apis })

    const first = approve({ taskId: 't1' })
    expect(submitting.value).toBe(true)
    expect(pendingAction.value).toBe('approve')

    const second = await approve({ taskId: 't1' })
    expect(second).toBe(false)

    release()
    await expect(first).resolves.toBe(true)
    expect(apis.approve).toHaveBeenCalledTimes(1)
  })

  it('cancel 透传流程实例与原因', async () => {
    const apis = makeApis()
    const { cancel } = useApprovalActions({ apis })

    const ok = await cancel({ processInstanceId: 'p1', reason: '不需要了' })

    expect(ok).toBe(true)
    expect(apis.cancel).toHaveBeenCalledWith({ processInstanceId: 'p1', reason: '不需要了' })
  })

  it('pendingAction 能区分当前动作（供按钮单独转圈）', async () => {
    const apis = makeApis()
    const seen: string[] = []
    apis.reject.mockImplementationOnce(async () => {
      seen.push('reject')
      return { code: 200 }
    })
    const { reject } = useApprovalActions({ apis })

    await reject({ taskId: 't1', targetActivityId: 'node2' })

    expect(seen).toEqual(['reject'])
    expect(apis.reject).toHaveBeenCalledWith({ taskId: 't1', targetActivityId: 'node2' })
  })
})
