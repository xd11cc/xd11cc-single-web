<template>
  <el-row class="menu-container">
    <el-col>
      <div class="title-container">
        <img src="@/assets/imgs/logo.jpg" alt="系统logo" class="logo-image" />
        <h3 class="title">xd11cc管理系统</h3>
      </div>
      <el-menu
        class="el-menu"
        default-active="activeMenuId"
        @open="handleOpen"
        @close="handleClose"
        @select="handleMenuJump"
      >
        <RecursiveMenu v-for="item in userStore.treeMenu" :key="item.id" :menu-item="item" />
      </el-menu>
    </el-col>
  </el-row>
</template>

<script setup>
import { useRouter } from 'vue-router'
import RecursiveMenu from './RecursiveMenu.vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { computed, onMounted } from 'vue'

const userStore = useUserStore()
const router = useRouter()

onMounted(async () => {
  // 初始化菜单
  await userStore.initMenu()
})

const activeMenuId = computed(() => {
  return userStore.flatMenu.find((menu) => menu.path === route.path)?.id || 2
})

// 路由跳转
const handleMenuJump = (id) => {
  const targetMenu = userStore.flatMenu.find((menu) => menu.id === id)
  if (targetMenu?.path) {
    router.push(targetMenu.path)
  } else {
    ElMessage.error('该菜单页面不存在，请联系管理员！')
  }
}
</script>
<style lang="scss" scoped>
.menu-container {
  height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;

  // 添加渐变装饰线
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 2px;
    height: 100%;
    background: linear-gradient(
      to bottom,
      rgba(74, 144, 226, 0.4) 0%,
      rgba(147, 51, 234, 0.4) 50%,
      rgba(74, 144, 226, 0.4) 100%
    );
    z-index: 1;
  }

  .title-container {
    padding: 16px 20px;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
    position: relative;
    background: rgba(22, 33, 62, 0.8);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    height: 72px;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(22, 33, 62, 0.95);
    }

    .logo-image {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #4a90e2 0%, #8a2387 50%, #f27121 100%);
      padding: 3px;
      box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
      transition: all 0.3s ease;
      overflow: hidden;
      flex-shrink: 0;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(74, 144, 226, 0.4);
      }
    }

    .title {
      color: #ffffff;
      margin: 0;
      font-size: 18px;
      font-weight: 700;

      // 将声明放在嵌套规则之前
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      letter-spacing: 0.5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      position: relative;
      padding-bottom: 4px;

      // 修复：添加完整的浏览器前缀支持
      background: linear-gradient(135deg, #fff 0%, #c8d6ff 100%);

      // Webkit 浏览器 (Chrome, Safari, Edge)
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;

      // 标准属性 (Firefox, 现代浏览器)
      background-clip: text;
      color: transparent;

      // 备用方案：如果浏览器不支持 background-clip: text
      @supports not (background-clip: text) {
        // 回退到纯白色文字
        background: transparent;
        color: #ffffff;
        -webkit-text-fill-color: #ffffff;
      }

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        transform: none;
        width: 0; // 初始为0
        height: 3px;
        background: linear-gradient(90deg, #4a90e2 0%, #8a2387 100%);
        border-radius: 2px;
        transition: width 0.3s ease;
      }

      // 悬停时显示下划线
      &:hover::after {
        width: 100%;
      }
    }
  }

  .menu-scroll-wrapper {
    height: calc(100vh - 72px);
    overflow-y: auto;
    overflow-x: hidden;
    padding: 8px 4px;

    // 自定义滚动条样式
    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 2px;
    }

    &::-webkit-scrollbar-thumb {
      background: linear-gradient(to bottom, #4a90e2, #8a2387);
      border-radius: 2px;

      &:hover {
        background: linear-gradient(to bottom, #5a9df2, #9a33a4);
      }
    }

    // Firefox 滚动条样式
    scrollbar-width: thin;
    scrollbar-color: #4a90e2 rgba(255, 255, 255, 0.05);
  }

  .el-menu {
    border-right: none;
    background: transparent;

    // 使用:deep()穿透scoped样式，修改Element Plus内部组件样式
    :deep() {
      // 菜单项基础样式
      .el-menu-item,
      .el-sub-menu__title {
        height: 48px;
        line-height: 48px;
        margin: 2px 8px;
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.85);
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;

        // 图标样式
        .el-icon {
          margin-right: 12px;
          font-size: 18px;
          transition: all 0.3s ease;
        }

        // 文字样式
        span {
          font-weight: 500;
          font-size: 14px;
        }

        // hover效果
        &:hover {
          background: linear-gradient(
            135deg,
            rgba(74, 144, 226, 0.15) 0%,
            rgba(138, 35, 135, 0.15) 100%
          );
          color: #fff;
          transform: translateX(4px);

          .el-icon {
            transform: scale(1.1);
            color: #4a90e2;
          }

          &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            width: 3px;
            background: linear-gradient(to bottom, #4a90e2, #8a2387);
            border-radius: 0 2px 2px 0;
          }
        }
      }

      // 激活项样式
      .el-menu-item.is-active {
        background: linear-gradient(
          135deg,
          rgba(74, 144, 226, 0.25) 0%,
          rgba(138, 35, 135, 0.25) 100%
        );
        color: #fff;
        box-shadow: 0 4px 12px rgba(74, 144, 226, 0.2);

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 3px;
          background: linear-gradient(to bottom, #4a90e2, #8a2387);
          border-radius: 0 2px 2px 0;
        }

        .el-icon {
          color: #4a90e2;
        }
      }

      // 子菜单样式
      .el-sub-menu {
        .el-sub-menu__title {
          &:hover {
            background: linear-gradient(
              135deg,
              rgba(74, 144, 226, 0.1) 0%,
              rgba(138, 35, 135, 0.1) 100%
            );
          }
        }

        &.is-active {
          > .el-sub-menu__title {
            color: #4a90e2;

            .el-icon {
              color: #4a90e2;
            }
          }
        }
      }

      // 子菜单内容
      .el-menu--inline {
        background: rgba(15, 25, 45, 0.5);
        margin: 4px 0;
        border-left: 1px solid rgba(74, 144, 226, 0.2);

        .el-menu-item {
          margin: 1px 8px;
          padding-left: 48px !important;
          border-radius: 6px;
          background: transparent;

          &.is-active {
            background: rgba(74, 144, 226, 0.15);
          }

          &:hover {
            padding-left: 52px !important;
          }
        }
      }

      // 展开/收起箭头
      .el-sub-menu__title .el-sub-menu__icon-arrow {
        color: rgba(255, 255, 255, 0.6);
        font-size: 12px;
        margin-right: 0;
      }
    }
  }
}

// 响应式设计调整
@media (max-width: 768px) {
  .menu-container {
    width: 64px;

    .title-container {
      padding: 16px 8px;
      justify-content: center;

      .logo-image {
        width: 36px;
        height: 36px;
        margin-bottom: 0;
      }

      .title {
        display: none;
      }
    }

    .menu-scroll-wrapper {
      height: calc(100vh - 64px);
    }

    .el-menu:deep() {
      .el-menu-item,
      .el-sub-menu__title {
        span {
          display: none;
        }

        .el-icon {
          margin-right: 0;
        }
      }
    }
  }
}
</style>
