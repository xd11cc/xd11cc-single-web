# XD11CC Single Web

**[English](README.en.md) | 中文**

SaaS 多租户管理平台前端，基于 Vue 3.5 + TypeScript + Element Plus 构建，提供认证授权、动态路由、实时通讯、数据可视化等开箱即用的企业级前端解决方案。

## 技术栈

| 分类 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **基础框架** | Vue | 3.5.17 | 渐进式前端框架 |
| **语言** | TypeScript | 5.x | 类型安全 |
| **构建工具** | Vite | 7.0.0 | 极速开发体验 |
| **UI 组件库** | Element Plus | 2.10.2 | 企业级组件库 |
| **状态管理** | Pinia | 3.0.3 | 响应式状态容器 |
| **路由** | Vue Router | 4.5.1 | 路由管理 + 动态路由 |
| **HTTP 请求** | Axios | 1.10.0 | 请求拦截 + 统一错误处理 |
| **样式方案** | Sass | 1.89.2 | Obsidian 三层设计令牌架构 |
| **图标** | Iconify | 5.0.1 | Lucide 离线包 |
| **字体** | Outfit + DM Sans | - | Display / Body 字体 |
| **图表** | ECharts + Vue-ECharts | 6.1.0 / 8.0.1 | 数据可视化 |
| **代码高亮** | Highlight.js | 11.11.1 | 代码生成器预览 |
| **实时通信** | WebSocket | - | 心跳 + 指数退避重连 |
| **工具库** | lodash-es / mitt / nprogress / screenfull | - | 常用工具集 |
| **国际化** | vue-i18n | 11.2.8 | 多语言支持 |

## 功能特性

### 🏗️ 核心架构

- **多布局模式** — 左侧栏 / 顶部导航 / 左+顶组合三种布局，通过设置面板实时切换，支持移动端抽屉式侧边栏
- **动态主题** — 暗/亮双主题，View Transition API 圆形扩散动画切换，CSS Variables 三层令牌架构（原始令牌 `--p-*` → 语义令牌 `--theme-*` → 组件令牌 `--btn-*` / `--card-*` 等）
- **动态路由** — 后端菜单数据驱动，登录后动态获取用户角色对应的路由树，`transformBackendRoutes()` 转换为 `RouteRecordRaw`，通过 `router.addRoute()` 注册，支持组件懒加载
- **标签栏** — 多标签页导航，支持右键菜单（刷新 / 关闭 / 关闭其他 / 关闭所有），持久化至 localStorage
- **面包屑** — 基于路由层级自动生成
- **路由过渡** — 路由级 slide-fade 动画
- **全屏切换** — 基于 Screenfull 实现一键全屏

### 🔐 认证系统

- **密码登录** — 用户名 + 密码 + 图形验证码，JWT Bearer Token 注入
- **短信登录** — 手机号 + 短信验证码
- **社交登录** — OAuth2 第三方授权（GitHub、微信、QQ），支持 URL 参数携带 Token 自动登录回调
- **注册 & 找回密码** — 完整用户生命周期
- **账号绑定** — 第三方账号关联已有用户
- **二维码登录** — 扫码登录支持

### 📡 实时通信

- **WebSocket 推送** — 独立封装 `WebSocketClient` 类，Token 认证、心跳检测（25s）、空闲连接清理、页面可见性监听（`visibilitychange` 自动重连）
- **全局聊天** — 联系人列表、消息收发、未读标记、在线状态，悬浮按钮触发
- **通知推送** — WebSocket 实时通知面板，支持 `NEW_NOTICE` / `REVOKE_NOTICE` 推送
- **断线重连** — 指数退避策略（`reconnectBackoff: 1.5`），最多 10 次重试

### ⚡ 性能优化

- **路由懒加载** — 动态 `import()` 实现路由级代码分割
- **组件懒加载** — 视图模块 `import.meta.glob` 按需加载
- **keep-alive 缓存** — `AppMain` 内置 `<keep-alive>` 缓存页面状态
- **Element Plus 按需引入** — `unplugin-vue-components` + `unplugin-auto-import` 自动导入组件和 API
- **localStorage 持久化** — 主题、语言、表格列配置、标签栏、设置项持久化

### 🔧 基础设施

- **权限指令** — `v-permission` 指令，基于当前用户权限标签数组判断，无权限自动移除 DOM 元素
- **请求拦截** — Axios 统一拦截器，Bearer Token 注入、401 防并发重复跳转、超时友好提示、业务错误码统一处理
- **路由守卫** — 认证校验 + 权限校验 + NProgress 进度条，`afterEach` 动态设置页面标题
- **命令面板** — `⌘K` 全局页面搜索，键盘上下选择 / 回车跳转 / ESC 关闭
- **水印系统** — Canvas SVG 水印，`MutationObserver` + `ResizeObserver` 防篡改重建
- **骨架屏** — 多种 variant（page / table / list / card），shimmer 动画
- **国际化** — `vue-i18n` 多语言支持

