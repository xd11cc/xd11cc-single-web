# AGENTS.md — 项目索引

> **这份文件是给 AI 的项目速览**：读完这一页就该知道项目结构、关键机制、改动入口，不必先扫描全库。
> 面向人的上手教程见 `docs/开发手册.md`（示例与分步操作）。两者冲突时以本文件为准。

## 1. 项目是什么

Vue 3 + TypeScript 的后台管理系统前端，配套 Spring Boot 后端（不在本仓库）。

| 项          | 值                                                             |
| ----------- | -------------------------------------------------------------- |
| 框架        | Vue 3.5 `<script setup>` + Vite 7 + TypeScript 5.8             |
| UI          | Element Plus 2.10（组件与 `ElMessage` 走自动导入）             |
| 状态 / 路由 | Pinia 3、vue-router 4（动态路由，后端下发菜单）                |
| 国际化      | vue-i18n 11，`zh-CN` / `en-US` 双文件                          |
| 其他        | axios、echarts 6、bpmn-js 18（流程设计器）                     |
| 测试        | vitest 5 + @vue/test-utils + happy-dom，**247 用例 / 26 文件** |

接口约定：前缀 `/xd11cc`，统一响应 `ResponseVO{ code, msg, data }`，分页 `PageData{ rows, total }`（定义在 `types/api.d.ts`）。

## 2. 目录地图

| 路径                        | 职责                                                                                                       | 入口文件                      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `src/views/`                | 业务页面，按域分包（system / bpm / approval / tool / monitor / login）                                     | 每域 `index.vue` + `apis/`    |
| `src/common/components/`    | 跨域组件（useCrud / treeCrud 壳、Chat、Notify、Screenfull…）                                               | —                             |
| `src/common/composables/`   | 16 个组合式：useCrud、useTreeCrud、useDict、useChat、useWebSocket、usePageErrorBoundary、useLatestRequest… | —                             |
| `src/common/utils/`         | `request.ts`（请求封装）、`webSocket.ts`（连接状态机）、`page-error.ts`（错误分类）                        | —                             |
| `vite/`                     | 构建期插件：`icon-subset.ts`（图标按需打包）                                                               | —                             |
| `src/common/apis/`          | 跨域接口：`file.ts`（`/file/upload`，返回可持久化的 `objectKey`）                                          | —                             |
| `src/common/assets/styles/` | `themes.css` 三层令牌、`variables.css` 布局变量                                                            | —                             |
| `src/layouts/`              | 布局外壳（LeftMode/TopMode/LeftTopMode）、导航、标签栏                                                     | `layouts/index.vue`           |
| `src/pinia/stores/`         | 5 个 store：app / permission / settings / tags-view / user                                                 | —                             |
| `src/router/`               | 公共路由 + 导航守卫 + 路由转换                                                                             | `router/index.ts`、`guard.ts` |
| `src/i18n/locales/`         | 按域拆分的双语文案                                                                                         | `locales/index.ts`            |
| `types/`                    | 全局类型（`api.d.ts`）+ 自动生成的 `types/auto/*`                                                          | —                             |
| `tests/`                    | vitest 用例（不在 `tsconfig.include` 内，不影响类型检查）                                                  | `vitest.config.ts`            |

## 3. 关键机制（改动前必读）

**动态路由**：`publicRoutes` + 后端 `GET /login/getRoutes` → `transformBackendRoutes`（拼 `Layout`、解析组件、把目录的 `noRedirect` 换成首个可见子页）→ `router.addRoute`。守卫用单飞 `permissionInitialization` 保证只初始化一次。菜单的 `route_name` 必须等于页面组件 `defineOptions({ name })`，否则标签栏缓存失效（现网 24 个页面已对齐）。

**列表页壳**：22 个表格页全部走壳——20 个用 `useCrud` + `UseCrudView`（其中 9 个 `readonly`），2 个树形页用 `useTreeCrud` + `TreeCrudView`；没有手写表格。页面只提供 `pageApi`、表单字段与 `columns`；分页/搜索/弹窗/批量删除/列渲染由壳负责。壳的输出是 `slotProps`（`tableData` / `paginationData` / `handleAdd` …）。

