<template>
  <div @click="toggleClick">
    <Icon :icon="isActive ? 'ep:fold' : 'ep:expand'" :width="20" :height="20" class="icon" />
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'

interface Props {
  isActive?: boolean
}

const { isActive = false } = defineProps<Props>()

const emit = defineEmits<{
  toggleClick: []
}>()

const toggleClick = () => {
  emit('toggleClick')
}
</script>

<style lang="scss" scoped>
.icon {
  vertical-align: middle;
  color: var(--v3-hamburger-text-color);
}
</style>
