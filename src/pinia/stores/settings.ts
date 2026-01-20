import { defineStore } from 'pinia'
import { ref, watch, type Ref } from 'vue'
import type { LayoutsConfig } from '@/layouts/config'
import { layoutsConfig } from '@/layouts/config'
import { setLayoutsConfig } from '@@/utils/cache/local-storage'

type SettingsStore = {
  // 使用映射类型来便利LayoutsConfig对象的键
  [Key in keyof LayoutsConfig]: Ref<LayoutsConfig[Key]>
}

type SettingsStoreKey = keyof SettingsStore

export const useSettingsStore = defineStore('settings', () => {
  // 状态对象
  const state = {} as SettingsStore

  // 遍历LayoutsConfig对象的键值对
  for (const [key, value] of Object.entries(layoutsConfig)) {
    // 使用类型断言来指定key的类型，将value包装在ref函数中，创建一个响应式变量
    const refValue = ref(value)
    // @ts-expect-error ignore
    state[key as SettingsStoreKey] = refValue
    // 监听每个响应式变量
    watch(refValue, () => {
      // 缓存
      const settings = getCacheData()
      setLayoutsConfig(settings)
    })
  }

  // 获取要缓存的数据：将state对象转化为settings对象
  const getCacheData = () => {
    const settings = {} as LayoutsConfig
    for (const [key, value] of Object.entries(state)) {
      // @ts-expect-error ignore
      settings[key as SettingsStoreKey] = value.value
    }
    return settings
  }
  return state
})
