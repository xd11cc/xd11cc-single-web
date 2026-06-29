# XD11CC Single Web

**中文** | [English](./README.en.md)

SaaS 多租户管理平台前端，基于 Vue 3 + TypeScript + Element Plus 构建。

## 技术栈

| 分类      | 技术                                          |
| --------- | --------------------------------------------- |
| 框架      | Vue 3.5 + TypeScript                          |
| 构建工具  | Vite 7                                        |
| UI 组件库 | Element Plus                                  |
| 状态管理  | Pinia 3                                       |
| 路由      | Vue Router 4                                  |
| HTTP 请求 | Axios                                         |
| 样式      | Sass + CSS Variables（Obsidian 三层设计令牌） |
| 图标      | Iconify（Lucide 离线包）                      |
| 字体      | Outfit（Display）+ DM Sans（Body）            |
| 图表      | ECharts 6 + Vue-ECharts                       |
| 代码高亮  | Highlight.js                                  |
| 实时通信  | WebSocket（心跳 + 指数退避重连）              |
| 格式化    | Prettier                                      |

## 功能特性

### 布局系统

- **多布局模式** — 左侧栏 / 顶部导航 / 左+顶组合，通过设置面板实时切换
- **动态主题** — 暗/亮双主题，View Transition API 圆形扩散动画切换
- **响应式设计** — 移动端自适应抽屉式侧边栏
- **标签栏** — 多标签页导航 + 右键菜单（刷新/关闭/关闭其他/关闭所有）
- **面包屑** — 基于路由层级自动生成
- **全屏切换** — 一键全屏，基于 Screenfull
- **页面过渡** — 路由级 slide-fade 动画

### 认证系统

- **密码登录** — 用户名 + 密码 + 图形验证码
- **短信登录** — 手机号 + 短信验证码
- **社交登录** — OAuth2 第三方授权（GitHub、微信、QQ）
- **注册 & 找回密码** — 完整用户生命周期
- **账号绑定** — 第三方账号关联已有用户
- **二维码登录** — 扫码登录支持

### 系统管理

| 模块       | 功能                                                             |
| ---------- | ---------------------------------------------------------------- |
| 用户管理   | CRUD、部门树筛选、角色分配、表格列配置（拖拽排序/显隐/宽度记忆） |
| 角色管理   | CRUD、权限分配（菜单 + 按钮级）                                  |
| 菜单管理   | 动态菜单树、按钮权限绑定、图标选择                               |
| 部门管理   | 树形结构 CRUD                                                    |
| 岗位管理   | CRUD                                                             |
| 字典管理   | 类型 + 数据两级字典，支持缓存                                    |
| 系统配置   | 键值对参数管理                                                   |
| 通知公告   | 公告发布与编辑，WebSocket 实时推送                               |
| 用户通知   | 个人通知收件箱                                                   |
| 定时任务   | 任务 CRUD、Cron 表达式可视化生成、执行日志查看                   |
| 登录日志   | 登录记录查询与审计                                               |
| 在线用户   | 在线用户监控、强制下线                                           |
| 操作日志   | 操作审计记录查询                                                 |
| 授权客户端 | OAuth2 客户端配置管理                                            |

### 仪表盘

- **数据可视化** — ECharts 折线图（访问趋势）、环形图（流量来源）、柱状图（本周概况）
- **统计卡片** — 关键指标概览
- **快捷入口** — 常用功能网格导航
- **最近活动** — 操作动态时间线
- **自适应主题** — 图表颜色跟随亮/暗主题

### 实时通信

- **全局聊天** — 联系人列表、消息收发、未读标记、在线状态
- **通知推送** — WebSocket 实时通知面板，支持 NEW_NOTICE / REVOKE_NOTICE
- **心跳检测** — 自动 PING/PONG 保活
- **断线重连** — 指数退避策略，最多 10 次重试

### 亮点功能

- **Command Palette (⌘K)** — 全局页面搜索，键盘快速导航
- **骨架屏** — 多种 variant（page/table/list/card），shimmer 动画
- **表格列配置** — 拖拽排序、显隐切换、宽度调整、localStorage 持久化
- **水印** — Canvas SVG 水印，MutationObserver/ResizeObserver 防篡改
- **Cron 生成器** — Cron 表达式可视化配置
- **图标选择器** — 基于 Iconify 的图标弹窗选择

### 基础设施

- **权限指令** — `v-permission` 元素级访问控制
- **动态路由** — 后端菜单数据驱动，按角色过滤
- **路由守卫** — 认证校验 + 权限校验 + NProgress 进度条
- **请求拦截** — 统一错误处理、Bearer Token 注入、超时提示
- **缓存抽象** — Cookie / LocalStorage 类型化工具
- **字典缓存** — 字典数据前端缓存，组件挂载自动加载

## 项目结构

