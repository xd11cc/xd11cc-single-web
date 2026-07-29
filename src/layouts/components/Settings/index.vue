<template>
  <div class="setting-container">
    <h4>{{ $t('layout.settings.title') }}</h4>
    <SelectLayoutMode />
    <el-divider />
    <h4>{{ $t('layout.settings.functional') }}</h4>
    <div v-for="setting in switchSettings" :key="setting.key" class="setting-item">
      <span class="setting-name">{{ setting.label }}</span>
      <el-switch
        v-model="setting.value.value"
        :disabled="!isLeft && setting.key === 'fixedHeader'"
      />
    </div>
    <el-button type="danger" @click="resetLayoutConfig">
      <template #icon><Icon icon="lucide:rotate-ccw" /></template>
      {{ $t('common.reset') }}
    </el-button>
  </div>
</template>

<script lang="ts" setup>
import { useSettingsStore } from '@/pinia/stores/settings'
import { storeToRefs } from 'pinia'
import { removeLayoutsConfig } from '@@/utils/cache/local-storage'
import { useLayoutMode } from '@@/composables/useLayoutMode'
import { watchEffect } from 'vue'
import SelectLayoutMode from './SelectLayoutMode.vue'
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const $t = t
const settingsStore = useSettingsStore()

const { isLeft } = useLayoutMode()

const {
  showTagsView,
  showLogo,
  fixedHeader,
  showFooter,
  showScreenfull,
  showSearchMenu,
  cacheTagsView,
  showWatermark,
  showGreyMode,
  showColorWeakness,
} = storeToRefs(settingsStore)

// 定义switch设置项
const switchSettings = computed(() => [
  { key: 'showTagsView', label: $t('layout.settings.showTagsView'), value: showTagsView },
  { key: 'showLogo', label: $t('layout.settings.showLogo'), value: showLogo },
  { key: 'fixedHeader', label: $t('layout.settings.fixedHeader'), value: fixedHeader },
  { key: 'showFooter', label: $t('layout.settings.showFooter'), value: showFooter },
  { key: 'showScreenfull', label: $t('layout.settings.showScreenfull'), value: showScreenfull },
  { key: 'showSearchMenu', label: $t('layout.settings.showSearchMenu'), value: showSearchMenu },
  { key: 'cacheTagsView', label: $t('layout.settings.cacheTagsView'), value: cacheTagsView },
  { key: 'showWatermark', label: $t('layout.settings.showWatermark'), value: showWatermark },
  { key: 'showGreyMode', label: $t('layout.settings.showGreyMode'), value: showGreyMode },
  {
    key: 'showColorWeakness',
    label: $t('layout.settings.showColorWeakness'),
    value: showColorWeakness,
  },
])

// 非左侧模式，Header都是fix布局
watchEffect(() => {
  !isLeft.value && (fixedHeader.value = true)
})

// 重置
const resetLayoutConfig = () => {
  removeLayoutsConfig()
  location.reload()
}
</script>

<style lang="scss" scoped>
@use '@@/assets/styles/mixins.scss';

.setting-container {
  padding: 20px;
  .setting-item {
    font-size: var(--p-text-sm);
    color: var(--el-text-color-regular);
    padding: 5px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .setting-name {
      @extend %ellipsis;
    }
  }
  .el-button {
    margin-top: 40px;
    width: 100%;
  }
}
</style>
