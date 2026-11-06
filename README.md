# XD11CC Single Web

**[English](README.en.md) | 中文**

企业级管理平台前端，基于 Vue 3.5 + TypeScript + Element Plus 构建，提供认证授权、动态路由、实时通讯、数据可视化等开箱即用的能力。

## 技术栈

| 分类           | 技术                                      | 版本          | 说明                      |
| -------------- | ----------------------------------------- | ------------- | ------------------------- |
| **基础框架**   | Vue                                       | 3.5.17        | 渐进式前端框架            |
| **语言**       | TypeScript                                | 5.x           | 类型安全                  |
| **构建工具**   | Vite                                      | 7.0.0         | 极速开发体验              |
| **UI 组件库**  | Element Plus                              | 2.10.2        | 企业级组件库              |
| **状态管理**   | Pinia                                     | 3.0.3         | 响应式状态容器            |
| **路由**       | Vue Router                                | 4.5.1         | 路由管理 + 动态路由       |
| **HTTP 请求**  | Axios                                     | 1.10.0        | 请求拦截 + 统一错误处理   |
| **样式方案**   | Sass                                      | 1.89.2        | Obsidian 三层设计令牌架构 |
| **图标**       | Iconify                                   | 5.0.1         | Lucide 离线包             |
| **字体**       | Outfit + DM Sans                          | -             | Display / Body 字体       |
| **图表**       | ECharts + Vue-ECharts                     | 6.1.0 / 8.0.1 | 数据可视化                |
| **代码高亮**   | Highlight.js                              | 11.11.1       | 代码生成器预览            |
| **实时通信**   | WebSocket                                 | -             | 心跳 + 指数退避重连       |
| **工具库**     | lodash-es / mitt / nprogress / screenfull | -             | 常用工具集                |
| **国际化**     | vue-i18n                                  | 11.2.8        | 多语言支持                |
| **流程设计器** | bpmn-js                                   | 18.24.0       | BPMN 2.0 画布 + 属性面板  |
| **测试**       | Vitest + @vue/test-utils + happy-dom      | 5.0.5         | 104 个用例（6 个模块）    |
| **构建增强**   | vite-plugin-pwa / vite-plugin-compression | 1.3.0 / 0.5.1 | PWA + gzip 预压缩         |

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
- **社交登录** — OAuth2 第三方授权，回调地址携带 `?token=` 时由路由守卫接管并自动登录
- **账号绑定** — 第三方账号关联已有用户（`BindUserForm`）

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
- **图标按需加载** — 构建期扫描源码里用到的图标名，只打包这些；后端菜单等运行时图标走懒加载 chunk（入口因此从 201KB 降到 92KB gzip）
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
- **审批中心** — 我发起的（可撤回）/ 我的待办（通过 / 驳回 / 转办）/ 我已办，含流程详情抽屉
- **BPM 流程设计器** — bpmn-js 画布 + 属性面板（审批模式、候选人、条件表达式、监听器）+ 表达式配置
- **消息重投** — MQ 消费失败消息查询、重投与编辑后重投
- **授权客户端** — 社交登录客户端配置（图标上传、回调地址）
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
│   │   ├── useCrud.ts              # 列表页壳（20 个页面共用）
│   │   ├── useTreeCrud.ts          # 树形列表页壳（dept / menu）
│   │   ├── useDevice.ts            # 设备类型检测
│   │   ├── useDict.ts              # 字典数据加载
│   │   ├── useLayoutMode.ts        # 布局模式
│   │   ├── useOssUrl.ts            # OSS 地址缓存
│   │   ├── usePagination.ts        # 分页参数
│   │   ├── useRouteListener.ts     # 路由事件
│   │   ├── useTableColumns.ts      # 表格列配置
│   │   ├── useTheme.ts             # 主题切换（View Transition）
│   │   ├── useTitle.ts             # 动态标题
│   │   ├── useTodoQueue.ts         # 待办弹窗队列
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
│   ├── config.ts                   # 路由配置（history 模式 / 默认角色）
│   ├── guard.ts                    # 导航守卫（NProgress / 动态路由）
│   ├── index.ts                    # 路由入口（公共路由 + resetRouter）
│   ├── route-redirect.ts           # 目录路由 redirect 计算（纯函数）
│   └── whitelist.ts                # 免登录白名单
└── views/                          # 页面视图
    ├── approval/                   # 审批中心（started / todo / done + 详情抽屉）
    ├── bpm/                        # 工作流：定义 / 分类 / 模型设计器 / 表达式配置
    ├── dashboard/                  # 仪表盘
    ├── error/                      # 401 / 404 / 500 错误页
    ├── login/                      # 登录 / 社交账号绑定
    ├── monitor/druid/              # Druid 数据库监控
    ├── redirect/                   # 路由重定向
    ├── system/                     # 系统管理（14 个子模块）
    └── tool/generateCode/          # 代码生成器
```

## 快速开始

### 环境要求

- Node.js **20.19+ / 22.12+**（Vite 7 的最低要求，18 会启动失败）
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

### 类型检查与测试

```bash
# 类型检查（vue-tsc --noEmit）
pnpm typecheck