```
src/
├── common/
│   ├── assets/styles/          # 样式系统（主题、变量、布局、Element Plus 覆盖）
│   ├── components/             # 公共组件
│   │   ├── Chat/               # 聊天面板（联系人 + 消息区域）
│   │   ├── CronGenerator/      # Cron 表达式生成器
│   │   ├── IconSelect/         # 图标选择器
│   │   ├── IFrame/             # Iframe 封装
│   │   ├── MenuIcon/           # 菜单图标渲染
│   │   ├── Notify/             # WebSocket 通知面板
│   │   ├── Screenfull/         # 全屏切换
│   │   ├── SearchMenu/         # Command Palette (⌘K)
│   │   ├── Skeleton/           # 骨架屏
│   │   └── TableColumnSetting/ # 表格列配置
│   ├── composables/            # 公共 Hooks
│   │   ├── useChat.ts          # 聊天逻辑
│   │   ├── useDevice.ts        # 设备类型检测
│   │   ├── useDict.ts          # 字典数据加载
│   │   ├── useLayoutMode.ts    # 布局模式
│   │   ├── useOssUrl.ts        # OSS 地址缓存
│   │   ├── usePagination.ts    # 分页参数
│   │   ├── useRouteListener.ts # 路由事件
│   │   ├── useTableColumns.ts  # 表格列配置
│   │   ├── useTheme.ts         # 主题切换
│   │   ├── useTitle.ts         # 动态标题
│   │   ├── useWatermark.ts     # 水印系统
│   │   └── useWebSocket.ts     # WebSocket 生命周期
│   ├── constants/              # 常量定义
│   └── utils/                  # 工具函数
│       ├── cache/              # 缓存工具（Cookie/LocalStorage）
│       ├── request.ts          # Axios 封装
│       └── webSocket.ts        # WebSocket 客户端
├── layouts/
│   ├── components/             # 布局构建块
│   │   ├── AppMain/            # 主内容区（keep-alive + 过渡动画）
│   │   ├── Breadcrumb/         # 面包屑
│   │   ├── Footer/             # 底部
│   │   ├── Hamburger/          # 侧边栏折叠按钮
│   │   ├── Logo/               # Logo
│   │   ├── NavigationBar/      # 顶部导航栏
│   │   ├── Panel/              # 设置面板抽屉
│   │   ├── Settings/           # 设置内容
│   │   ├── Sidebar/            # 侧边栏菜单
│   │   ├── TagsView/           # 标签栏
│   │   └── ThemeToggle/        # 主题切换按钮
│   └── modes/                  # 布局模式（Left/Top/LeftTop）
├── pinia/stores/               # 状态管理
│   ├── app.ts                  # 侧边栏 + 设备状态
│   ├── permission.ts           # 路由权限
│   ├── settings.ts             # 布局设置
│   ├── tags-view.ts            # 标签栏状态
│   └── user.ts                 # 用户 + Token
├── plugins/                    # 插件注册
│   ├── iconify.ts              # Iconify 图标集
│   ├── permission-directive.ts # v-permission 指令
│   └── hljs.ts                 # Highlight.js
├── router/                     # 路由配置 & 守卫
│   ├── guard.ts                # 导航守卫
│   ├── helper.ts               # 路由降级工具
│   └── whitelist.ts            # 免登录白名单
└── views/                      # 页面视图
    ├── dashboard/              # 仪表盘
    ├── error/                  # 401、404、500 错误页
    ├── login/                  # 登录、注册、找回密码、社交绑定
    ├── monitor/druid/          # Druid 数据库监控
    ├── redirect/               # 路由重定向
    ├── system/                 # 系统管理（14 个子模块）
    └── tool/generateCode/      # 代码生成器
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
# 开发环境（连接本地后端）
pnpm dev

# 测试环境
pnpm test

# 生产环境
pnpm prod
```

默认运行在 `http://localhost:20001`，首次启动自动打开浏览器。

### 构建

```bash
# 生产构建
pnpm build

# 开发构建
pnpm build:dev

# 测试构建
pnpm build:test

# 预览构建产物
pnpm preview
```

产物输出到 `dist/` 目录。

### 代码格式化

```bash
pnpm format
```

## 环境配置

项目根目录下 `.env.*` 文件管理不同环境的变量：

| 变量               | 说明                         |
| ------------------ | ---------------------------- |
| `VITE_APP_TITLE`   | 应用标题，显示在浏览器标签页 |
| `VITE_BASE_URL`    | API 基础地址                 |
| `VITE_PUBLIC_PATH` | 应用公共路径（部署子路径）   |
| `VITE_WS_URL`      | WebSocket 服务地址           |
| `VITE_WS_PATH`     | WebSocket 端点路径           |

| 文件        | 环境 | API 地址                           | WS 地址                          |
| ----------- | ---- | ---------------------------------- | -------------------------------- |
| `.env.dev`  | 开发 | `http://127.0.0.1:10001`           | `ws://127.0.0.1:12001`           |
| `.env.test` | 测试 | 按部署配置                         | 按部署配置                       |
| `.env.prod` | 生产 | `https://xd11ccc.cloud/single-api` | `wss://xd11ccc.cloud/single-api` |

开发环境下 Vite 配置了代理：`/xd11cc` → `http://localhost:10001`。

## 设计系统

项目内置 **Obsidian** 设计系统，采用三层令牌架构：

| 层级                                 | 说明                                                   |
| ------------------------------------ | ------------------------------------------------------ |
| 原始令牌（`--p-*`）                  | 颜色、间距、圆角、排版、阴影、持续时间等基础值         |
| 语义令牌（`--theme-*`）              | 按 light/dark 主题区分，绑定 Element Plus CSS 变量     |
| 组件令牌（`--btn-*`、`--card-*` 等） | 组件级样式变量，覆盖按钮、卡片、输入框、侧边栏、标签等 |

## 后端

本项目配合 [XD11CC Single Backend](../backend/xd11cc-single) 使用。后端提供 REST API、WebSocket 服务、OAuth2 授权、动态路由等接口。

## 浏览器支持

| 浏览器  | 版本          |
| ------- | ------------- |
| Chrome  | 最近 2 个版本 |
| Firefox | 最近 2 个版本 |
| Safari  | 最近 2 个版本 |
| Edge    | 最近 2 个版本 |
