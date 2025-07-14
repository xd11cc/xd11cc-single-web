<template>
  <el-row class="menu-container">
    <el-col>
      <div class="title-container">
        <img src="@/assets/imgs/logo.jpg" alt="系统logo" class="logo-image" />
        <h3 class="title">xd11cc管理系统</h3>
      </div>
      <el-menu
        active-text-color="#ffd04b"
        background-color="#545c64"
        class="el-menu"
        default-active="2"
        text-color="#fff"
        @open="handleOpen"
        @close="handleClose"
      >
        <RecursiveMenu v-for="item in treeMenu" :key="item.id" :menu-item="item" />
      </el-menu>
    </el-col>
  </el-row>
</template>

<script setup>
import { getTreeMenu } from '@/api/system/menu'
import { ref } from 'vue'
import RecursiveMenu from './RecursiveMenu.vue'

const treeMenu = ref(null)

const initTreeMenu = async () => {
  const result = await getTreeMenu()
  if (result.code === 200) {
    treeMenu.value = result.data
  }
}

initTreeMenu()
</script>
<style lang="scss" scoped>
.menu-container {
  .title-container {
    display: flex;
    align-items: center; // 垂直居中对齐
    justify-content: center;
    gap: 12px; // 元素之间距离
    padding: 16px;
    .logo-image {
      height: 36px; // 设置图片高度
      width: auto; // 保持图片比例
    }
    .title {
      color: #fff;
      margin: 0; // 移除默认边距
      white-space: nowrap; // 防止标题换行
    }
  }
}
</style>
