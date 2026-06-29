<template>
  <Icon v-if="name" :icon="name" />
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps<{
  name: string
}>()
</script>
