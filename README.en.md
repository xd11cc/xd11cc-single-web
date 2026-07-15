# XD11CC Single Web

**[中文](README.md) | English**

A production-ready, multi-tenant SaaS admin frontend framework built with Vue 3.5 and TypeScript, providing out-of-the-box enterprise solutions for authentication, authorization, dynamic routing, real-time messaging, and data visualization.

## Tech Stack

| Category | Technology | Version | Description |
|----------|-----------|---------|-------------|
| **Framework** | Vue | 3.5.17 | Progressive frontend framework |
| **Language** | TypeScript | 5.x | Type safety |
| **Build Tool** | Vite | 7.0.0 | Lightning-fast dev experience |
| **UI Library** | Element Plus | 2.10.2 | Enterprise-grade component library |
| **State Management** | Pinia | 3.0.3 | Reactive state container |
| **Router** | Vue Router | 4.5.1 | Routing management + dynamic routes |
| **HTTP Client** | Axios | 1.10.0 | Request interceptor + unified error handling |
| **Styling** | Sass | 1.89.2 | Obsidian three-layer design token architecture |
| **Icons** | Iconify | 5.0.1 | Lucide offline bundle |
| **Fonts** | Outfit + DM Sans | - | Display / Body fonts |
| **Charts** | ECharts + Vue-ECharts | 6.1.0 / 8.0.1 | Data visualization |
| **Code Highlight** | Highlight.js | 11.11.1 | Code generator preview |
| **Realtime** | WebSocket | - | Heartbeat + exponential backoff reconnection |
| **Utilities** | lodash-es / mitt / nprogress / screenfull | - | Common utilities |
| **i18n** | vue-i18n | 11.2.8 | Internationalization |

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
- **SMS Login** — Phone number + verification code
- **Social Login** — OAuth2 third-party authorization (GitHub, WeChat, QQ), supports URL-parameter Token auto-login callback
- **Register & Forgot Password** — Full user lifecycle
- **Account Binding** — Link social accounts to existing users
- **QR Code Login** — Scan-to-login support

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
- **Scheduled Jobs** — Job CRUD, visual Cron expression generator, execution log viewer (Quartz / XXL-JOB)
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
│   │   ├── CronGenerator/          # Cron expression builder
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
│   │   ├── useDevice.ts            # Device type detection
│   │   ├── useDict.ts              # Dictionary data loading
│   │   ├── useLayoutMode.ts        # Layout mode
│   │   ├── useOssUrl.ts            # OSS URL caching
│   │   ├── usePagination.ts        # Pagination params
│   │   ├── useRouteListener.ts     # Route events
│   │   ├── useTableColumns.ts      # Table column config
│   │   ├── useTheme.ts             # Theme toggle (View Transition)
│   │   ├── useTitle.ts             # Dynamic page title
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
│   ├── config.ts                   # Route config (static routes / whitelist)
│   ├── guard.ts                    # Navigation guard (NProgress / dynamic routes)
│   ├── helper.ts                   # Route flattening utility
│   ├── index.ts                    # Router entry
│   └── whitelist.ts                # Login-free whitelist
└── views/                          # Page views
    ├── dashboard/                  # Dashboard
    ├── error/                      # 401, 404, 500 error pages
    ├── login/                      # Login, register, forgot password, social binding
    ├── monitor/druid/              # Druid database monitor
    ├── redirect/                   # Route redirect
    ├── system/                     # System management (14 sub-modules)
    └── tool/generateCode/          # Code generator
```

## Quick Start

### Prerequisites

- Node.js 18+
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

### Code Formatting

```bash
pnpm format
```

## Environment Configuration

Environment variables are managed via `.env.*` files in the project root:

| Variable | Description |
|----------|-------------|
| `VITE_APP_TITLE` | Application title shown in browser tab |
| `VITE_BASE_URL` | API base URL |
| `VITE_PUBLIC_PATH` | Public base path (deployment sub-path) |
| `VITE_WS_URL` | WebSocket server URL |
| `VITE_WS_PATH` | WebSocket endpoint path |

| File | Environment | API URL | WS URL |
|------|-------------|---------|--------|
| `.env.dev` | Development | `http://127.0.0.1:10001` | `ws://127.0.0.1:12001` |
| `.env.test` | Testing | Per deployment | Per deployment |
| `.env.prod` | Production | `https://xd11ccc.cloud/single-api` | `wss://xd11ccc.cloud/single-api` |

In development mode, Vite proxies `/xd11cc` → `http://localhost:10001`.

## API Endpoints

