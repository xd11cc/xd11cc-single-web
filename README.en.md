# XD11CC Single Web

[中文](./README.md) | **English**

Frontend application for the XD11CC Multi-Tenant SaaS Management Platform. Built with Vue 3, TypeScript, and Element Plus.

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Vue 3.5 + TypeScript |
| Build Tool | Vite 7 |
| UI Library | Element Plus |
| State Management | Pinia 3 |
| Router | Vue Router 4 |
| HTTP Client | Axios |
| Styling | Sass + CSS Variables (Obsidian 3-layer design tokens) |
| Icons | Iconify (Lucide offline bundle) |
| Fonts | Outfit (Display) + DM Sans (Body) |
| Charts | ECharts 6 + Vue-ECharts |
| Code Highlight | Highlight.js |
| Realtime | WebSocket (heartbeat + exponential backoff reconnection) |
| Formatting | Prettier |

## Features

### Layout System
- **Multiple Layout Modes** — Left sidebar / Top navigation / Left + Top hybrid, switchable via settings panel
- **Dynamic Theme** — Dark/Light toggle with View Transition API circular reveal animation
- **Responsive Design** — Adaptive drawer-style sidebar on mobile
- **Tags View** — Multi-tab navigation with context menu (refresh/close/close others/close all)
- **Breadcrumb** — Auto-generated from route hierarchy
- **Fullscreen Toggle** — One-click fullscreen via Screenfull
- **Page Transitions** — Route-level slide-fade animations

### Authentication
- **Password Login** — Username + password + CAPTCHA
- **SMS Login** — Phone number + verification code
- **Social Login** — OAuth2 third-party providers (GitHub, WeChat, QQ)
- **Register & Forgot Password** — Full user lifecycle
- **Account Binding** — Link social accounts to existing users
- **QR Code Login** — Scan-to-login support

### System Management

| Module | Features |
|------|------|
| User Management | CRUD, department tree filter, role assignment, column config (drag/hide/persist) |
| Role Management | CRUD, permission assignment (menu + button level) |
| Menu Management | Dynamic menu tree, button permission binding, icon picker |
| Department Management | Tree structure CRUD |
| Post Management | CRUD |
| Dictionary Management | Type + data two-level dictionary with cache support |
| System Config | Key-value parameter management |
| Notices | Announcement publishing, WebSocket real-time push |
| User Notices | Personal notification inbox |
| Scheduled Jobs | Job CRUD, visual Cron expression generator, execution log viewer |
| Login Log | Login record query and audit |
| Online Users | Online user monitoring, force logout |
| Operation Log | Operation audit record query |
| Auth Clients | OAuth2 client configuration management |

### Dashboard
- **Data Visualization** — ECharts line chart (visit trends), donut chart (traffic sources), bar chart (weekly overview)
- **Stat Cards** — Key metrics overview
- **Quick Actions** — Frequently-used feature grid
- **Recent Activity** — Operation timeline
- **Theme-Adaptive** — Chart colors follow light/dark theme

### Realtime Communication
- **Global Chat** — Contact list, messaging, unread badges, online status
- **Push Notifications** — WebSocket real-time notification panel (NEW_NOTICE / REVOKE_NOTICE)
- **Heartbeat** — Auto PING/PONG keep-alive
- **Reconnection** — Exponential backoff strategy, up to 10 retries

### Highlights
- **Command Palette (⌘K)** — Global page search with keyboard navigation
- **Skeleton Screens** — Multiple variants (page/table/list/card) with shimmer animation
- **Table Column Config** — Drag reorder, toggle visibility, width adjustment, localStorage persistence
- **Watermark** — Canvas SVG watermark with MutationObserver/ResizeObserver tamper-proofing
- **Cron Generator** — Visual Cron expression builder
- **Icon Picker** — Iconify-based icon selection popup

### Infrastructure
- **Permission Directive** — `v-permission` for element-level access control
- **Dynamic Routing** — Backend menu data-driven, filtered by role
- **Route Guards** — Authentication + permission checks with NProgress bar
- **Request Interceptor** — Unified error handling, Bearer Token injection, timeout alerts
- **Cache Abstraction** — Typed Cookie / LocalStorage utilities
- **Dictionary Cache** — Frontend dictionary caching, auto-load on component mount

## Project Structure

