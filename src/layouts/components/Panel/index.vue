<template>
  <div class="handle-button" @click="show = true">
    <el-icon :size="18">
      <Setting />
    </el-icon>
  </div>
  <el-drawer v-model="show" size="300px" :width-header="false">
    <slot />
  </el-drawer>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Setting } from '@element-plus/icons-vue'

const show = ref(false)
</script>

<style lang="scss" scoped></style>
