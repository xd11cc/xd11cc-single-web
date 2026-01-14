<template>
  <a v-if="isFrame" :href="to" target="_blank" rel="noopener">
    <slot />
  </a>
  <router-link v-else :to="to">
    <slot />
  </router-link>
</template>

<script lang="ts" setup>
interface Props {
  to: string
  isFrame: boolean
}

const { to, isFrame } = defineProps<Props>()
</script>

<style lang="scss" scoped></style>
