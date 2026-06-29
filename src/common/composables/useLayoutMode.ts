import { LayoutModeEnum } from '@@/constants/app-key'
import { useSettingsStore } from '@/pinia/stores/settings'
import { computed } from 'vue'

export function useLayoutMode() {
  const settingsStore = useSettingsStore()

  const isLeft = computed(() => settingsStore.layoutMode === LayoutModeEnum.Left)

  const isTop = computed(() => settingsStore.layoutMode === LayoutModeEnum.Top)

  const isLeftTop = computed(() => settingsStore.layoutMode === LayoutModeEnum.LeftTop)

  function setLayoutMode(mode: LayoutModeEnum) {
    settingsStore.layoutMode = mode
  }

  return { isLeft, isTop, isLeftTop, setLayoutMode }
}
