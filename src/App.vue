<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>

<script>
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useTheme } from './composables/useTheme'

const { initTheme } = useTheme()
// 初始化主题
initTheme()
</script>

<style></style>
