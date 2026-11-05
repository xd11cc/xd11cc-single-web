# XD11CC Single Web

**[中文](README.md) | English**

An enterprise admin frontend built with Vue 3.5 and TypeScript, providing out-of-the-box authentication, authorization, dynamic routing, real-time messaging, and data visualization.

## Tech Stack

| Category             | Technology                                | Version       | Description                                    |
| -------------------- | ----------------------------------------- | ------------- | ---------------------------------------------- |
| **Framework**        | Vue                                       | 3.5.17        | Progressive frontend framework                 |
| **Language**         | TypeScript                                | 5.x           | Type safety                                    |
| **Build Tool**       | Vite                                      | 7.0.0         | Lightning-fast dev experience                  |
| **UI Library**       | Element Plus                              | 2.10.2        | Enterprise-grade component library             |
| **State Management** | Pinia                                     | 3.0.3         | Reactive state container                       |
| **Router**           | Vue Router                                | 4.5.1         | Routing management + dynamic routes            |
| **HTTP Client**      | Axios                                     | 1.10.0        | Request interceptor + unified error handling   |
| **Styling**          | Sass                                      | 1.89.2        | Obsidian three-layer design token architecture |
| **Icons**            | Iconify                                   | 5.0.1         | Lucide offline bundle                          |
| **Fonts**            | Outfit + DM Sans                          | -             | Display / Body fonts                           |
| **Charts**           | ECharts + Vue-ECharts                     | 6.1.0 / 8.0.1 | Data visualization                             |
| **Code Highlight**   | Highlight.js                              | 11.11.1       | Code generator preview                         |
| **Realtime**         | WebSocket                                 | -             | Heartbeat + exponential backoff reconnection   |
| **Utilities**        | lodash-es / mitt / nprogress / screenfull | -             | Common utilities                               |
| **i18n**             | vue-i18n                                  | 11.2.8        | Internationalization                           |
| **BPMN**             | bpmn-js                                   | 18.24.0       | BPMN 2.0 canvas + property panel               |
| **Testing**          | Vitest + @vue/test-utils + happy-dom      | 5.0.5         | 104 cases across 6 modules                     |
| **Build extras**     | vite-plugin-pwa / vite-plugin-compression | 1.3.0 / 0.5.1 | PWA + gzip pre-compression                     |

## Features

### 🏗️ Core Architecture

- **Multiple Layout Modes** — Left sidebar / Top navigation / Left + Top hybrid, switchable via settings panel. Adaptive drawer-style sidebar on mobile
- **Dynamic Theme** — Dark/Light toggle with View Transition API circular reveal animation. Three-layer design token architecture: Primitive (`--p-*`) → Semantic (`--theme-*`) → Component (`--btn-*` / `--card-*`)
- **Dynamic Routing** — Backend menu data-driven, login → fetch user roles → request backend menu tree → `transformBackendRoutes()` to `RouteRecordRaw` → `router.addRoute()` registration. Supports lazy component loading via `import.meta.glob`
- **Tags View** — Multi-tab navigation with context menu (refresh / close / close others / close all), persisted to localStorage
- **Breadcrumb** — Auto-generated from route hierarchy
- **Route Transitions** — Route-level slide-fade animations
- **Fullscreen Toggle** — One-click fullscreen via Screenfull

### 🔐 Authentication

- **Password Login** — Username + password + CAPTCHA, JWT Bearer Token injection
- **Social Login** — OAuth2 third-party authorization; callback with `?token=` is picked up by the router guard and logged in automatically
- **Account Binding** — Link social accounts to existing users (`BindUserForm`)

### 📡 Realtime Communication

- **WebSocket Push** — Standalone `WebSocketClient` class, Token authentication, heartbeat detection (25s), idle connection cleanup, page visibility listener (`visibilitychange` auto-reconnect)
- **Global Chat** — Contact list, messaging, unread badges, online status, floating button trigger
- **Push Notifications** — WebSocket real-time notification panel, supports `NEW_NOTICE` / `REVOKE_NOTICE` push
- **Reconnection** — Exponential backoff strategy (`reconnectBackoff: 1.5`), up to 10 retries

