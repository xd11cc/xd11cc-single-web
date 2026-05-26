<template>
  <div class="theme-toggle" @click="handleToggle">
    <Icon :icon="isDark ? 'lucide:sun' : 'lucide:moon'" class="toggle-icon" />
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useTheme } from '@@/composables/useTheme'

const { isDark, toggleTheme } = useTheme()

function handleToggle(event: MouseEvent) {
  toggleTheme(event)
}
</script>

<style lang="scss" scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;

  .toggle-icon {
    font-size: 18px;
    color: var(--theme-text-secondary);
    transition: color var(--p-duration-fast), transform var(--p-duration-normal) var(--p-ease-out);
  }

  &:hover .toggle-icon {
    color: var(--theme-accent);
    transform: rotate(15deg);
  }
}
</style>
