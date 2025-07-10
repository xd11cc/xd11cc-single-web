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
        class="el-menu-vertical-demo"
        default-active="2"
        text-color="#fff"
        @open="handleOpen"
        @close="handleClose"
      >
        <el-sub-menu index="1">
          <template #title>
            <el-icon><location /></el-icon>
            <span>首页</span>
          </template>
          <el-menu-item-group title="Group One">
            <el-menu-item index="1-1">item one</el-menu-item>
            <el-menu-item index="1-2">item two</el-menu-item>
          </el-menu-item-group>
          <el-menu-item-group title="Group Two">
            <el-menu-item index="1-3">item three</el-menu-item>
          </el-menu-item-group>
          <el-sub-menu index="1-4">
            <template #title>item four</template>
            <el-menu-item index="1-4-1">item one</el-menu-item>
          </el-sub-menu>
        </el-sub-menu>
        <el-menu-item index="2">
          <el-icon><icon-menu /></el-icon>
          <span>Navigator Two</span>
        </el-menu-item>
        <el-menu-item index="3" disabled>
          <el-icon><document /></el-icon>
          <span>Navigator Three</span>
        </el-menu-item>
        <el-menu-item index="4">
          <el-icon><setting /></el-icon>
          <span>Navigator Four</span>
        </el-menu-item>
      </el-menu>
    </el-col>
  </el-row>
</template>

<script setup>
import { getTreeMenu } from '@/api/system/menu'

const initTreeMenu = async () => {
  const result = await getTreeMenu()
  console.log(result)
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