两个壳共用**过期响应守卫** `useLatestRequest()`：`begin()` 让此前请求作废，`isCurrent(id)` 才允许写入数据/错误/loading，`onScopeDispose` 时整体失效。失败时不抛错，而是置 `tableError` / `treeError`，壳内渲染「数据加载失败 + 重试」（调 `slotProps.refresh()`），并隐藏分页避免用旧 total 误导。

列配置也是壳的一部分：页面传 `columns`（`TableColumnDef[]`）即由壳渲染列、管排序/显隐/列宽并持久化，单元格用 `#cell-<prop>` 覆盖，选择列与操作列分别放 `#table-prefix` / `#table-append`；现网 20 个列表页 + 2 个树形页（`dept` / `menu`）已全部接入；树形页的树列不参与列设置，固定在 `#table-prefix`。`columns` 为必填（少了它 `vue-tsc` 直接报错），壳里没有「页面自写列」的第二条路径。单元格全局 `nowrap + 省略号`，所以**生成列默认开启 `show-overflow-tooltip`**（`showOverflowTooltip: false` 可关）；树形页的树列在 `#table-prefix` 里自写，需要的话自行加该属性。

**冷启动**（加载中且无数据、非失败态）用 `Skeleton` 占位：列表壳与树表壳用 `variant="table"`，审批详情抽屉用 `variant="page"`；其余加载态仍用 `v-table-loading` 扫描线——有旧数据时保留数据，翻页不会整表消失。骨架自带 180ms 延迟，快接口不出骨架；行高已与 `el-table` 对齐（骨架 41px / 表格 40px）。

树形壳另有**弹窗会话**保护：`dialogSessionId` 记录打开/关闭次数，提交前校验「会话未变 + 表单仍是同一对象」，旧弹窗的校验或保存不会关掉重新打开的表单；提交与删除都自行接住拒绝，不产生未处理的 rejection。

**请求层**：`request.ts` 统一注入 token、401 并发去重（`handleUnauthorized` + `resetUnauthorizedHandling`）、默认超时 10s（长任务用 `LONG_REQUEST_TIMEOUT=60s`）、错误文案本地化。业务码非 200 直接 reject。

**字典**：后端 `system_dict_data` 的 `label` 是**展示文案**、`value` 是**编码**；映射写成 `map[value] = label`，`getDictItem(type, code)` 按 `value` 匹配。

**主题**：三层令牌 `--p-*`（原始值）→ `--theme-*`（语义）→ 组件变量。页面禁止裸色值/裸尺寸。

**实时推送**：`webSocket.ts`（连接/心跳/指数退避/可见性恢复）→ `useWebSocket` → `useTodoQueue`（待办弹窗）、`useChat`（聊天）、Notify 组件。

**聊天会话**：聊天数据只驻留内存。`Chat` 随布局卸载时调用 `useChat.destroy()`，清空消息/联系人/未读/选中项/面板状态并解除监听；`refreshOnlineUsers` 用「会话版本 + 当前 userId」双重校验丢弃过期响应，避免换账号后读到上一个人的会话。

**页面错误边界**：`usePageErrorBoundary(scope)`（`AppMain` 与 `layouts/index.vue` 共用）+ `utils/page-error.ts` 的 `shouldShowPageError`。**只有**资源/动态模块加载失败与 `setup`/`render` 自身抛错才整页兜底；接口失败、事件处理器里未捕获的 rejection 只打日志、页面保持可用。改这块前先看 `tests/page-error.spec.ts`。

**图标按需加载**：`vite/icon-subset.ts` 在构建期扫描源码里出现的 `lucide:x` / `ep:x`，只把用到的图标打进 `virtual:icon-subset`（入口同步注册）；后端菜单等运行时才知道的名字走 `AppIcon`（`common/components/AppIcon/`），它先 `ensureIconCollection` 懒加载完整集合（`virtual:icon-full-<prefix>`，按前缀分 chunk），再渲染。**新增图标不需要登记**，写进模板即被扫到；图标选择器用 `virtual:icon-names` 只取名字。