# 单元测试（Vitest，104 个用例，约 1.5s）
pnpm test:unit

# 监听模式
pnpm test:unit:watch
```

> `pnpm build` 已经串联 `typecheck → test:unit → vite build`，任一步失败都会中断打包。

测试覆盖：请求封装（401 并发去重 / 超时 / 错误码）、WebSocket 状态机（心跳 / 指数退避 / 可见性重连）、列表页壳与骨架结构、字典方向、标签栏缓存、动态路由转换、BPM 属性面板。

### 代码格式化

```bash
pnpm format
```

## 环境配置

项目根目录下 `.env.*` 文件管理不同环境的变量：

| 变量               | 说明                                       |
| ------------------ | ------------------------------------------ |
| `VITE_APP_TITLE`   | 应用标题，显示在浏览器标签页               |
| `VITE_BASE_URL`    | 后端地址（直连；留空则走同源 + Vite 代理） |
| `VITE_API_PREFIX`  | 接口前缀，当前为 `/xd11cc`                 |
| `VITE_PUBLIC_PATH` | 应用公共路径（部署子路径）                 |
| `VITE_WS_URL`      | WebSocket 服务地址（留空则按当前域名推导） |
| `VITE_WS_PATH`     | WebSocket 端点路径，当前为 `/ws`           |

| 文件        | 环境 | `VITE_BASE_URL`                    | `VITE_WS_URL`                     |
| ----------- | ---- | ---------------------------------- | --------------------------------- |
| `.env.dev`  | 开发 | 空（同源，走 Vite 代理）           | 空（按域名推导 `ws://localhost`） |
| `.env.test` | 测试 | `https://dev.api.com`              | `wss://dev.api.com`               |
| `.env.prod` | 生产 | `https://xd11ccc.cloud/single-api` | `wss://xd11ccc.cloud/single-api`  |

开发环境通过 Vite 代理把请求转发到本机后端，所以 `.env.dev` 里两个地址刻意留空：

```
/xd11cc  → http://127.0.0.1:10001   （REST）
/ws      → ws://127.0.0.1:10002     （WebSocket）
```

## 接口概览

按模块列出主要接口（完整定义在各页面 `apis/index.ts`）。路径均以 `VITE_API_PREFIX`（`/xd11cc`）为前缀。

| 模块           | 代表接口                                                                                                      | 说明                    |
| -------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **认证**       | `POST /login/loginByPassword`                                                                                 | 账号密码登录            |
|                | `GET /login/getCaptcha`                                                                                       | 图形验证码              |
|                | `GET /login/getUserInfo`                                                                                      | 当前用户信息 + 权限标签 |
|                | `GET /login/getRoutes`                                                                                        | 当前用户可见菜单树      |
|                | `GET /login/authorize/{source}`                                                                               | OAuth2 社交登录跳转     |
|                | `POST /login/social-user/bind`                                                                                | 社交账号绑定已有用户    |
|                | `GET /logout`                                                                                                 | 退出登录                |
| **用户**       | `POST /system/user/page` · `POST /system/user/add` · `POST /system/user/modifyById`                           | 分页 / 新增 / 修改      |
|                | `DELETE /system/user/removeByIds/{ids}` · `POST /system/user/resetPassword/{id}`                              | 删除 / 重置密码         |
| **角色**       | `POST /system/role/page` · `GET /system/role/menuIds/{id}` · `GET /system/role/deptIds/{id}`                  | 分页 + 权限回显         |
| **菜单**       | `GET /menu/treeList`                                                                                          | 菜单树                  |
| **部门**       | `GET /system/dept/treeList`                                                                                   | 部门树                  |
| **岗位**       | `POST /system/post/page`                                                                                      | 岗位分页                |
| **字典**       | `POST /dict/type/page` · `POST /dict/data/page` · `GET /dict/data/getCacheGroup/{types}`                      | 字典管理 + 批量缓存     |
| **配置**       | `POST /system/config/page`                                                                                    | 系统配置                |
| **通知公告**   | `POST /system/notice/page` · `POST /system/notice/publish/{id}` · `PUT /system/notice/revoke/{id}`            | 公告发布 / 撤回         |
| **我的通知**   | `POST /system/notice-user/myPage` · `POST /system/notice-user/markAllAsRead`                                  | 个人收件箱              |
| **日志**       | `POST /system/operateLog/page` · `POST /system/loginLog/page`                                                 | 操作 / 登录日志         |
| **在线用户**   | `GET /system/onlineUser/list` · `DELETE /system/onlineUser/forceLogout/{tokenId}`                             | 在线会话                |
| **消息重投**   | `POST /system/mq-fail/page` · `POST /system/mq-fail/replay/{id}`                                              | MQ 失败消息重投         |
| **授权客户端** | `POST /auth/client/config/page`                                                                               | 社交登录配置            |
| **代码生成**   | `POST /generate/code/page` · `GET /generate/code?tableName={name}`                                            | 表列表 / 生成           |
| **审批中心**   | `POST /workflow/process/mine` · `POST /workflow/task/todo` · `POST /workflow/task/done`                       | 我发起的 / 待办 / 已办  |
|                | `POST /workflow/task/approve` · `POST /workflow/task/reject` · `POST /workflow/task/delegate`                 | 通过 / 驳回 / 转办      |
|                | `GET /workflow/task/rejectable-nodes` · `POST /workflow/process/cancel`                                       | 可退回节点 / 撤回       |
| **流程定义**   | `POST /workflow/definition/page` · `POST /workflow/definition/suspend` · `POST /workflow/definition/activate` | 定义管理                |
| **流程模型**   | `POST /workflow/draft/save` · `POST /workflow/draft/deploy`                                                   | 设计器保存 / 部署       |
| **流程分类**   | `POST /workflow/category/page` · `GET /workflow/category/list`                                                | 分类管理                |
| **表达式配置** | `POST /workflow/expression-config/page` · `GET /workflow/expression-config/options`                           | 条件与监听器表达式      |