### 📊 业务模块

- **系统管理** — 用户、角色、菜单、部门、岗位、字典、配置、日志（登录日志 / 操作日志 / 在线用户）
- **通知公告** — 公告发布与编辑，WebSocket 实时推送，个人通知收件箱
- **定时任务** — 任务 CRUD、Cron 表达式可视化生成、执行日志查看（Quartz / XXL-JOB）
- **仪表盘** — ECharts 数据可视化（访问趋势 / 流量来源 / 本周概况），统计卡片，快捷入口，最近活动时间线
- **Druid 监控** — SQL 监控面板集成
- **代码生成器** — Freemarker 模板快速生成 CRUD 代码

## 项目结构

```
src/
├── common/
│   ├── assets/styles/              # 样式系统（themes.css / variables.css / layout-common.scss / element-plus.css）
│   ├── components/                 # 公共组件
│   │   ├── Chat/                   # 聊天面板（联系人 + 消息区域 + 悬浮按钮）
│   │   ├── CronGenerator/          # Cron 表达式生成器
│   │   ├── IconSelect/             # 图标选择器
│   │   ├── IFrame/                 # Iframe 封装
│   │   ├── MenuIcon/               # 菜单图标渲染
│   │   ├── Notify/                 # WebSocket 通知面板
│   │   ├── Screenfull/             # 全屏切换
│   │   ├── SearchMenu/             # Command Palette (⌘K)
│   │   ├── Skeleton/               # 骨架屏
│   │   └── TableColumnSetting/     # 表格列配置
│   ├── composables/                # 公共 Hooks
│   │   ├── useChat.ts              # 聊天逻辑
│   │   ├── useDevice.ts            # 设备类型检测
│   │   ├── useDict.ts              # 字典数据加载
│   │   ├── useLayoutMode.ts        # 布局模式
│   │   ├── useOssUrl.ts            # OSS 地址缓存
│   │   ├── usePagination.ts        # 分页参数
│   │   ├── useRouteListener.ts     # 路由事件
│   │   ├── useTableColumns.ts      # 表格列配置
│   │   ├── useTheme.ts             # 主题切换（View Transition）
│   │   ├── useTitle.ts             # 动态标题
│   │   ├── useWatermark.ts         # 水印系统
│   │   └── useWebSocket.ts         # WebSocket 生命周期
│   ├── constants/                  # 应用常量
│   └── utils/                      # 工具函数
│       ├── cache/                  # 缓存工具（Cookie / LocalStorage）
│       ├── request.ts              # Axios 封装
│       └── webSocket.ts            # WebSocket 客户端
├── layouts/                        # 布局系统
│   ├── components/                 # 布局构建块
│   │   ├── AppMain/                # 主内容区（keep-alive + 过渡动画）
│   │   ├── Breadcrumb/             # 面包屑
│   │   ├── Footer/                 # 底部
│   │   ├── Hamburger/              # 侧边栏折叠按钮
│   │   ├── Logo/                   # Logo
│   │   ├── NavigationBar/          # 顶部导航栏
│   │   ├── Panel/                  # 设置面板抽屉
│   │   ├── Settings/               # 设置内容
│   │   ├── Sidebar/                # 侧边栏菜单
│   │   ├── TagsView/               # 标签栏
│   │   └── ThemeToggle/            # 主题切换按钮
│   ├── composables/                # 布局专属 Hooks
│   └── modes/                      # 布局模式（Left / Top / LeftTop）
├── pinia/stores/                   # 状态管理
│   ├── app.ts                      # 侧边栏 + 设备状态
│   ├── permission.ts               # 路由权限（动态路由生成 / 过滤）
│   ├── settings.ts                 # 布局设置
│   ├── tags-view.ts                # 标签栏状态
│   └── user.ts                     # 用户 + Token + 权限标签
├── plugins/                        # 插件注册
│   ├── iconify.ts                  # Iconify 图标集
│   ├── permission-directive.ts     # v-permission 指令
│   └── hljs.ts                     # Highlight.js
├── router/                         # 路由配置 & 守卫
│   ├── config.ts                   # 路由配置（静态路由 / 白名单）
│   ├── guard.ts                    # 导航守卫（NProgress / 动态路由）
│   ├── helper.ts                   # 路由降级工具（flatMultiLevelRoutes）
│   ├── index.ts                    # 路由入口
│   └── whitelist.ts                # 免登录白名单
└── views/                          # 页面视图
    ├── dashboard/                  # 仪表盘
    ├── error/                      # 401 / 404 / 500 错误页
    ├── login/                      # 登录 / 注册 / 找回密码 / 社交绑定
    ├── monitor/druid/              # Druid 数据库监控
    ├── redirect/                   # 路由重定向
    ├── system/                     # 系统管理（14 个子模块）
    └── tool/generateCode/          # 代码生成器
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

| 变量 | 说明 |
|------|------|
| `VITE_APP_TITLE` | 应用标题，显示在浏览器标签页 |
| `VITE_BASE_URL` | API 基础地址 |
| `VITE_PUBLIC_PATH` | 应用公共路径（部署子路径） |
| `VITE_WS_URL` | WebSocket 服务地址 |
| `VITE_WS_PATH` | WebSocket 端点路径 |

| 文件 | 环境 | API 地址 | WS 地址 |
|------|------|------|------|
| `.env.dev` | 开发 | `http://127.0.0.1:10001` | `ws://127.0.0.1:12001` |
| `.env.test` | 测试 | 按部署配置 | 按部署配置 |
| `.env.prod` | 生产 | `https://xd11ccc.cloud/single-api` | `wss://xd11ccc.cloud/single-api` |

