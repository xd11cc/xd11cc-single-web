<template>
  <div @click="toggleClick">
    <el-icon :size="20" class="icon">
      <Fold v-if="isActive" />
      <Expand v-else />
    </el-icon>
  </div>
</template>

<script lang="ts" setup>
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

<style lang="scss" scoped></style>
