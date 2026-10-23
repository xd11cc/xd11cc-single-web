<template>
  <div class="theme-toggle-shell">
    <el-tooltip :content="themeToggleTip" placement="bottom">
      <button type="button" class="theme-toggle" :aria-label="themeToggleTip" @click="handleToggle">
        <Icon :icon="isDark ? 'lucide:sun' : 'lucide:moon'" class="toggle-icon" />
      </button>
    </el-tooltip>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useTheme } from '@@/composables/useTheme'
import { useI18n } from 'vue-i18n'

const { isDark, toggleTheme } = useTheme()
const { t } = useI18n()

const themeToggleTip = computed(() =>
  isDark.value ? t('layout.themeToggle.switchToLight') : t('layout.themeToggle.switchToDark'),
)

function handleToggle(event: MouseEvent) {
  toggleTheme(event)
}
</script>

<style lang="scss" scoped>
.theme-toggle-shell {
  width: 100%;
  height: 100%;
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0;
  color: inherit;
  border: 0;
  background: transparent;
  cursor: pointer;

  .toggle-icon {
    font-size: 18px;
    color: var(--theme-text-secondary);
    transition:
      color var(--p-duration-fast),
      transform var(--p-duration-normal) var(--p-ease-out);
  }

  &:hover .toggle-icon {
    color: var(--theme-accent);
    transform: rotate(15deg);
  }
}
</style>
