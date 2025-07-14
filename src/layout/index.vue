<template>
  <el-container class="layout-container">
    <el-aside class="aside-container">
      <Menu></Menu>
    </el-aside>

    <el-container class="layout-container">
      <el-header class="header-container">
        <div class="toolbar">
          <Header></Header>
        </div>
      </el-header>

      <el-main class="main-container"> </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import Menu from './menu/index.vue'
import Header from './header/index.vue'
</script>

<style lang="scss" scoped>
.layout-container {
  height: 100vh;
  .aside-container {
    height: 100%;
    background-color: #2e394b;
  }
  .header-container {
    padding: 16px;
  }
  .main-container {
    height: 100%;
  }
}
</style>