开发环境下 Vite 配置了代理：`/xd11cc` → `http://localhost:10001`。

## 接口概览

| 模块 | 接口 | 描述 |
|------|------|------|
| **认证** | `POST /login/loginByPassword` | 账号密码登录 |
| 认证 | `GET /login/getCaptcha` | 获取验证码 |
| 认证 | `GET /login/getUserInfo` | 获取当前登录用户信息 |
| 认证 | `GET /login/getRoutes` | 获取当前用户路由菜单 |
| 认证 | `GET /login/authorize/{source}` | OAuth2 社交登录认证 |
| 认证 | `GET /login/callback/{source}` | OAuth2 认证回调 |
| **用户** | `POST /system/user/page` | 用户分页列表 |
| 用户 | `POST /system/user/add` | 新增用户 |
| 用户 | `PUT /system/user/edit` | 编辑用户 |
| 用户 | `DELETE /system/user/remove/{id}` | 删除用户 |
| 用户 | `PUT /system/user/resetPassword` | 重置密码 |
| **角色** | `POST /system/role/page` | 角色分页列表 |
| 角色 | `POST /system/role/assign` | 分配角色权限 |
| **菜单** | `GET /system/menu/list` | 菜单列表（树形） |
| **部门** | `GET /system/dept/list` | 部门列表（树形） |
| 部门 | `POST /system/dept/add` | 新增部门 |
| **岗位** | `POST /system/post/page` | 岗位分页列表 |
| **字典** | `POST /system/dict/type/page` | 字典类型分页 |
| 字典 | `POST /system/dict/data/page` | 字典数据分页 |
| **配置** | `POST /system/config/page` | 系统配置分页 |
| **通知** | `POST /system/notice/page` | 通知公告分页 |
| 通知 | `POST /system/notice/publish/{id}` | 发布通知 |
| 通知 | `PUT /system/notice/revoke/{id}` | 撤回通知 |
| **日志** | `POST /system/operateLog/page` | 操作日志分页 |
| 日志 | `POST /system/loginLog/page` | 登录日志分页 |
| **在线用户** | `GET /system/onlineUser/list` | 在线用户列表 |
| 在线用户 | `DELETE /system/onlineUser/forceLogout/{tokenId}` | 强制下线 |
| **定时任务** | `POST /system/job/page` | 任务分页列表 |
| 任务 | `POST /system/job/add` | 新增任务 |
| 任务 | `POST /system/job/run/{id}` | 立即执行 |
| 任务 | `GET /system/job/log/page` | 执行日志 |
| **文件** | `POST /file/upload` | 文件上传 |
| 文件 | `GET /file/download/{id}` | 文件下载 |
| **代码生成** | `POST /generate/code/preview` | 代码生成预览 |
| 代码生成 | `POST /generate/code/download` | 代码生成下载 |
| **聊天** | `GET /system/chat/onlineUsers` | 在线用户列表 |
| 聊天 | `POST /system/chat/send` | 发送消息 |
| **授权客户端** | `POST /auth/client/config/list` | 社交登录配置列表 |

## 架构亮点

### 动态主题切换（View Transition API）

