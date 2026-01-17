<template>
  <div>
    <el-tooltip effect="dark" content="布局设置" placement="bottom">
      <Setting @click="show = true" class="el-icon" />
    </el-tooltip>
    <el-drawer v-model="show" size="300px" :with-header="false">
      <slot />
    </el-drawer>
  </div>
</template>

<script lang="ts" setup>
import { Setting } from '@element-plus/icons-vue'

const show = ref<boolean>(false)
</script>

<style lang="scss" scoped>
.el-icon {
  font-size: 20px;
  &:focus {
    outline: none;
  }
}
</style>
