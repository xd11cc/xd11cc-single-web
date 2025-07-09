<template>
  <el-row class="menu-container">
    <el-col>
      <div class="title-container">
        <img src="@/assets/imgs/logo.jpg" alt="系统logo" class="logo-image" />
        <h3 class="title">xd11cc管理系统</h3>
      </div>
      <el-menu> </el-menu>
    </el-col>
  </el-row>
</template>

<script setup></script>
<style lang="scss" scoped>
.menu-container {
  .title-container {
    display: flex;
    align-items: center; // 垂直居中对齐
    justify-content: center;
    gap: 12px; // 元素之间距离
    .logo-image {
      height: 40px; // 设置图片高度
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
