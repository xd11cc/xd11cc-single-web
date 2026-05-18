<template>
  <div class="bindUser-container">
    <div class="bindUser-card">
      <div class="title">
        <h3>关联用户</h3>
      </div>
      <div class="content">
        <el-form ref="loginFormRef">
          <el-form-item prop="username">
            <el-input placeholder="请输入用户名" type="text" tabindex="1" size="large" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              placeholder="请输入密码"
              type="password"
              tabindex="2"
              size="large"
              show-password
            />
          </el-form-item>
          <el-button type="primary" size="large">登录</el-button>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup></script>

<style lang="scss" scoped></style>