> 未接入前端的能力：定时任务由后端 xxl-job 直接调度，管理端不做页面；文件上传后端已具备，前端尚未接入。

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
           → userStore.getInfo() 获取用户信息 + permissions
           → getRoutes() 请求后端菜单树（后端只下发有权限的菜单，前端不再按角色过滤）
           → transformBackendRoutes() 将 RouteVO[] 转换为 RouteRecordRaw[]
             · 目录路由的 `redirect: 'noRedirect'` 换成「第一个可见子页」
             · 视图路由默认写入 `meta.keepAlive = true`
           → router.addRoute(route) 动态注册路由
           → markRoutesReady() 标记完成 → 重定向到目标页面（replace: true，不留历史记录）
```

**关键设计**：

- 静态路由（登录页 / 404 / 重定向）在 `router/index.ts` 中静态定义
- 守卫用单飞（`permissionInitialization`）+ `routesReady` 标记，保证首次进入时只初始化一次，并发导航不会重复注册
- 后端只返回当前用户有权限的菜单，因此前端**没有**角色过滤层
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

### 表格列配置（壳内置）

列表页只在 `UseCrudView` 上传一个 `columns`，排序 / 显隐 / 列宽都由壳负责并持久化：

```vue
<UseCrudView :slotProps="crud.slotProps" :columns="columns">
  <!-- 选择列等固定在生成列之前 -->
  <template #table-prefix>
    <el-table-column type="selection" width="50" align="center" />
  </template>

  <!-- 自定义单元格：默认取 row[prop]，需要时用 #cell-<prop> 覆盖 -->
  <template #cell-status="{ row }">
    <el-tag>{{ getDictItem('system_status', row.status)?.label }}</el-tag>
  </template>

  <!-- 操作列固定在生成列之后 -->
  <template #table-append="{ handleEdit, handleRemove }">
    <el-table-column fixed="right" :label="$t('common.action')" width="120">
      <template #default="{ row }">…</template>
    </el-table-column>
  </template>
</UseCrudView>
```

```ts
const columns: TableColumnDef[] = [
  { prop: 'username', label: $t('system.user.columns.username'), minWidth: 120 },
  { prop: 'status', label: $t('system.user.search.status'), width: 90, align: 'center' },
]
```

**关键设计**：

- 页面只声明「这一列长什么样」（`prop` / `label` / 宽度 / 对齐），不持有任何偏好状态
- 工具栏的列设置入口由壳渲染，用户拖拽排序、勾选显隐、拖动表头边框调宽，三项都持久化到 localStorage
- 偏好键默认取当前路由名（可用 `column-key` 覆盖），不同页面的列偏好互不干扰
- 至少保留一列可见；代码新增列追加到末尾、删除列后本地残留的 prop 自动忽略
- 现网 **20 个列表页 + 2 个树形页已全部接入**（树形页的树列固定在 `#table-prefix`，不参与列设置）；`columns` 必填，壳里只有这一条渲染路径
- 单元格全局 `nowrap + 省略号`，因此生成列**默认开启 `show-overflow-tooltip`**（悬浮显示全文）；纯数值/标签列可传 `showOverflowTooltip: false` 关闭

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
                      → routesReady（路由已注册）→ 放行
                      → 首次加载 → getInfo() → generateRoutes() → addRoute → markRoutesReady
                                    → 出错 → resetToken() → 重定向 login
afterEach → setTitle(to.meta.title) → NProgress.done()
```

**关键设计**：

- 401 防并发处理：`isHandlingUnauthorized` 标志位，防止多个并发请求同时触发跳转
- 社交登录回调：URL Query 携带 Token，提取后存入 store 并清除参数避免刷新丢失
- `replace: true` 重定向不留历史记录，避免用户点击后退重新触发守卫

## 后端

本项目配合 [XD11CC Single Backend](https://github.com/xd11cc/xd11cc-single.git) 使用。后端提供 REST API、WebSocket 服务、OAuth2 授权、动态路由等接口。

## 浏览器支持

| 浏览器  | 版本          |
| ------- | ------------- |
| Chrome  | 最近 2 个版本 |
| Firefox | 最近 2 个版本 |
| Safari  | 最近 2 个版本 |
| Edge    | 最近 2 个版本 |

## 许可证

详见 [LICENSE](LICENSE)。
