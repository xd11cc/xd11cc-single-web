import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * useApprovalDetail 的接口测试（读模型）。
 *
 * 抽屉里「拉详情 + 拉可退回节点 + 推导当前任务」这段逻辑，通过注入的假 api 验证，
 * 不 mock HTTP。重点是可退回节点的懒加载与复用，以及失败时的状态复位。
 */

vi.mock('@/views/approval/apis', () => ({
  getProcessDetail: vi.fn(),
  getRejectableNodes: vi.fn(),
}))

import { canCancelInstance, useApprovalDetail } from '@/views/approval/composables/useApprovalDetail'

function makeApis() {
  return {
    getDetail: vi.fn(async () => ({ code: 200, msg: 'ok', data: { processInstanceId: 'p1', title: '请假', status: '0' } })),
    getRejectableNodes: vi.fn(async () => ({
      code: 200,
      msg: 'ok',
      data: [{ activityId: 'node1', activityName: '发起' }],
    })),
  }
}

describe('useApprovalDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('load 拉取详情并写入 detail，结束后 loading 复位', async () => {
    const apis = makeApis()
    const { load, detail, loading } = useApprovalDetail(() => 'p1', { apis })

    const promise = load()
    expect(loading.value).toBe(true)
    await promise

    expect(apis.getDetail).toHaveBeenCalledWith('p1')
    expect(detail.value.title).toBe('请假')
    expect(loading.value).toBe(false)
  })

  it('没有流程实例 ID 时不发请求', async () => {
    const apis = makeApis()
    const { load, loading } = useApprovalDetail(() => '', { apis })

    await load()

    expect(apis.getDetail).not.toHaveBeenCalled()
    expect(loading.value).toBe(false)
  })

  it('详情请求失败时 loading 复位且不抛错', async () => {
    const apis = makeApis()
    apis.getDetail.mockRejectedValueOnce(new Error('boom'))
    const { load, loading, detail } = useApprovalDetail(() => 'p1', { apis })

    await expect(load()).resolves.toBeUndefined()

    expect(loading.value).toBe(false)
    expect(detail.value).toEqual({})
  })

  it('currentTasks / taskHistory 由 detail 派生', async () => {
    const apis = makeApis()
    apis.getDetail.mockResolvedValueOnce({
      code: 200,
      msg: 'ok',
      data: {
        processInstanceId: 'p1',
        taskHistory: [{ taskId: 'h1', taskName: '已办' }],
        currentTasks: [{ taskId: 'c1', taskName: '待办' }],
      },
    })
    const { load, currentTasks, taskHistory, hasPendingTask } = useApprovalDetail(() => 'p1', { apis })

    await load()

    expect(taskHistory.value.map((t: any) => t.taskId)).toEqual(['h1'])
    expect(currentTasks.value.map((t: any) => t.taskId)).toEqual(['c1'])
    expect(hasPendingTask.value).toBe(true)
  })

  it('loadRejectableNodes 拉取并缓存', async () => {
    const apis = makeApis()
    const { loadRejectableNodes, rejectableNodes, nodeLoading } = useApprovalDetail(() => 'p1', { apis })

    const promise = loadRejectableNodes('t1')
    expect(nodeLoading.value).toBe(true)
    const nodes = await promise

    expect(apis.getRejectableNodes).toHaveBeenCalledWith('t1')
    expect(nodes).toHaveLength(1)
    expect(rejectableNodes.value).toHaveLength(1)
    expect(nodeLoading.value).toBe(false)
  })

  it('已加载过可退回节点时复用缓存，不重复请求', async () => {
    const apis = makeApis()
    const { loadRejectableNodes } = useApprovalDetail(() => 'p1', { apis })

    await loadRejectableNodes('t1')
    await loadRejectableNodes('t1')

    expect(apis.getRejectableNodes).toHaveBeenCalledTimes(1)
  })

  it('可退回节点请求失败时 nodeLoading 复位', async () => {
    const apis = makeApis()
    apis.getRejectableNodes.mockRejectedValueOnce(new Error('boom'))
    const { loadRejectableNodes, nodeLoading, rejectableNodes } = useApprovalDetail(() => 'p1', { apis })

    const nodes = await loadRejectableNodes('t1')

    expect(nodes).toEqual([])
    expect(nodeLoading.value).toBe(false)
    expect(rejectableNodes.value).toEqual([])
  })

  it('reset 清空详情与节点缓存', async () => {
    const apis = makeApis()
    const { load, loadRejectableNodes, reset, detail, rejectableNodes } = useApprovalDetail(() => 'p1', { apis })

    await load()
    await loadRejectableNodes('t1')
    reset()

    expect(detail.value).toEqual({})
    expect(rejectableNodes.value).toEqual([])
  })

  it('canCancelInstance 只允许「进行中 / 已驳回」', () => {
    expect(canCancelInstance('0')).toBe(true)
    expect(canCancelInstance('3')).toBe(true)
    expect(canCancelInstance('1')).toBe(false)
    expect(canCancelInstance('2')).toBe(false)
    expect(canCancelInstance(undefined)).toBe(false)
  })
})