```
用户点击主题切换按钮 → toggleTheme(event)
                    → 获取点击坐标 (x, y)
                    → 计算扩散半径 endRadius = hypot(max(x, w-x), max(y, h-y))
                    → document.startViewTransition(callback)
                    → callback 内更新 theme.value + applyTheme + localStorage
                    → transition.ready 后 animate clipPath: circle(0px) → circle(endRadius)
                    → 800ms 圆形扩散动画完成
```

**关键设计**：
- 降级兼容：不支持 View Transition API 的浏览器直接切换主题，无动画但功能正常
- 三层令牌：`--p-*`（原始） → `--theme-*`（语义） → `--btn-*` / `--card-*`（组件）
- `applyTheme()` 统一设置 `document.documentElement.dataset.theme`，所有组件令牌通过 CSS 变量级联继承

### 权限指令 v-permission

```typescript
// 使用方式
<el-button v-permission="['system:user:add']" type="primary">新增用户</el-button>

// 实现
const permission: Directive = {
  mounted(el, binding) {
    const { value: permissionFlag } = binding
    const all_permission = '*:*:*'
    const { permissions } = useUserStore()
    if (isArray(permissionFlag) && permissionFlag.length > 0) {
      const hasPermission = permissions.some(
        (permission) =>
          all_permission === permission || permissionFlag.includes(permission)
      )
      hasPermission || el.parentNode?.removeChild(el)
    } else {
      throw new Error(`请设置操作权限标签值`)
    }
  },
}
```

**实现原理**：
- 指令在 `mounted` 时校验当前用户的 `permissions` 标签数组
- 支持通配符 `*:*:*` 超级权限
- 无权限时静默移除 DOM 元素（`el.parentNode?.removeChild(el)`），无视觉闪烁
- 必须传入数组格式，缺少值时抛出明确错误提示

### 动态路由（后端菜单数据驱动）

```
用户登录成功 → 保存 Token
           → beforeEach 守卫拦截
           → userStore.getInfo() 获取 roles + permissions
           → getRoutes(roles) 请求后端接口获取菜单树
           → transformBackendRoutes() 将后端 RouteVO[] 转换为 RouteRecordRaw[]
           → filterDynamicRoutes() 根据 roles 过滤不可访问的路由
           → router.addRoute(route) 动态注册路由
           → 重定向到目标页面（replace: true 不留历史记录）
```

**关键设计**：
- 静态路由（登录页 / 404 / 重定向）在 `router/index.ts` 中静态定义
- 动态路由（业务页面）通过后端接口 `/login/getRoutes` 获取，按角色过滤
- 组件懒加载：`const viewModules = import.meta.glob('@/views/**/*.vue', { eager: false })`
- `Layout` 标记的路由统一使用 `@/layouts/index.vue` 布局包裹

### WebSocket 通信（心跳 + 指数退避重连）

```
useWebSocket.connect(token)
    → WebSocketClient 初始化（url / heartbeatInterval / reconnectBackoff）
    → initConnect()
    → WebSocket(`${url}?token=${encodeURIComponent(token)}`)

连接成功 → onopen
        → reconnectCount = 0
        → startHeartbeat() （25s 定时 PING）
        → startVisibilityListener() （页面可见时自动重连）

收到消息 → onmessage
        → PONG → 忽略（心跳响应）
        → PING → 回复 PONG（后端主动心跳）
        → JSON → dispatchMessage() → 匹配 action → 触发订阅回调

连接关闭 → onclose
        → 非手动关闭且重试次数 < maxReconnectTimes
        → reconnect() 指数退避重连
        → backoffInterval = reconnectInterval × reconnectBackoff^(count-1)

手动关闭 → close()
        → isManualClose = true
        → 清除所有定时器 + 事件监听
```

**关键设计**：
- Token 通过 URL Query 传递（`?token=xxx`），服务端在 WebSocket 握手阶段完成认证
- 页面不可见时暂停心跳，切回后自动检测连接状态并重连
- `dispatchMessage` 支持 action 精确匹配 + 通配符 `*` 全局监听
- 状态机：`DISCONNECTED` → `CONNECTING` → `CONNECTED` / `RECONNECTING`

### 表格列配置持久化

```typescript
// 使用方式
const { visibleColumns, updateColumnOrder, toggleColumnVisible } = useTableColumns({
  key: 'system-user', // 不同页面不同 key
  defaultColumns: [
    { prop: 'userId', label: '用户编号', width: 100 },
    { prop: 'username', label: '用户名称' },
    { prop: 'deptName', label: '部门' },
    // ...
  ],
})

// 持久化逻辑
function loadColumns(): TableColumnConfig[] {
  const cached = localStorage.getItem(storageKey)
  if (cached) {
    const parsed: TableColumnConfig[] = JSON.parse(cached)
    return defaults.map((def, i) => {
      const saved = parsed.find((c) => c.prop === def.prop)
      return {
        ...def,
        visible: saved?.visible ?? true,
        width: saved?.width ?? def.width,
        order: saved?.order ?? i,
      }
    })
  }
  return defaults.map((def, i) => ({ ...def, visible: true, order: i }))
}
```

