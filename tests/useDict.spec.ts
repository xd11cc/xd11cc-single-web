import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'

/**
 * useDict 的接口测试。
 *
 * 重点验证「字典方向」：后端 system_dict_data 的 label 存展示文案、value 存编码，
 * 这个方向被写反过一次（下拉里显示 0/1/2），所以用测试钉死。
 */

const dictPayload = {
  workflow_status: [
    { label: '进行中', value: '0', listClass: 'primary' },
    { label: '已完成', value: '1', listClass: 'success' },
    { label: '已驳回', value: '3', listClass: '非法值' },
  ],
}

vi.mock('@/views/system/dict/apis/index', () => ({
  getCacheGroup: vi.fn(async () => ({ code: 200, msg: 'ok', data: dictPayload })),
  getCache: vi.fn(),
}))

import { useDict } from '@/common/composables/useDict'

function withDict() {
  let api!: ReturnType<typeof useDict>
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useDict(['workflow_status'])
        return () => null
      },
    }),
  )
  return { api, wrapper }
}

describe('useDict 字典方向', () => {
  it('getDictMap 是「编码 -> 展示文案」', async () => {
    const { api, wrapper } = withDict()
    await vi.waitFor(() => expect(api.getDictList('workflow_status')).toHaveLength(3))

    expect(api.getDictMap('workflow_status')).toEqual({
      '0': '进行中',
      '1': '已完成',
      '3': '已驳回',
    })
    wrapper.unmount()
  })

  it('getDictItem 按编码（value）匹配，返回展示文案（label）', async () => {
    const { api, wrapper } = withDict()
    await vi.waitFor(() => expect(api.getDictList('workflow_status')).toHaveLength(3))

    expect(api.getDictItem('workflow_status', '1')?.label).toBe('已完成')
    expect(api.getDictItem('workflow_status', 3)?.label).toBe('已驳回')
    expect(api.getDictItem('workflow_status', '不存在')).toBeUndefined()
    wrapper.unmount()
  })

  it('getDictList 会把非法 listClass 兜底为 primary', async () => {
    const { api, wrapper } = withDict()
    await vi.waitFor(() => expect(api.getDictList('workflow_status')).toHaveLength(3))

    const list = api.getDictList('workflow_status')
    expect(list[1].listClass).toBe('success')
    expect(list[2].listClass).toBe('primary')
    wrapper.unmount()
  })
})
