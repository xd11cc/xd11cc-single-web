<template>
  <el-breadcrumb>
    <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="item.id">
      <span v-if="index === breadcrumb.length - 1" class="no-redirect"> {{ item.menuName }}</span>
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script lang="ts" setup>
import { ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TreeMenuVO } from '@/types/index'
import { useUserStore } from '@/pinia/stores/user'

const route = useRoute()

const router = useRouter()

const userStore = useUserStore()

// 定义响应式数据breadcrumbs，用于存储面包屑导航信息
const breadcrumbs = ref<TreeMenuVO[]>([])

watchEffect(() => {
  breadcrumbs.value = userStore.treeMenu
})
</script>

<style lang="scss" scoped>
.el-breadcrumb {
  line-height: var(--v3-navigationbar-height);
  .no-redirect {
    column-gap: var(--el-text-color-placeholder);
  }
  a {
    font-weight: normal;
  }
}
</style>
