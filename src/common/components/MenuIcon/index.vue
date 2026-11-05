<template>
  <AppIcon v-if="name" :icon="name" />
</template>

<script setup lang="ts">
import AppIcon from '@@/components/AppIcon/index.vue'

defineProps<{
  name: string
}>()
</script>
