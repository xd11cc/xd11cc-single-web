# XD11CC Single Web - SaaS Admin Frontend

The frontend application for XD11CC Multi-Tenant SaaS Management Platform. Built with Vue 3, TypeScript, and Element Plus.

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Vue 3.5 + TypeScript |
| Build Tool | Vite 7 |
| UI Library | Element Plus |
| State Management | Pinia 3 |
| Router | Vue Router 4 |
| HTTP Client | Axios |
| Styling | Sass + CSS Variables |
| Icons | Iconify (Element Plus + Lucide) |
| I18n | Vue I18n |
| Code Highlight | Highlight.js |
| Formatting | Prettier |

## Features

### Layout System
- **Multiple Layout Modes** — Left sidebar / Top navigation / Left + Top combination
- **Dynamic Theme** — Light/Dark mode toggle with CSS variables
- **Responsive Design** — Adaptive sidebar collapse on mobile
- **Tags View** — Multi-tab navigation with scroll pane
- **Breadcrumb** — Auto-generated from route hierarchy

### Authentication
- **Password Login** — Username + password + CAPTCHA
- **Phone SMS Login** — Mobile verification code
- **QR Code Login** — Scan to login
- **Social Login** — OAuth2 third-party providers (GitHub, WeChat, etc.)
- **Register & Forget Password** — Complete user lifecycle

### System Management
- **User Management** — CRUD, profile editing, role assignment
- **Menu Management** — Dynamic menu tree with permission binding
- **Dictionary Management** — Type + data two-level dictionary
- **System Config** — Key-value configuration management

### Developer Tools
- **Code Generator** — Preview generated code with syntax highlighting
- **Druid Monitor** — Embedded database monitoring panel (iframe)

### Infrastructure
- **Permission Directive** — `v-permission` for element-level access control
- **Dynamic Routing** — Routes generated from backend menu data
- **Route Guards** — Authentication + permission check on navigation
- **WebSocket Client** — Real-time notification via Netty WebSocket
- **Request Interceptor** — Unified error handling, token refresh, loading state
- **Local Storage Abstraction** — Typed cache utilities (Cookie, LocalStorage)

## Project Structure

```
src/
├── common/
│   ├── assets/           # Static resources (images, styles)
│   ├── components/       # Shared components
│   │   ├── IFrame/       # Iframe wrapper
│   │   ├── IconSelect/   # Icon picker
│   │   ├── MenuIcon/     # Menu icon renderer
│   │   ├── Notify/       # Notification panel
│   │   ├── Screenfull/   # Fullscreen toggle
│   │   └── SearchMenu/   # Menu search dialog
│   ├── composables/      # Shared composables (hooks)
│   ├── constants/        # Application constants
│   └── utils/
│       ├── cache/        # Cookie & LocalStorage utils
│       ├── request.ts    # Axios instance & interceptors
│       ├── validate.ts   # Form validators
│       └── webSocket.ts  # WebSocket client
├── layouts/
│   ├── components/       # Layout building blocks
│   │   ├── AppMain/      # Main content area
│   │   ├── Breadcrumb/   # Breadcrumb navigation
│   │   ├── Hamburger/    # Sidebar toggle
│   │   ├── Logo/         # App logo
│   │   ├── NavigationBar/# Top navigation bar
│   │   ├── Settings/     # Layout settings panel
│   │   ├── Sidebar/      # Side navigation menu
│   │   ├── TagsView/     # Multi-tab navigation
│   │   └── ThemeToggle/  # Dark/Light mode switch
│   ├── modes/            # Layout mode variants
│   │   ├── LeftMode.vue
│   │   ├── TopMode.vue
│   │   └── LeftTopMode.vue
│   └── composables/      # Layout-specific hooks
├── pinia/stores/
│   ├── app.ts            # App state (sidebar, device)
│   ├── permission.ts     # Dynamic routes & permissions
│   ├── settings.ts       # Layout & theme settings
│   ├── tags-view.ts      # Multi-tab state
│   └── user.ts           # User auth state
├── plugins/
│   ├── hljs.ts           # Highlight.js setup
│   ├── iconify.ts        # Icon registration
│   └── permission-directive.ts  # v-permission directive
├── router/
│   ├── config.ts         # Static routes
│   ├── guard.ts          # Navigation guards
│   ├── helper.ts         # Route generation helpers
│   └── whitelist.ts      # Public routes (no auth)
└── views/
    ├── dashboard/        # Home dashboard
    ├── error/            # 401, 404, 500 pages
    ├── login/            # Login page + forms
    ├── monitor/          # Druid SQL monitor
    ├── system/           # Admin pages (user, menu, dict, config)
    └── tool/             # Code generator
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Install Dependencies

```bash
pnpm install
```

### Development

```bash
# Development environment
pnpm dev

# Test environment
pnpm test

# Production environment
pnpm prod
```

The app runs at `http://localhost:5173` by default.

### Build

```bash
# Production build
pnpm build

# Development build
pnpm build:dev

# Test build
pnpm build:test
```

Output is in the `dist/` directory.

## Environment Configuration

| File | Environment | API Base URL |
|------|-------------|-------------|
| `.env.dev` | Development | `http://localhost:10001/xd11cc` |
| `.env.test` | Testing | Configured per deployment |
| `.env.prod` | Production | Configured per deployment |

## Backend

This frontend works with the [XD11CC Single Backend](../backend/xd11cc-single). See the backend README for API documentation and setup instructions.

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | Last 2 versions |
| Firefox | Last 2 versions |
| Safari | Last 2 versions |
| Edge | Last 2 versions |
