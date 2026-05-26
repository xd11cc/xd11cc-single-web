<template>
  <div>
    <el-tooltip effect="dark" content="搜索菜单" placement="bottom">
      <Icon icon="lucide:search" class="action-icon" @click="handleOpen" />
    </el-tooltip>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'

const visible = ref<boolean>(false)

function handleOpen() {
  visible.value = true
}
</script>

<style lang="scss" scoped>
.action-icon {
  font-size: 18px;
  outline: none;
  cursor: pointer;
  color: var(--theme-text-secondary);
  transition: color var(--p-duration-fast);
}
</style>