### ⚡ Performance Optimization

- **Route Lazy Loading** — Dynamic `import()` for route-level code splitting
- **Component Lazy Loading** — `import.meta.glob` on-demand loading for view modules
- **keep-alive Cache** — `<keep-alive>` built into `AppMain` for page state caching
- **Element Plus On-Demand** — `unplugin-vue-components` + `unplugin-auto-import` auto-imports components and APIs
- **On-demand Icons** — A build-time scan packs only referenced icons; runtime-only icons (backend menu) load from a lazy chunk (entry dropped from 201KB to 92KB gzip)
- **localStorage Persistence** — Theme, language, table column config, tags view, settings

### 🔧 Infrastructure

- **Permission Directive** — `v-permission` directive, checks against current user's permission tags array, silently removes DOM element on denial
- **Request Interceptor** — Axios unified interceptor, Bearer Token injection, 401 concurrent-dedup handling, timeout friendly tips, unified business error handling
- **Route Guards** — Authentication + permission checks with NProgress bar, `afterEach` dynamically sets page title
- **Command Palette** — `⌘K` global page search, keyboard up/down select / enter navigate / ESC close
- **Watermark** — Canvas SVG watermark, `MutationObserver` + `ResizeObserver` tamper-proof auto-rebuild
- **Skeleton Screens** — Multiple variants (page / table / list / card) with shimmer animation
- **Internationalization** — `vue-i18n` multi-language support

### 📊 Business Modules

- **System Management** — User, Role, Menu, Department, Post, Dictionary, Config, Logs (login / operate / online user)
- **Notices** — Announcement publishing, WebSocket real-time push, personal notification inbox
- **Approval Center** — Started (cancellable) / Todo (approve / reject / delegate) / Done, with a process detail drawer
- **BPM Designer** — bpmn-js canvas + property panel (approval mode, candidates, conditions, listeners) + expression config
- **MQ Replay** — Inspect failed messages, replay or edit-then-replay
- **Auth Clients** — Social login client configuration (icon upload, callback URL)
- **Dashboard** — ECharts data visualization (visit trends / traffic sources / weekly overview), stat cards, quick actions, recent activity timeline
- **Druid Monitor** — SQL monitoring panel integration
- **Code Generator** — Freemarker-based rapid CRUD code generation

## Project Structure

