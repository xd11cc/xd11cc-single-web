import { SIDEBAR_OPENED, SIDEBAR_CLOSED } from '@/constants/app-key'
import { setSidebarStatus, getSidebarStatus } from '@/utils/cache/local-storage'
import { defineStore, createPinia } from 'pinia'
import { reactive, ref, watch } from 'vue'
import { DeviceEnum } from '@/constants/app-key'

interface Sidebar {
  opened: boolean
  withoutAnimation: boolean
}

// 设置侧边栏状态本地缓存
function handleSidebarStatus(opened: boolean) {
  opened ? setSidebarStatus(SIDEBAR_OPENED) : setSidebarStatus(SIDEBAR_CLOSED)
}

export const useAppStore = defineStore('app', () => {
  // 侧边栏状态
  const sidebar: Sidebar = reactive({
    opened: getSidebarStatus() !== SIDEBAR_CLOSED,
    withoutAnimation: false,
  })

  // 设备类型
  const device = ref<DeviceEnum>(DeviceEnum.Desktop)

  // 监听侧边栏opend状态
  watch(
    () => sidebar.opened,
    (opend) => {
      handleSidebarStatus(opend)
    },
  )

  // 切换侧边栏
  const toggleSidebar = (withoutAnimation: boolean) => {
    sidebar.opened = !sidebar.opened
    sidebar.withoutAnimation = withoutAnimation
  }

  // 关闭侧边栏
  const closeSidebar = (withoutAnimation: boolean) => {
    sidebar.opened = false
    sidebar.withoutAnimation = withoutAnimation
  }

  // 切换设备类型
  const toggleDevice = (value: DeviceEnum) => {
    device.value = value
  }

  return { device, sidebar, toggleSidebar, closeSidebar, toggleDevice }
})

/**
 * @description 在SPA应用中可用于在pinia实例被激活前使用store
 * @description 在SSR应用中可用于在setup外使用store
 * @returns
 */
export function useAppStoreOutside() {
  return useAppStore(createPinia())
}
