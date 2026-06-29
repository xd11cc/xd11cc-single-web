import { getCache, getCacheGroup } from '@/views/system/dict/apis/index'
import type { SystemDictDataVO, DictMap, ElComponentType } from '@/views/system/dict/apis/type'

// 定义合法的Element组件类型列表（用于校验）
const VALID_COMPONENT_TYPES: ElComponentType[] = ['primary', 'success', 'info', 'warning', 'danger']

/**
 * 校验并转换为合法的组件类型
 * @param type
 * @returns
 */
const validDataComponentType = (type?: string): ElComponentType => {
  // 如果是合法类型则返回，否则返回 default
  if (type && VALID_COMPONENT_TYPES.includes(type as ElComponentType)) {
    return type as ElComponentType
  }
  return 'primary'
}

export const useDict = (dictTypes: string | string[]) => {
  // 加载状态
  const loading = ref<boolean>(false)
  // 原始字典数据
  const dictData = ref<Record<string, SystemDictDataVO[]>>({})

  if (Array.isArray(dictTypes)) {
    dictTypes = dictTypes.join(',')
  }

  /**
   * 加载字典数据
   */
  const loadDictData = async () => {
    loading.value = true
    try {
      const result = await getCacheGroup(dictTypes)
      dictData.value = result.data
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取字典映射（value -> label）
   * @param dictType
   * @returns
   */
  const getDictMap = (dictType: string): DictMap => {
    const list = dictData.value[dictType] || []
    return list.reduce((map, item) => {
      if (item.value && item.label) {
        map[item.value] = item.label
      }
      return map
    }, {} as DictMap)
  }

  /**
   * 获取下拉选项列表
   * @param dictType
   * @returns
   */
  const getDictList = (dictType: string): SystemDictDataVO[] => {
    const list = dictData.value[dictType] || []
    return list.map((item) => ({ ...item, listClass: validDataComponentType(item.listClass) }))
  }

  /**
   * 根据value获取字典项的完整信息
   * @param dictType
   * @param label
   * @returns
   */
  const getDictItem = (dictType: string, label: string | number): SystemDictDataVO | undefined => {
    const list = dictData.value[dictType] || []
    const item = list.find((item) => String(item.label) === String(label))
    if (!item) return undefined
    return { ...item, listClass: validDataComponentType(item?.listClass) }
  }

  // 自动加载
  onMounted(() => {
    loadDictData()
  })

  return { loading, dictData, getDictMap, getDictList, getDictItem }
}