| Module | Endpoint | Description |
|--------|----------|-------------|
| **Auth** | `POST /login/loginByPassword` | Username/password login |
| Auth | `GET /login/getCaptcha` | Get CAPTCHA |
| Auth | `GET /login/getUserInfo` | Get current user info |
| Auth | `GET /login/getRoutes` | Get current user routes |
| Auth | `GET /login/authorize/{source}` | OAuth2 social login |
| Auth | `GET /login/callback/{source}` | OAuth2 callback |
| **User** | `POST /system/user/page` | User paginated list |
| User | `POST /system/user/add` | Add user |
| User | `PUT /system/user/edit` | Edit user |
| User | `DELETE /system/user/remove/{id}` | Delete user |
| User | `PUT /system/user/resetPassword` | Reset password |
| **Role** | `POST /system/role/page` | Role paginated list |
| Role | `POST /system/role/assign` | Assign role permissions |
| **Menu** | `GET /system/menu/list` | Menu list (tree) |
| **Department** | `GET /system/dept/list` | Department list (tree) |
| Department | `POST /system/dept/add` | Add department |
| **Post** | `POST /system/post/page` | Post paginated list |
| **Dictionary** | `POST /system/dict/type/page` | Dict type paginated |
| Dictionary | `POST /system/dict/data/page` | Dict data paginated |
| **Config** | `POST /system/config/page` | System config paginated |
| **Notice** | `POST /system/notice/page` | Notice paginated |
| Notice | `POST /system/notice/publish/{id}` | Publish notice |
| Notice | `PUT /system/notice/revoke/{id}` | Revoke notice |
| **Operate Log** | `POST /system/operateLog/page` | Operate log paginated |
| **Login Log** | `POST /system/loginLog/page` | Login log paginated |
| **Online User** | `GET /system/onlineUser/list` | Online user list |
| Online User | `DELETE /system/onlineUser/forceLogout/{tokenId}` | Force logout |
| **Job** | `POST /system/job/page` | Job paginated list |
| Job | `POST /system/job/add` | Add job |
| Job | `POST /system/job/run/{id}` | Execute immediately |
| Job | `GET /system/job/log/page` | Execution logs |
| **File** | `POST /file/upload` | File upload |
| File | `GET /file/download/{id}` | File download |
| **Code Gen** | `POST /generate/code/preview` | Code preview |
| Code Gen | `POST /generate/code/download` | Code download |
| **Chat** | `GET /system/chat/onlineUsers` | Online user list |
| Chat | `POST /system/chat/send` | Send message |
| **Auth Client** | `POST /auth/client/config/list` | Social login config list |

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
                  → userStore.getInfo() fetch roles + permissions
                  → getRoutes(roles) request backend menu tree
                  → transformBackendRoutes() convert RouteVO[] → RouteRecordRaw[]
                  → filterDynamicRoutes() filter by roles
                  → router.addRoute(route) register dynamically
                  → Redirect to target page (replace: true, no history)
```

**Key Design**:
- Static routes (login / 404 / redirect) defined in `router/index.ts`
- Dynamic routes (business pages) fetched via `/login/getRoutes`, filtered by role
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

### Table Column Configuration Persistence

```typescript
// Usage
const { visibleColumns, updateColumnOrder, toggleColumnVisible } = useTableColumns({
  key: 'system-user', // unique per page
  defaultColumns: [
    { prop: 'userId', label: 'User ID', width: 100 },
    { prop: 'username', label: 'Username' },
    { prop: 'deptName', label: 'Department' },
    // ...
  ],
})

// Persistence logic
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

**Key Design**:
- Each page has a unique `key` as localStorage key prefix, no cross-page interference
- New columns auto-append; deleted columns reappear on user restore
- Supports drag reorder (`updateColumnOrder`) + visibility toggle (`toggleColumnVisible`) + width memory

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

## Roadmap

- [x] Multi-layout modes (Left / Top / LeftTop)
- [x] Dynamic theme (View Transition API)
- [x] Obsidian three-layer design token architecture
- [x] Route lazy loading + dynamic routes
- [x] Tags view + context menu + persistence
- [x] Route guards + NProgress progress bar
- [x] Permission directive v-permission
- [x] Request interceptor + Bearer Token + unified error handling
- [x] Password login + SMS login + Social login (OAuth2)
- [x] Register / Forgot Password / Account Binding / QR Code Login
- [x] WebSocket push (heartbeat + exponential backoff reconnection + visibility listener)
- [x] Global chat (contacts + messages + unread badges)
- [x] Push notifications (NEW_NOTICE / REVOKE_NOTICE)
- [x] Command palette (⌘K)
- [x] Skeleton screens (page / table / list / card)
- [x] Table column config (drag reorder / visibility / width / persistence)
- [x] Watermark system (tamper-proof)
- [x] Cron expression generator
- [x] Icon picker
- [x] Internationalization (vue-i18n)
- [x] Element Plus on-demand import
- [x] keep-alive cache
- [x] System management 14 sub-modules
- [x] Dashboard ECharts visualization
- [x] Code generator
- [ ] More layout modes (Mixed / Single)
- [ ] Theme customization panel (color picker)
- [ ] Multi-tab cache strategy optimization (whitelist / blacklist)
- [ ] Virtual scrolling long list optimization
- [ ] Micro-frontend support (qiankun / Module Federation)

## Backend

This frontend works with [XD11CC Single Backend](../backend/xd11cc-single). The backend provides REST API, WebSocket service, OAuth2 authorization, dynamic routing, and more.

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | Last 2 versions |
| Firefox | Last 2 versions |
| Safari | Last 2 versions |
| Edge | Last 2 versions |

## License

See [LICENSE](LICENSE) for details.
