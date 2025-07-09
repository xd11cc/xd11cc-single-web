<template>
  <svg class="svg-icon" :style="svgStyle" aria-hidden="true" v-bind="$attrs">
    <use :xlink:href="`#icon-${name}`" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'

// 接收图标名称作为prop
const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: [String, Number],
    default: 16,
  },
  color: {
    type: String,
    default: 'currentColor',
  },
})

const svgStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  color: props.color,
}))
</script>

<style lang="scss" scoped>
.svg-icon {
  display: inline-block;
  vertical-align: middle;
  fill: currentColor;
  overflow: hidden;
}
</style>
