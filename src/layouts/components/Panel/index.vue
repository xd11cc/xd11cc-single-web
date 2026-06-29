<template>
  <div>
    <el-tooltip effect="dark" content="布局设置" placement="bottom">
      <Icon icon="lucide:settings" @click="show = true" class="panel-icon" />
    </el-tooltip>
    <el-drawer v-model="show" size="300px" :with-header="false">
      <slot />
    </el-drawer>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'

const show = ref<boolean>(false)
</script>

<style lang="scss" scoped>
.panel-icon {
  font-size: 18px;
  cursor: pointer;
  color: var(--theme-text-secondary);
  transition: color var(--p-duration-fast);
  &:focus {
    outline: none;
  }
}
</style>