```
src/
├── common/
│   ├── assets/styles/          # Style system (themes, variables, layouts, Element Plus overrides)
│   ├── components/             # Shared components
│   │   ├── Chat/               # Chat panel (contacts + message area)
│   │   ├── CronGenerator/      # Cron expression builder
│   │   ├── IconSelect/         # Icon picker
│   │   ├── IFrame/             # Iframe wrapper
│   │   ├── MenuIcon/           # Menu icon renderer
│   │   ├── Notify/             # WebSocket notification panel
│   │   ├── Screenfull/         # Fullscreen toggle
│   │   ├── SearchMenu/         # Command Palette (⌘K)
│   │   ├── Skeleton/           # Skeleton screens
│   │   └── TableColumnSetting/ # Table column config
│   ├── composables/            # Shared hooks
│   │   ├── useChat.ts          # Chat logic
│   │   ├── useDevice.ts        # Device type detection
│   │   ├── useDict.ts          # Dictionary data loading
│   │   ├── useLayoutMode.ts    # Layout mode
│   │   ├── useOssUrl.ts        # OSS URL caching
│   │   ├── usePagination.ts    # Pagination params
│   │   ├── useRouteListener.ts # Route events
│   │   ├── useTableColumns.ts  # Table column config
│   │   ├── useTheme.ts         # Theme toggle
│   │   ├── useTitle.ts         # Dynamic page title
│   │   ├── useWatermark.ts     # Watermark system
│   │   └── useWebSocket.ts     # WebSocket lifecycle
│   ├── constants/              # Application constants
│   └── utils/                  # Utility functions
│       ├── cache/              # Cache utils (Cookie/LocalStorage)
│       ├── request.ts          # Axios wrapper
│       └── webSocket.ts        # WebSocket client
├── layouts/
│   ├── components/             # Layout building blocks
│   │   ├── AppMain/            # Main content area (keep-alive + transitions)
│   │   ├── Breadcrumb/         # Breadcrumb
│   │   ├── Footer/             # Footer
│   │   ├── Hamburger/          # Sidebar collapse toggle
│   │   ├── Logo/               # Logo
│   │   ├── NavigationBar/      # Top navigation bar
│   │   ├── Panel/              # Settings drawer
│   │   ├── Settings/           # Settings content
│   │   ├── Sidebar/            # Sidebar menu
│   │   ├── TagsView/           # Tab bar
│   │   └── ThemeToggle/        # Theme toggle button
│   └── modes/                  # Layout variants (Left/Top/LeftTop)
├── pinia/stores/               # State management
│   ├── app.ts                  # Sidebar + device state
│   ├── permission.ts           # Route permissions
│   ├── settings.ts             # Layout settings
│   ├── tags-view.ts            # Tab bar state
│   └── user.ts                 # User + Token
├── plugins/                    # Plugin registration
│   ├── iconify.ts              # Iconify icon sets
│   ├── permission-directive.ts # v-permission directive
│   └── hljs.ts                 # Highlight.js
├── router/                     # Route config & guards
│   ├── guard.ts                # Navigation guard
│   ├── helper.ts               # Route flattening utility
│   └── whitelist.ts            # Login-free whitelist
└── views/                      # Page views
    ├── dashboard/              # Dashboard
    ├── error/                  # 401, 404, 500 error pages
    ├── login/                  # Login, register, forgot password, social binding
    ├── monitor/druid/          # Druid database monitor
    ├── redirect/               # Route redirect
    ├── system/                 # System management (14 sub-modules)
    └── tool/generateCode/      # Code generator
```

## Getting Started

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
|------|------|
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

## Design System

The project includes the **Obsidian** design system with a three-layer token architecture:

| Layer | Description |
|------|------|
| Primitive tokens (`--p-*`) | Base values: colors, spacing, radii, typography, shadows, durations |
| Semantic tokens (`--theme-*`) | Light/dark themed aliases, bound to Element Plus CSS variables |
| Component tokens (`--btn-*`, `--card-*`, etc.) | Component-level variables for buttons, cards, inputs, sidebar, tags |

## Backend

This frontend works with [XD11CC Single Backend](../backend/xd11cc-single). The backend provides REST API, WebSocket service, OAuth2 authorization, dynamic routing, and more.

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | Last 2 versions |
| Firefox | Last 2 versions |
| Safari | Last 2 versions |
| Edge | Last 2 versions |
