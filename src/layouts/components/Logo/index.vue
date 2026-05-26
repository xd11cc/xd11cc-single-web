<template>
  <div class="layout-logo-container" :class="{ collapse: collapse, 'layout-mode-top': isTop }">
    <router-link to="/" class="logo-link">
      <div class="logo-icon">
        <Icon icon="lucide:hexagon" class="icon" />
      </div>
      <span v-if="!collapse" class="logo-text">XD11CC</span>
    </router-link>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useLayoutMode } from '@@/composables/useLayoutMode'

interface Props {
  collapse?: boolean
}

const { collapse = true } = defineProps<Props>()

const { isTop } = useLayoutMode()
</script>

<style lang="scss" scoped>
.layout-logo-container {
  position: relative;
  width: 100%;
  height: var(--v3-header-height);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-bottom: 1px solid var(--theme-border-light);
  transition: border-color 0.3s ease;
}

.layout-mode-top {
  height: var(--v3-navigationbar-height);
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;

  .icon {
    font-size: 24px;
    color: var(--theme-accent);
  }
}

.logo-text {
  font-family: var(--p-font-display);
  font-size: var(--p-text-md);
  font-weight: var(--p-weight-bold);
  letter-spacing: -0.3px;
  color: var(--theme-text-primary);
}

.collapse {
  .logo-text {
    display: none;
  }
}
</style>