```
src/
├── common/
│   ├── assets/styles/              # Style system (themes.css / variables.css / layout-common.scss / element-plus.css)
│   ├── components/                 # Shared components
│   │   ├── Chat/                   # Chat panel (contacts + message area + floating button)
│   │   ├── IconSelect/             # Icon picker
│   │   ├── IFrame/                 # Iframe wrapper
│   │   ├── MenuIcon/               # Menu icon renderer
│   │   ├── Notify/                 # WebSocket notification panel
│   │   ├── Screenfull/             # Fullscreen toggle
│   │   ├── SearchMenu/             # Command Palette (⌘K)
│   │   ├── Skeleton/               # Skeleton screens
│   │   └── TableColumnSetting/     # Table column config
│   ├── composables/                # Shared composables
│   │   ├── useChat.ts              # Chat logic
│   │   ├── useCrud.ts              # List-page shell (shared by 20 pages)
│   │   ├── useTreeCrud.ts          # Tree list-page shell (dept / menu)
│   │   ├── useDevice.ts            # Device type detection
│   │   ├── useDict.ts              # Dictionary data loading
│   │   ├── useLayoutMode.ts        # Layout mode
│   │   ├── useOssUrl.ts            # OSS URL caching
│   │   ├── usePagination.ts        # Pagination params
│   │   ├── useRouteListener.ts     # Route events
│   │   ├── useTableColumns.ts      # Table column config
│   │   ├── useTheme.ts             # Theme toggle (View Transition)
│   │   ├── useTitle.ts             # Dynamic page title
│   │   ├── useTodoQueue.ts         # Todo popup queue
│   │   ├── useWatermark.ts         # Watermark system
│   │   └── useWebSocket.ts         # WebSocket lifecycle
│   ├── constants/                  # Application constants
│   └── utils/                      # Utility functions
│       ├── cache/                  # Cache utils (Cookie / LocalStorage)
│       ├── request.ts              # Axios wrapper
│       └── webSocket.ts            # WebSocket client
├── layouts/                        # Layout system
│   ├── components/                 # Layout building blocks
│   │   ├── AppMain/                # Main content area (keep-alive + transitions)
│   │   ├── Breadcrumb/             # Breadcrumb
│   │   ├── Footer/                 # Footer
│   │   ├── Hamburger/              # Sidebar collapse toggle
│   │   ├── Logo/                   # Logo
│   │   ├── NavigationBar/          # Top navigation bar
│   │   ├── Panel/                  # Settings drawer
│   │   ├── Settings/               # Settings content
│   │   ├── Sidebar/                # Sidebar menu
│   │   ├── TagsView/               # Tab bar
│   │   └── ThemeToggle/            # Theme toggle button
│   ├── composables/                # Layout-specific composables
│   └── modes/                      # Layout variants (Left / Top / LeftTop)
├── pinia/stores/                   # State management
│   ├── app.ts                      # Sidebar + device state
│   ├── permission.ts               # Route permissions (dynamic route generation / filtering)
│   ├── settings.ts                 # Layout settings
│   ├── tags-view.ts                # Tab bar state
│   └── user.ts                     # User + Token + permission tags
├── plugins/                        # Plugin registration
│   ├── iconify.ts                  # Iconify icon sets
│   ├── permission-directive.ts     # v-permission directive
│   └── hljs.ts                     # Highlight.js
├── router/                         # Route config & guards
│   ├── config.ts                   # Route config (history mode / default roles)
│   ├── guard.ts                    # Navigation guard (NProgress / dynamic routes)
│   ├── index.ts                    # Router entry (public routes + resetRouter)
│   ├── route-redirect.ts           # Directory redirect resolver (pure function)
│   └── whitelist.ts                # Login-free whitelist
└── views/                          # Page views
    ├── approval/                   # Approval center (started / todo / done + detail drawer)
    ├── bpm/                        # Workflow: definitions, categories, modeler, expressions
    ├── dashboard/                  # Dashboard
    ├── error/                      # 401, 404, 500 error pages
    ├── login/                      # Login + social account binding
    ├── monitor/druid/              # Druid database monitor
    ├── redirect/                   # Route redirect
    ├── system/                     # System management (14 sub-modules)
    └── tool/generateCode/          # Code generator
```

## Quick Start

### Prerequisites

- Node.js **20.19+ / 22.12+** (Vite 7 minimum; Node 18 fails to start)
- pnpm (recommended)

### Install Dependencies

```bash
pnpm install
```

### Development

```bash
# Development environment (local backend)
pnpm dev

# Test environment
pnpm test

# Production environment
pnpm prod
```

Runs at `http://localhost:20001` by default. Opens browser automatically on first start.

### Build

```bash
# Production build
pnpm build

# Development build
pnpm build:dev

# Test build
pnpm build:test

# Preview build output
pnpm preview
```

Output goes to the `dist/` directory.

### Type Checking & Tests

```bash
# Type check (vue-tsc --noEmit)
pnpm typecheck

# Unit tests (Vitest, 104 cases, ~1.5s)
pnpm test:unit

# Watch mode
pnpm test:unit:watch
```

> `pnpm build` runs `typecheck → test:unit → vite build`; any failure aborts the build.

Coverage: request wrapper (401 de-duplication, timeouts, error codes), WebSocket state machine (heartbeat, exponential backoff, visibility reconnect), list-page shells and skeleton structure, dictionary direction, tag-view cache, dynamic route transformation, BPM property panel.

### Code Formatting

```bash
pnpm format
```

## Environment Configuration

Environment variables are managed via `.env.*` files in the project root:

| Variable           | Description                                         |
| ------------------ | --------------------------------------------------- |
| `VITE_APP_TITLE`   | Application title shown in browser tab              |
| `VITE_BASE_URL`    | Backend origin (empty = same origin via Vite proxy) |
| `VITE_API_PREFIX`  | API prefix, currently `/xd11cc`                     |
| `VITE_PUBLIC_PATH` | Public base path (deployment sub-path)              |
| `VITE_WS_URL`      | WebSocket server URL (empty = derive from host)     |
| `VITE_WS_PATH`     | WebSocket endpoint path, currently `/ws`            |

