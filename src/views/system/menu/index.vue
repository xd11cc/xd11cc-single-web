<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchForm" :inline="true" :model="searchData">
        <el-form-item prop="menuName" label="菜单名称">
          <el-input v-model="searchData.menuName" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item prop="status" label="状态">
          <el-select> </el-select>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card v-loading="loading"> </el-card>
  </div>
</template>

<script lang="ts" setup>
const loading = ref<boolean>(false)

const searchData = reactive({
  menuName: '',
})
</script>

<style lang="scss" scoped></style>
