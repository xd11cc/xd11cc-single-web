<template>
  <button
    type="button"
    class="hamburger-trigger"
    :aria-label="t('layout.navigationBar.toggleSidebar')"
    :aria-expanded="isActive"
    @click="toggleClick"
  >
    <Icon
      :icon="isActive ? 'lucide:panel-left-close' : 'lucide:panel-left-open'"
      :width="20"
      :height="20"
      class="icon"
      aria-hidden="true"
    />
  </button>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'

interface Props {
  isActive?: boolean
}

const { isActive = false } = defineProps<Props>()

const emit = defineEmits<{
  toggleClick: []
}>()

const { t } = useI18n()

const toggleClick = () => {
  emit('toggleClick')
}
</script>

<style lang="scss" scoped>
.hamburger-trigger {
  display: flex;
  align-items: center;
  /* 内边距由使用方的 .hamburger 控制，避免与布局层样式争抢 */
  border: 0;
  background: none;
  font-family: inherit;
  cursor: pointer;
}

.icon {
  vertical-align: middle;
  color: var(--v3-hamburger-text-color);
}
</style>
