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
| Styling | Sass + CSS Variables (3-layer design tokens) |
| Icons | Iconify (Lucide offline bundle) |
| Fonts | Outfit (Display) + DM Sans (Body) |
| Charts | ECharts + Vue-ECharts |
| Code Highlight | Highlight.js |
| Formatting | Prettier |

## Features

### Layout System
- **Multiple Layout Modes** — Left sidebar / Top navigation / Left + Top hybrid
- **Dynamic Theme** — Dark/Light toggle with View Transition API circular reveal
- **Responsive Design** — Adaptive sidebar collapse on mobile
- **Tags View** — Multi-tab navigation with context menu (refresh/close/close others/close all)
- **Breadcrumb** — Auto-generated from route hierarchy
- **Page Transitions** — Route-level slide-fade animations

### Authentication
- **Password Login** — Username + password + CAPTCHA
- **SMS Login** — Phone number + verification code
- **Social Login** — OAuth2 third-party providers (GitHub, WeChat, etc.)
- **Register & Forgot Password** — Full user lifecycle
- **Account Binding** — Link social accounts to existing users

### System Management
- **User Management** — CRUD, department tree filter, role assignment, column config (drag/show-hide/persist)
- **Menu Management** — Dynamic menu tree with permission binding
- **Dictionary Management** — Type + data two-level dictionary
- **System Config** — Key-value parameter management

### Developer Tools
- **Code Generator** — Preview generated code with syntax highlighting
- **Druid Monitor** — Embedded database monitoring panel

### Highlights
- **Command Palette (⌘K)** — Global page search with keyboard navigation
- **ECharts Visualization** — Dashboard with line/pie/bar charts, theme-adaptive
- **Skeleton Screens** — Multiple variants (page/table/list/card) with shimmer animation
- **Table Column Config** — Drag reorder, toggle visibility, width persistence via localStorage

### Infrastructure
- **Permission Directive** — `v-permission` for element-level access control
- **Dynamic Routing** — Routes generated from backend menu data
- **Route Guards** — Authentication + permission checks on navigation
- **WebSocket** — Real-time communication via Netty WebSocket
- **Request Interceptor** — Unified error handling, token injection, timeout alerts
- **Cache Abstraction** — Typed Cookie / LocalStorage utilities

## Project Structure

```
src/
├── common/
│   ├── assets/           # Static resources (styles, fonts)
│   ├── components/       # Shared components
│   │   ├── IFrame/       # Iframe wrapper
│   │   ├── IconSelect/   # Icon picker
│   │   ├── Notify/       # Notification panel
│   │   ├── Screenfull/   # Fullscreen toggle
│   │   ├── SearchMenu/   # Command Palette (⌘K)
│   │   ├── Skeleton/     # Skeleton screens
│   │   └── TableColumnSetting/ # Table column config UI
│   ├── composables/      # Shared hooks
│   ├── constants/        # Application constants
│   └── utils/            # Utility functions
├── layouts/
│   ├── components/       # Layout building blocks
│   └── modes/            # Layout variants (Left/Top/LeftTop)
├── pinia/stores/         # State management
├── plugins/              # Plugin registration
├── router/               # Route config & guards
└── views/                # Page views
    ├── dashboard/        # Dashboard (ECharts)
    ├── error/            # 401, 404, 500 error pages
    ├── login/            # Login-related pages
    ├── system/           # System management
    └── tool/             # Developer tools
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
# Development environment
pnpm dev

# Test environment
pnpm test

# Production environment
pnpm prod
```

Runs at `http://localhost:20001` by default.

### Build

```bash
# Production build
pnpm build

# Development build
pnpm build:dev

# Test build
pnpm build:test
```

Output goes to the `dist/` directory.

## Environment Configuration

| File | Environment | API Base URL |
|------|-------------|-------------|
| `.env.dev` | Development | `http://localhost:10001/xd11cc` |
| `.env.test` | Testing | Per deployment config |
| `.env.prod` | Production | Per deployment config |

## Backend

This frontend works with [XD11CC Single Backend](../backend/xd11cc-single).

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | Last 2 versions |
| Firefox | Last 2 versions |
| Safari | Last 2 versions |
| Edge | Last 2 versions |