**关键设计**：
- 每个页面独立的 `key` 作为 localStorage 键名前缀，互不干扰
- 新增列自动追加到末尾，删除列后用户恢复时重新显示
- 支持拖拽排序（`updateColumnOrder`）+ 显隐切换（`toggleColumnVisible`）+ 宽度记忆

### 水印防篡改

```
setWatermark(text) → createWatermarkEl()
                   → 生成 SVG base64 背景
                   → MutationObserver 监听水印元素自身（删除/隐藏 → 重建）
                   → MutationObserver 监听父容器（DOM 结构变化 → 重建）
                   → ResizeObserver 监听父容器尺寸（窗口缩放 → 重建）
```

**关键设计**：
- 水印元素 `pointer-events: none` 不干扰用户交互
- `z-index: 99999` 确保在最上层
- 主题自适应：`getThemeWatermarkColor()` 根据当前主题返回不同的透明度颜色
- 三层监听形成闭环防御：用户删除水印节点 → MutationObserver 触发 → 重建；用户隐藏父元素 → 重建；窗口缩放导致水印断裂 → 重建

### 路由守卫流程

```
用户访问 /system/user → beforeEach
                      → NProgress.start()
                      → 检查 userStore.token
                      → 无 Token：
                          → URL 携带 token（社交回调）→ 存入 store → 清参数继续
                          → 白名单 → 放行
                          → 其他 → 重定向 /login?redirect=xxx
                      → 有 Token 且访问 /login → 重定向 /dashboard
                      → 已有 roles → 放行
                      → 首次加载 → getInfo() → generateRoutes(roles) → addRoute
                                    → 出错 → resetToken() → 重定向 login
afterEach → setTitle(to.meta.title) → NProgress.done()
```

**关键设计**：
- 401 防并发处理：`isHandlingUnauthorized` 标志位，防止多个并发请求同时触发跳转
- 社交登录回调：URL Query 携带 Token，提取后存入 store 并清除参数避免刷新丢失
- `replace: true` 重定向不留历史记录，避免用户点击后退重新触发守卫

## 开发计划

- [x] 多布局模式（Left / Top / LeftTop）
- [x] 动态主题（View Transition API）
- [x] Obsidian 三层设计令牌架构
- [x] 路由懒加载 + 动态路由
- [x] 标签栏 + 右键菜单 + 持久化
- [x] 路由守卫 + NProgress 进度条
- [x] 权限指令 v-permission
- [x] 请求拦截器 + Bearer Token + 统一错误处理
- [x] 密码登录 + 短信登录 + 社交登录（OAuth2）
- [x] 注册 / 找回密码 / 账号绑定 / 二维码登录
- [x] WebSocket 推送（心跳 + 指数退避重连 + 可见性监听）
- [x] 全局聊天（联系人 + 消息 + 未读标记）
- [x] 通知推送（NEW_NOTICE / REVOKE_NOTICE）
- [x] 命令面板（⌘K）
- [x] 骨架屏（page / table / list / card）
- [x] 表格列配置（拖拽排序 / 显隐 / 宽度 / 持久化）
- [x] 水印系统（防篡改）
- [x] Cron 表达式生成器
- [x] 图标选择器
- [x] 国际化（vue-i18n）
- [x] Element Plus 按需引入
- [x] keep-alive 缓存
- [x] 系统管理 14 个子模块
- [x] 仪表盘 ECharts 可视化
- [x] 代码生成器
- [ ] 更多布局模式（Mixed / Single）
- [ ] 主题定制面板（颜色选择器）
- [ ] 多标签页缓存策略优化（白名单 / 黑名单）
- [ ] 虚拟滚动长列表优化
- [ ] 微前端接入支持（qiankun / Module Federation）

## 后端

本项目配合 [XD11CC Single Backend](../backend/xd11cc-single) 使用。后端提供 REST API、WebSocket 服务、OAuth2 授权、动态路由等接口。

## 浏览器支持

| 浏览器 | 版本 |
|------|------|
| Chrome | 最近 2 个版本 |
| Firefox | 最近 2 个版本 |
| Safari | 最近 2 个版本 |
| Edge | 最近 2 个版本 |

## 许可证

详见 [LICENSE](LICENSE)。
