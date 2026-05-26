# XD11CC Single Web

**中文** | [English](./README.en.md)

SaaS 多租户管理平台前端，基于 Vue 3 + TypeScript + Element Plus 构建。

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Vue 3.5 + TypeScript |
| 构建工具 | Vite 7 |
| UI 组件库 | Element Plus |
| 状态管理 | Pinia 3 |
| 路由 | Vue Router 4 |
| HTTP 请求 | Axios |
| 样式 | Sass + CSS Variables（三层设计令牌） |
| 图标 | Iconify（Lucide 离线包） |
| 字体 | Outfit（Display）+ DM Sans（Body） |
| 图表 | ECharts + Vue-ECharts |
| 代码高亮 | Highlight.js |
| 格式化 | Prettier |

## 功能特性

### 布局系统
- **多布局模式** — 左侧栏 / 顶部导航 / 左+顶组合
- **动态主题** — 暗/亮双主题切换，View Transition API 圆形扩散动画
- **响应式设计** — 移动端自适应侧边栏折叠
- **标签栏** — 多标签页导航 + 右键菜单（刷新/关闭/关闭其他/关闭所有）
- **面包屑** — 基于路由层级自动生成
- **页面过渡** — 路由级 slide-fade 动画

### 认证系统
- **密码登录** — 用户名 + 密码 + 验证码
- **短信登录** — 手机号 + 验证码
- **社交登录** — OAuth2 第三方授权（GitHub、微信等）
- **注册 & 找回密码** — 完整用户生命周期
- **账号绑定** — 第三方账号关联已有用户

### 系统管理
- **用户管理** — CRUD、部门树筛选、角色分配、列配置（拖拽排序/显隐/记忆）
- **菜单管理** — 动态菜单树 + 权限绑定
- **字典管理** — 类型 + 数据两级字典
- **系统配置** — 键值对参数管理

### 开发者工具
- **代码生成** — 预览生成代码 + 语法高亮
- **Druid 监控** — 内嵌数据库监控面板

### 亮点功能
- **Command Palette (⌘K)** — 全局搜索页面，键盘导航
- **ECharts 数据可视化** — 仪表盘折线图、环形图、柱状图，自适应主题
- **骨架屏** — 多种 variant（page/table/list/card），shimmer 动画
- **表格列配置** — 拖拽排序、显隐切换、宽度记忆、localStorage 持久化

### 基础设施
- **权限指令** — `v-permission` 元素级访问控制
- **动态路由** — 后端菜单数据驱动路由生成
- **路由守卫** — 认证 + 权限校验
- **WebSocket** — 基于 Netty 的实时通信
- **请求拦截** — 统一错误处理、Token 携带、超时提示
- **缓存抽象** — Cookie / LocalStorage 类型化工具

## 项目结构

```
src/
├── common/
│   ├── assets/           # 静态资源（样式、字体）
│   ├── components/       # 公共组件
│   │   ├── IFrame/       # Iframe 封装
│   │   ├── IconSelect/   # 图标选择器
│   │   ├── Notify/       # 通知面板
│   │   ├── Screenfull/   # 全屏切换
│   │   ├── SearchMenu/   # Command Palette (⌘K)
│   │   ├── Skeleton/     # 骨架屏
│   │   └── TableColumnSetting/ # 表格列配置
│   ├── composables/      # 公共 Hooks
│   ├── constants/        # 常量定义
│   └── utils/            # 工具函数
├── layouts/
│   ├── components/       # 布局组件
│   └── modes/            # 布局模式（Left/Top/LeftTop）
├── pinia/stores/         # 状态管理
├── plugins/              # 插件注册
├── router/               # 路由配置 & 守卫
└── views/                # 页面视图
    ├── dashboard/        # 仪表盘（ECharts）
    ├── error/            # 401、404、500 错误页
    ├── login/            # 登录相关页面
    ├── system/           # 系统管理
    └── tool/             # 开发工具
```

## 快速开始

### 环境要求

- Node.js 18+
- pnpm（推荐）

### 安装依赖

```bash
pnpm install
```

### 启动开发

```bash
# 开发环境
pnpm dev

# 测试环境
pnpm test

# 生产环境
pnpm prod
```

默认运行在 `http://localhost:20001`

### 构建

```bash
# 生产构建
pnpm build

# 开发构建
pnpm build:dev

# 测试构建
pnpm build:test
```

产物输出到 `dist/` 目录。

## 环境配置

| 文件 | 环境 | API 地址 |
|------|------|----------|
| `.env.dev` | 开发 | `http://localhost:10001/xd11cc` |
| `.env.test` | 测试 | 按部署配置 |
| `.env.prod` | 生产 | 按部署配置 |

## 后端

本项目配合 [XD11CC Single Backend](../backend/xd11cc-single) 使用。

## 浏览器支持

| 浏览器 | 版本 |
|--------|------|
| Chrome | 最近 2 个版本 |
| Firefox | 最近 2 个版本 |
| Safari | 最近 2 个版本 |
| Edge | 最近 2 个版本 |