| File        | Environment | `VITE_BASE_URL`                    | `VITE_WS_URL`                    |
| ----------- | ----------- | ---------------------------------- | -------------------------------- |
| `.env.dev`  | Development | empty (same origin via Vite proxy) | empty (derived from host)        |
| `.env.test` | Testing     | `https://dev.api.com`              | `wss://dev.api.com`              |
| `.env.prod` | Production  | `https://xd11ccc.cloud/single-api` | `wss://xd11ccc.cloud/single-api` |

In development, Vite proxies requests to the local backend, which is why `.env.dev` leaves both URLs empty:

```
/xd11cc  → http://127.0.0.1:10001   (REST)
/ws      → ws://127.0.0.1:12001     (WebSocket)
```

## API Endpoints

Main endpoints per module (full definitions live in each page's `apis/index.ts`). Every path is prefixed by `VITE_API_PREFIX` (`/xd11cc`).

| Module               | Representative endpoints                                                                                      | Notes                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **Auth**             | `POST /login/loginByPassword`                                                                                 | Username + password login            |
|                      | `GET /login/getCaptcha`                                                                                       | Image CAPTCHA                        |
|                      | `GET /login/getUserInfo`                                                                                      | Current user + permission tags       |
|                      | `GET /login/getRoutes`                                                                                        | Menu tree visible to the user        |
|                      | `GET /login/authorize/{source}`                                                                               | OAuth2 social login redirect         |
|                      | `POST /login/social-user/bind`                                                                                | Bind social account to existing user |
|                      | `GET /logout`                                                                                                 | Sign out                             |
| **User**             | `POST /system/user/page` · `POST /system/user/add` · `POST /system/user/modifyById`                           | List / create / update               |
|                      | `DELETE /system/user/removeByIds/{ids}` · `POST /system/user/resetPassword/{id}`                              | Delete / reset password              |
| **Role**             | `POST /system/role/page` · `GET /system/role/menuIds/{id}` · `GET /system/role/deptIds/{id}`                  | List + permission echo               |
| **Menu**             | `GET /menu/treeList`                                                                                          | Menu tree                            |
| **Department**       | `GET /system/dept/treeList`                                                                                   | Department tree                      |
| **Post**             | `POST /system/post/page`                                                                                      | Post list                            |
| **Dictionary**       | `POST /dict/type/page` · `POST /dict/data/page` · `GET /dict/data/getCacheGroup/{types}`                      | Management + batch cache             |
| **Config**           | `POST /system/config/page`                                                                                    | System configuration                 |
| **Notices**          | `POST /system/notice/page` · `POST /system/notice/publish/{id}` · `PUT /system/notice/revoke/{id}`            | Publish / revoke                     |
| **My Notifications** | `POST /system/notice-user/myPage` · `POST /system/notice-user/markAllAsRead`                                  | Personal inbox                       |
| **Logs**             | `POST /system/operateLog/page` · `POST /system/loginLog/page`                                                 | Operate / login logs                 |
| **Online Users**     | `GET /system/onlineUser/list` · `DELETE /system/onlineUser/forceLogout/{tokenId}`                             | Live sessions                        |
| **MQ Replay**        | `POST /system/mq-fail/page` · `POST /system/mq-fail/replay/{id}`                                              | Failed message replay                |
| **Auth Clients**     | `POST /auth/client/config/page`                                                                               | Social login configuration           |
| **Code Generator**   | `POST /generate/code/page` · `GET /generate/code?tableName={name}`                                            | Table list / generate                |
| **Approval Center**  | `POST /workflow/process/mine` · `POST /workflow/task/todo` · `POST /workflow/task/done`                       | Started / todo / done                |
|                      | `POST /workflow/task/approve` · `POST /workflow/task/reject` · `POST /workflow/task/delegate`                 | Approve / reject / delegate          |
|                      | `GET /workflow/task/rejectable-nodes` · `POST /workflow/process/cancel`                                       | Rejectable nodes / cancel            |
| **Definitions**      | `POST /workflow/definition/page` · `POST /workflow/definition/suspend` · `POST /workflow/definition/activate` | Definition management                |
| **Models**           | `POST /workflow/draft/save` · `POST /workflow/draft/deploy`                                                   | Designer save / deploy               |
| **Categories**       | `POST /workflow/category/page` · `GET /workflow/category/list`                                                | Category management                  |
| **Expressions**      | `POST /workflow/expression-config/page` · `GET /workflow/expression-config/options`                           | Condition & listener expressions     |

> Not wired to the frontend: scheduled jobs are handled directly by xxl-job on the backend (no admin UI); file upload/download exists on the backend but is not integrated yet.

## Architecture Highlights

### Dynamic Theme Switch (View Transition API)

```
User clicks theme toggle → toggleTheme(event)
                        → Capture click coordinates (x, y)
                        → Calculate endRadius = hypot(max(x, w-x), max(y, h-y))
                        → document.startViewTransition(callback)
                        → Inside callback: update theme.value + applyTheme + localStorage
                        → transition.ready: animate clipPath circle(0px) → circle(endRadius)
                        → 800ms circular reveal animation complete
```

**Key Design**:

- Graceful degradation: browsers without View Transition API switch theme directly, no animation but fully functional
- Three-layer tokens: Primitive (`--p-*`) → Semantic (`--theme-*`) → Component (`--btn-*` / `--card-*`)
- `applyTheme()` centrally sets `document.documentElement.dataset.theme`, all component tokens inherit via CSS variable cascade

### Permission Directive v-permission

```typescript
// Usage
<el-button v-permission="['system:user:add']" type="primary">Add User</el-button>

// Implementation
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

**Implementation Principle**:

- Directive validates against current user's `permissions` tag array at `mounted`
- Supports wildcard `*:*:*` super-admin permission
- On denial, silently removes DOM element (`el.parentNode?.removeChild(el)`) — no visual flicker
- Requires array format; throws explicit error when value is missing

### Dynamic Routing (Backend Menu Data-Driven)

```
User login success → Save Token
                  → beforeEach guard intercepts
                  → userStore.getInfo() fetch user info + permissions
                  → getRoutes() request the menu tree (backend only returns permitted menus)
                  → transformBackendRoutes() convert RouteVO[] → RouteRecordRaw[]
                    · directory `redirect: 'noRedirect'` → first visible child
                    · view routes get `meta.keepAlive = true` by default
                  → router.addRoute(route) register dynamically
                  → markRoutesReady() → redirect to target page (replace: true, no history)
```

**Key Design**:

- Static routes (login / 404 / redirect) defined in `router/index.ts`
- The guard uses a single-flight (`permissionInitialization`) plus a `routesReady` flag, so concurrent navigations only initialize once
- Dynamic routes (business pages) fetched via `/login/getRoutes`; the backend already filters by permission, so there is **no role-filtering layer** in the frontend
- Lazy component loading: `const viewModules = import.meta.glob('@/views/**/*.vue', { eager: false })`
- Routes marked `Layout` wrapped by `@/layouts/index.vue`

### WebSocket Communication (Heartbeat + Exponential Backoff)

```
useWebSocket.connect(token)
    → WebSocketClient init (url / heartbeatInterval / reconnectBackoff)
    → initConnect()
    → WebSocket(`${url}?token=${encodeURIComponent(token)}`)

Connected → onopen
        → reconnectCount = 0
        → startHeartbeat() (25s PING interval)
        → startVisibilityListener() (auto-reconnect on visibility change)

Message → onmessage
        → PONG → ignore (heartbeat response)
        → PING → reply PONG (server-initiated heartbeat)
        → JSON → dispatchMessage() → match action → trigger subscriber callback

Closed → onclose
        → Non-manual close && retryCount < maxReconnectTimes
        → reconnect() exponential backoff
        → backoffInterval = reconnectInterval × reconnectBackoff^(count-1)

Manual close → close()
        → isManualClose = true
        → Clear all timers + event listeners
```

**Key Design**:

- Token passed via URL Query (`?token=xxx`), server completes auth at WebSocket handshake
- Heartbeat pauses when page is hidden, auto-detects and reconnects when visible
- `dispatchMessage` supports action exact match + wildcard `*` global listener
- State machine: `DISCONNECTED` → `CONNECTING` → `CONNECTED` / `RECONNECTING`

### Table Column Configuration (built into the shell)

A list page only passes `columns` to `UseCrudView`; ordering, visibility and width are owned by the shell and persisted:

```vue
<UseCrudView :slotProps="crud.slotProps" :columns="columns">
  <!-- Fixed leading columns (e.g. selection) -->
  <template #table-prefix>
    <el-table-column type="selection" width="50" align="center" />
  </template>

  <!-- Custom cell: defaults to row[prop], override with #cell-<prop> -->
  <template #cell-status="{ row }">
    <el-tag>{{ getDictItem('system_status', row.status)?.label }}</el-tag>
  </template>

  <!-- Fixed trailing columns (e.g. actions) -->
  <template #table-append="{ handleEdit, handleRemove }">
    <el-table-column fixed="right" :label="$t('common.action')" width="120">…</el-table-column>
  </template>
</UseCrudView>
```

```ts
const columns: TableColumnDef[] = [
  { prop: 'username', label: $t('system.user.columns.username'), minWidth: 120 },
  { prop: 'status', label: $t('system.user.search.status'), width: 90, align: 'center' },
]
```

**Key design**:

- Pages only describe a column (`prop` / `label` / width / align); they hold no preference state
- The column-settings entry is rendered by the shell. Drag to reorder, toggle visibility, drag a header border to resize — all three persist to localStorage
- The storage key defaults to the current route name (override with `column-key`), so pages never collide
- At least one column stays visible; new columns are appended while stale props from removed columns are ignored
- All **20 list pages + 2 tree pages** use it (tree column stays in `#table-prefix` and is not configurable); `columns` is required and the shell has a single rendering path
- Cells are globally `nowrap + ellipsis`, so generated columns enable `show-overflow-tooltip` **by default** (hover shows the full text); pass `showOverflowTooltip: false` to opt out

### Watermark Tamper-Proofing

```
setWatermark(text) → createWatermarkEl()
                   → Generate SVG base64 background
                   → MutationObserver on watermark element (delete/hide → rebuild)
                   → MutationObserver on parent container (DOM change → rebuild)
                   → ResizeObserver on parent (window resize → rebuild)
```

**Key Design**:

- Watermark element `pointer-events: none` — no interference with user interaction
- `z-index: 99999` ensures topmost layer
- Theme-adaptive: `getThemeWatermarkColor()` returns different opacity colors per theme
- Three-layer observer forms a closed loop defense: user deletes watermark node → MutationObserver triggers → rebuild; user hides parent → rebuild; window resize breaks watermark → rebuild

### Route Guard Flow

```
User visits /system/user → beforeEach
                         → NProgress.start()
                         → Check userStore.token
                         → No Token:
                             → URL carries token (social callback) → save to store → clear param continue
                             → Whitelist → pass
                             → Other → redirect /login?redirect=xxx
                         → Has Token && visiting /login → redirect /dashboard
                         → Has roles → pass
                         → First load → getInfo() → generateRoutes(roles) → addRoute
                                        → Error → resetToken() → redirect login
afterEach → setTitle(to.meta.title) → NProgress.done()
```

**Key Design**:

- 401 concurrent-dedup: `isHandlingUnauthorized` flag prevents multiple concurrent requests from triggering duplicate redirects
- Social login callback: URL Query carries Token, extracted into store and parameter cleared to survive refresh
- `replace: true` redirect avoids history record, prevents user clicking back from re-triggering guard

## Backend

This frontend works with [XD11CC Single Backend](https://github.com/xd11cc/xd11cc-single.git). The backend provides REST API, WebSocket service, OAuth2 authorization, dynamic routing, and more.

## Browser Support

| Browser | Version         |
| ------- | --------------- |
| Chrome  | Last 2 versions |
| Firefox | Last 2 versions |
| Safari  | Last 2 versions |
| Edge    | Last 2 versions |

## License

See [LICENSE](LICENSE) for details.