**文件上传**：`common/apis/file.ts` 的 `uploadFile` 走 `POST /file/upload`（multipart，60s 超时），返回 `fileId` / `objectKey` / `previewUrl`。**要持久化的引用一律存 `objectKey`**——`previewUrl` 是预签名地址，2 小时过期且指向内网 endpoint。头像即 `headUrl = objectKey`，渲染时拼 `ossUrl`。

**BPM 设计器**：`views/bpm/modeler/` —— `index.vue`（外壳）→ `BpmnDesigner`（bpmn-js 建模）→ `PropertyPanel`（分派）→ `BasicSection` / `UserTaskPanel` / `SequenceFlowPanel` / `ServiceTaskPanel` / `MetadataSection` / `ListenerSection`+`ListenerDialog`；数据转换在 `useElementForm.ts`（元素读写桥）与 `listener-io.ts`（监听器序列化）。审批侧读写模型在 `views/approval/composables/`。

## 4. 常见任务从哪下手

| 想做的事                      | 起点                                                                    |
| ----------------------------- | ----------------------------------------------------------------------- |
| 新增一个列表页                | 复制任一 `useCrud` 页面 → `apis/` 加请求与类型 → 菜单表加记录           |
| 改请求行为（token/超时/错误） | `src/common/utils/request.ts`                                           |
| 改菜单/路由转换               | `src/pinia/stores/permission.ts`、`src/router/route-redirect.ts`        |
| 加文案                        | `src/i18n/locales/<域>/…`，zh 与 en 同步                                |
| 改主题色/暗色                 | `src/common/assets/styles/themes.css`                                   |
| 加全局组件/指令               | `src/common/components/`、`src/plugins/`（每个指令一个文件）            |
| 接文件上传 / 头像             | `src/common/apis/file.ts` → 存 `objectKey`；头像再调 `updateUserAvatar` |

## 5. 验证命令

| 命令                            | 作用                                                                   |
| ------------------------------- | ---------------------------------------------------------------------- |
| `pnpm dev`                      | 开发服务器（`.env.dev`）                                               |
| `pnpm typecheck`                | `vue-tsc --noEmit`                                                     |
| `pnpm test:unit`                | vitest 全量，26 文件 / 247 用例（约 4s）；`test:unit:watch` 为监听模式 |
| `pnpm build`                    | **已串联** `typecheck → test:unit → vite build`，任一失败即中断        |
| `pnpm build:dev` / `build:test` | 只打包，不跑测试                                                       |
| `pnpm format`                   | Prettier 格式化 `src/`                                                 |

## 6. 静默失败陷阱（写错不报错，运行时才炸）

1. **多根节点白屏**：页面模板必须有且仅有一个根节点（壳外再包 `<transition out-in>` 时尤其致命）。
2. **i18n 单花括号**：模板必须 `{{ $t(...) }}`，写成 `{ $t(...) }` 会原样渲染。
3. **字典写反**：`map[label] = value` 不报错，但下拉会显示编码。
4. **组件 name ≠ route_name**：标签栏缓存静默失效。
5. **`keep-alive` 缓存条件**：`route_name`=组件 `name` → 转换层 `meta.keepAlive` → tags-view 记 `cachedViews` → `AppMain` 的 `include` 命中，四环缺一不可。
6. **`storage.getItem` 已反序列化**：再 `JSON.parse` 会在空数组时抛 `Unexpected end of JSON input`。
7. **`:deep()` 只在 scoped 样式生效**：全局样式里会被丢弃（属性面板掉样式踩过）。
8. **`el-form-item` 的 label 自带 `for`**：点击标签会抢焦点，面板里用 `pointer-events: none` 收窄。
9. **`onErrorCaptured` 会收到异步事件处理器的 rejected promise**：无条件接管会把「接口失败」渲染成「页面渲染失败」，必须走 `shouldShowPageError` 分类。
10. **存预签名 URL 会过期**：上传结果里能持久化的只有 `objectKey`。

## 7. 复杂度热点

`views/system/user/profile` (1137) · `approval/components/ApprovalDetailDrawer` (862) · `views/dashboard` (701) · `views/bpm/modeler/index` (689) · `views/bpm/definition` (636) · `views/system/notice` (517)。改动这些文件前先读现有结构，不要顺手重构。
