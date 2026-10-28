# Repository Guidelines

## Project Structure & Module Organization

This repository is a Vue 3 + TypeScript admin frontend powered by Vite and Element Plus.

- `src/views/` contains feature pages, grouped by domain (`system`, `bpm`, `login`, etc.). Keep API types and request functions beside each feature in `apis/`.
- `src/common/` contains reusable components, composables, utilities, and design-system styles.
- `src/layouts/` contains shell layouts and navigation components; `src/pinia/` contains shared stores.
- `src/router/` defines routes and navigation guards; `src/i18n/` contains localized messages.
- `public/` contains static files; `types/` contains global declarations and API types.

## Build, Test, and Development Commands

Use pnpm and keep `pnpm-lock.yaml` in sync.

- `pnpm dev` — start the Vite development server using `.env.dev`.
- `pnpm test` — start Vite with the test environment (`.env.test`); this is an environment smoke run, not a unit-test suite.
- `pnpm build:dev` — validate a development build.
- `pnpm build:test` / `pnpm build` — build test or production assets.
- `pnpm preview` — serve the latest build locally.
- `pnpm format` — format files under `src/` with Prettier.

Run at least the relevant build command before opening a pull request.

## Coding Style & Naming Conventions

Use two-space indentation, single quotes in TypeScript, and semicolons only where existing code requires them. Use Vue 3 `<script setup lang="ts">`, composables named `useX`, PascalCase component filenames, and camelCase variables/functions. Keep feature-specific API types in `apis/type.ts`, request functions in `apis/index.ts`, and user-facing strings in both locale files. Prefer existing theme variables and shared components over page-local styling.

## Testing Guidelines

No unit-test framework or coverage threshold is currently configured. Validate changes with the appropriate Vite build, inspect affected routes manually, and verify both light/dark themes and supported locales when UI or i18n code changes.

## Commit & Pull Request Guidelines

Recent commits are short, task-focused messages (often Chinese), such as `修复路由跳转问题` and `整合BPM编辑器，修复部分bug`. Follow the same concise style: describe one logical change per commit. Pull requests should explain the behavior change, list affected routes/files, include screenshots or recordings for UI changes, mention validation commands, and call out configuration or API contract changes.

## Configuration & Security

Use `.env.dev`, `.env.test`, and `.env.prod` for environment-specific values; never commit secrets. Preserve existing request wrappers, permission directives, and route guards when adding pages or API calls.
