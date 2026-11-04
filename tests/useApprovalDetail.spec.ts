import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'
import type { ApprovalDetailApis } from '@/views/approval/composables/useApprovalDetail'

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

import {
  canCancelInstance,
  useApprovalDetail as createApprovalDetail,
} from '@/views/approval/composables/useApprovalDetail'

const scopes: ReturnType<typeof effectScope>[] = []

function useApprovalDetail(...parameters: Parameters<typeof createApprovalDetail>) {
  const scope = effectScope()
  scopes.push(scope)
  return scope.run(() => createApprovalDetail(...parameters))!
}

afterEach(() => {
  scopes.splice(0).forEach((scope) => scope.stop())
})

function deferred<Value>() {
  let resolve!: (value: Value) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<Value>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

type DetailResponse = Awaited<ReturnType<ApprovalDetailApis['getDetail']>>
type NodeResponse = Awaited<ReturnType<ApprovalDetailApis['getRejectableNodes']>>

function pendingDetails() {
  const older = deferred<DetailResponse>()
  const latest = deferred<DetailResponse>()
  const getDetail = vi
    .fn<ApprovalDetailApis['getDetail']>()
    .mockReturnValueOnce(older.promise)
    .mockReturnValueOnce(latest.promise)
  const instanceId = ref('p1')
  const model = useApprovalDetail(() => instanceId.value, { apis: { getDetail } })
  const olderLoad = model.load()
  return { older, latest, instanceId, model, olderLoad }
}

function makeApis() {
  return {
    getDetail: vi.fn(async () => ({
      code: 200,
      msg: 'ok',
      data: { processInstanceId: 'p1', title: '请假', status: '0' },
    })),
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
    const { load, currentTasks, taskHistory, hasPendingTask } = useApprovalDetail(() => 'p1', {
      apis,
    })

    await load()

    expect(taskHistory.value.map((t: any) => t.taskId)).toEqual(['h1'])
    expect(currentTasks.value.map((t: any) => t.taskId)).toEqual(['c1'])
    expect(hasPendingTask.value).toBe(true)
  })

  it('loadRejectableNodes 拉取并缓存', async () => {
    const apis = makeApis()
    const { loadRejectableNodes, rejectableNodes, nodeLoading } = useApprovalDetail(() => 'p1', {
      apis,
    })

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
    const { loadRejectableNodes, nodeLoading, rejectableNodes } = useApprovalDetail(() => 'p1', {
      apis,
    })

    const nodes = await loadRejectableNodes('t1')

    expect(nodes).toEqual([])
    expect(nodeLoading.value).toBe(false)
    expect(rejectableNodes.value).toEqual([])
  })

  it('reset 清空详情与节点缓存', async () => {
    const apis = makeApis()
    const { load, loadRejectableNodes, reset, detail, rejectableNodes } = useApprovalDetail(
      () => 'p1',
      { apis },
    )

    await load()
    await loadRejectableNodes('t1')
    reset()

    expect(detail.value).toEqual({})
    expect(rejectableNodes.value).toEqual([])
  })

  it('详情乱序返回只接纳当前实例的最新结果', async () => {
    const { older, latest, instanceId, model, olderLoad } = pendingDetails()
    instanceId.value = 'p2'
    const latestLoad = model.load()
    latest.resolve({ data: { processInstanceId: 'p2', title: '最新详情' } })
    await latestLoad
    older.resolve({ data: { processInstanceId: 'p1', title: '旧详情' } })
    await olderLoad

    expect(model.detail.value.title).toBe('最新详情')
    expect(model.detailReady.value).toBe(true)
    expect(model.loadError.value).toBe(false)
    expect(model.loading.value).toBe(false)
  })

  it('reset 后重新加载同一实例，旧请求仍然失效', async () => {
    const { older, latest, model, olderLoad } = pendingDetails()
    model.reset()
    const latestLoad = model.load()
    latest.resolve({ data: { processInstanceId: 'p1', title: '重新打开' } })
    await latestLoad
    older.resolve({ data: { processInstanceId: 'p1', title: '关闭前的详情' } })
    await olderLoad

    expect(model.detail.value.title).toBe('重新打开')
  })

  it.each(['success', 'failure'] as const)(
    '旧详情请求 %s 不能影响最新请求的 loading 或错误态',
    async (outcome) => {
      const { older, latest, model, olderLoad } = pendingDetails()
      const latestLoad = model.load()
      if (outcome === 'success') {
        older.resolve({ data: { processInstanceId: 'p1', title: '旧详情' } })
      } else {
        older.reject(new Error('older request failed'))
      }
      await olderLoad
      expect(model.loading.value).toBe(true)
      expect(model.detail.value).toEqual({})
      expect(model.loadError.value).toBe(false)
      latest.resolve({ data: { processInstanceId: 'p1' } })
      await latestLoad
    },
  )

  it('旧详情失败不能覆盖新的成功状态', async () => {
    const { older, latest, model, olderLoad } = pendingDetails()
    const latestLoad = model.load()
    latest.resolve({ data: { processInstanceId: 'p1' } })
    await latestLoad
    older.reject(new Error('older request failed'))
    await olderLoad
    expect(model.detailReady.value).toBe(true)
    expect(model.loadError.value).toBe(false)
  })

  it('最新详情失败后不接受旧请求回填', async () => {
    const { older, latest, model, olderLoad } = pendingDetails()
    const latestLoad = model.load()
    latest.reject(new Error('latest request failed'))
    await latestLoad
    older.resolve({ data: { processInstanceId: 'p1' } })
    await olderLoad
    expect(model.detail.value).toEqual({})
    expect(model.detailReady.value).toBe(false)
    expect(model.loadError.value).toBe(true)
  })

  it.each([undefined, { processInstanceId: 'other' }])(
    '不接受缺失或实例不匹配的详情：%j',
    async (data) => {
      const model = useApprovalDetail(() => 'p1', {
        apis: { getDetail: async () => ({ data }) },
      })
      await model.load()
      expect(model.detail.value).toEqual({})
      expect(model.detailReady.value).toBe(false)
      expect(model.loadError.value).toBe(true)
    },
  )

  it('实例 ID 清空时清理详情和节点缓存', async () => {
    const instanceId = ref('p1')
    const model = useApprovalDetail(() => instanceId.value, { apis: makeApis() })
    await model.load()
    await model.loadRejectableNodes('t1')
    instanceId.value = ''
    await model.load()
    expect(model.detail.value).toEqual({})
    expect(model.rejectableNodes.value).toEqual([])
    expect(model.detailReady.value).toBe(false)
  })

  it('详情和节点并行加载时互不使请求失效', async () => {
    const detailResponse = deferred<DetailResponse>()
    const nodeResponse = deferred<NodeResponse>()
    const model = useApprovalDetail(() => 'p1', {
      apis: {
        getDetail: () => detailResponse.promise,
        getRejectableNodes: () => nodeResponse.promise,
      },
    })
    const detailLoad = model.load()
    const nodeLoad = model.loadRejectableNodes('t1')
    nodeResponse.resolve({ data: [{ activityId: 'node1' }] })
    await nodeLoad
    expect(model.loading.value).toBe(true)
    expect(model.areNodesReady('t1')).toBe(true)
    detailResponse.resolve({ data: { processInstanceId: 'p1' } })
    await detailLoad
    expect(model.detailReady.value).toBe(true)
    expect(model.areNodesReady('t1')).toBe(true)
  })

  it('reset 立即复位 loading，且两个通道的在途响应都不能回填', async () => {
    const detailResponse = deferred<DetailResponse>()
    const nodeResponse = deferred<NodeResponse>()
    const model = useApprovalDetail(() => 'p1', {
      apis: {
        getDetail: () => detailResponse.promise,
        getRejectableNodes: () => nodeResponse.promise,
      },
    })
    const detailLoad = model.load()
    const nodeLoad = model.loadRejectableNodes('t1')
    model.reset()
    expect(model.loading.value).toBe(false)
    expect(model.nodeLoading.value).toBe(false)
    detailResponse.resolve({ data: { processInstanceId: 'p1' } })
    nodeResponse.resolve({ data: [{ activityId: 'node1' }] })
    await detailLoad
    await expect(nodeLoad).resolves.toEqual([])
    expect(model.detail.value).toEqual({})
    expect(model.rejectableNodes.value).toEqual([])
    expect(model.areNodesReady('t1')).toBe(false)
  })

  it.each(['success', 'failure'] as const)(
    '旧任务节点请求 %s 不能覆盖新任务节点',
    async (outcome) => {
      const older = deferred<NodeResponse>()
      const latest = deferred<NodeResponse>()
      const getRejectableNodes = vi
        .fn<ApprovalDetailApis['getRejectableNodes']>()
        .mockReturnValueOnce(older.promise)
        .mockReturnValueOnce(latest.promise)
      const model = useApprovalDetail(() => 'p1', { apis: { getRejectableNodes } })
      const olderLoad = model.loadRejectableNodes('t1')
      const latestLoad = model.loadRejectableNodes('t2')
      latest.resolve({ data: [{ activityId: 'node2' }] })
      await latestLoad
      if (outcome === 'success') older.resolve({ data: [{ activityId: 'node1' }] })
      else older.reject(new Error('older node request failed'))
      await expect(olderLoad).resolves.toEqual([])
      expect(model.rejectableNodes.value).toEqual([{ activityId: 'node2' }])
      expect(model.areNodesReady('t2')).toBe(true)
      expect(model.areNodesReady('t1')).toBe(false)
    },
  )

  it('节点成功返回空数组也复用缓存，失败不缓存', async () => {
    const apis = makeApis()
    apis.getRejectableNodes.mockRejectedValueOnce(new Error('failed'))
    apis.getRejectableNodes.mockResolvedValue({ code: 200, msg: 'ok', data: [] })
    const model = useApprovalDetail(() => 'p1', { apis })
    await model.loadRejectableNodes('t1')
    expect(model.areNodesReady('t1')).toBe(false)
    await model.loadRejectableNodes('t1')
    await model.loadRejectableNodes('t1')
    expect(model.areNodesReady('t1')).toBe(true)
    expect(apis.getRejectableNodes).toHaveBeenCalledTimes(2)
  })

  it('节点缓存不能跨实例复用', async () => {
    const instanceId = ref('p1')
    const apis = makeApis()
    const model = useApprovalDetail(() => instanceId.value, { apis })
    await model.loadRejectableNodes('t1')
    instanceId.value = 'p2'
    await model.loadRejectableNodes('t1')
    expect(apis.getRejectableNodes).toHaveBeenCalledTimes(2)
  })

  it('作用域销毁后，两个通道失效且不再发起请求', async () => {
    const detailResponse = deferred<DetailResponse>()
    const nodeResponse = deferred<NodeResponse>()
    const getDetail = vi.fn(() => detailResponse.promise)
    const getRejectableNodes = vi.fn(() => nodeResponse.promise)
    const model = useApprovalDetail(() => 'p1', { apis: { getDetail, getRejectableNodes } })
    const detailLoad = model.load()
    const nodeLoad = model.loadRejectableNodes('t1')
    scopes.at(-1)!.stop()
    detailResponse.reject(new Error('failed after disposal'))
    nodeResponse.resolve({ data: [{ activityId: 'node1' }] })
    await detailLoad
    await expect(nodeLoad).resolves.toEqual([])
    await model.load()
    await model.loadRejectableNodes('t1')
    expect(getDetail).toHaveBeenCalledTimes(1)
    expect(getRejectableNodes).toHaveBeenCalledTimes(1)
    expect(model.detail.value).toEqual({})
    expect(model.rejectableNodes.value).toEqual([])
    expect(model.loading.value).toBe(false)
    expect(model.nodeLoading.value).toBe(false)
  })

  it('canCancelInstance 只允许「进行中 / 已驳回」', () => {
    expect(canCancelInstance('0')).toBe(true)
    expect(canCancelInstance('3')).toBe(true)
    expect(canCancelInstance('1')).toBe(false)
    expect(canCancelInstance('2')).toBe(false)
    expect(canCancelInstance(undefined)).toBe(false)
  })
})
