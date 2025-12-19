<template>
  <el-container class="layout-container">
    <el-aside class="['aside-container', $style.aside]">
      <Menu />
    </el-aside>

    <el-container class="layout-container">
      <el-header class="['header-container', $style.aside]">
        <div class="toolbar">
          <Header />
        </div>
      </el-header>

      <el-main class="['main-container', $style.main]">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import Menu from './menu/index.vue'
import Header from './header/index.vue'
</script>

<style lang="scss" module>
// 使用CSS module避免样式污染
.layout-container {
  height: 100vh;
  display: flex;
}

.aside {
  height: 100%;
  // 引用全局变量
  background-color: var(--sidebar-bg-color);
  width: var(--sidebar-width);
  transition: width 0.3s; // 支持侧边栏折叠动画
}

.header {
  padding: 0 20px;
  box-shadow: var(--header-shadow);
  height: var(--header-height);
}

.main {
  height: calc(100vh - var(--header-height)); // 动态计算高度
  padding: 20px;
  overflow: auto; // 内容超出滚动
}
</style>
