# AGENTS.md — 项目索引

> **这份文件是给 AI 的项目速览**：读完这一页就该知道项目结构、关键机制、改动入口，不必先扫描全库。
> 面向人的上手教程见 `docs/开发手册.md`（示例与分步操作）。两者冲突时以本文件为准。

## 1. 项目是什么

Vue 3 + TypeScript 的后台管理系统前端，配套 Spring Boot 后端（不在本仓库）。

| 项          | 值                                                                                |
| ----------- | --------------------------------------------------------------------------------- |
| 框架        | Vue 3.5 `<script setup>` + Vite 7 + TypeScript 5.8                                |
| UI          | Element Plus 2.14（`package.json` 声明 `^2.10.2`，组件与 `ElMessage` 走自动导入） |
| 状态 / 路由 | Pinia 3、vue-router 4（动态路由，后端下发菜单）                                   |
| 国际化      | vue-i18n 11，`zh-CN` / `en-US` 双文件                                             |
| 其他        | axios、echarts 6、bpmn-js 18（流程设计器）                                        |
| 测试        | vitest 5 + @vue/test-utils + happy-dom，**390 用例 / 45 文件**                    |

接口约定：前缀 `/xd11cc`，统一响应 `ResponseVO{ code, msg, data }`，分页 `PageData{ rows, total }`（定义在 `types/api.d.ts`）。

## 2. 目录地图

| 路径                        | 职责                                                                                         | 入口文件                      |
| --------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------- |
| `src/views/`                | 业务页面，按域分包（system / bpm / approval / tool / monitor / login）                       | 每域 `index.vue` + `apis/`    |
| `src/common/components/`    | 跨域组件（useCrud / treeCrud 壳、Chat、Notify、Screenfull…）                                 | —                             |
| `src/common/composables/`   | 21 个组合式，按用途分五组（见下方说明）                                                      | —                             |
| `src/common/utils/`         | `request.ts`（请求封装）、`webSocket.ts`（连接状态机）、`page-error.ts`（错误分类）          | —                             |
| `vite/`                     | 构建期插件：`icon-subset.ts`（图标按需打包）                                                 | —                             |
| `src/common/apis/`          | 跨域接口：`file.ts`（`/file/upload`，返回可持久化的 `objectKey`）                            | —                             |
| `src/common/assets/styles/` | `themes.css` 三层令牌、`variables.css` 布局变量                                              | —                             |
| `src/layouts/`              | 布局外壳（LeftMode/TopMode/LeftTopMode）、导航、标签栏                                       | `layouts/index.vue`           |
| `src/pinia/stores/`         | 5 个 store：app / permission / settings / tags-view / user                                   | —                             |
| `src/router/`               | 公共路由 + 导航守卫 + 路由转换                                                               | `router/index.ts`、`guard.ts` |
| `src/i18n/locales/`         | 按域拆分的双语文案                                                                           | `locales/index.ts`            |
| `types/`                    | 全局类型（`api.d.ts`）+ 自动生成的 `types/auto/*`                                            | —                             |
| `tests/`                    | vitest 用例（不在 `tsconfig.include` 内，不影响类型检查）；`tests/concurrency/` 专盯异步时序 | `vitest.config.ts`            |

**`common/composables/` 分组**（文件名保持平铺，按名字搜索即可）：

| 组             | 文件                                                                                                         | 说明                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| 列表页壳       | `useCrud` `useTreeCrud` `useCrudDialog` `useEditHydration` `useTableColumns` `useCrudShellView` `crud-types` | 一套机制的零件，改壳时常一起改；`useCrudDialog` 是两者共用的弹窗生命周期 |
| 数据与基础设施 | `useDict` `useOssUrl` `useLatestRequest` `useLazyResource`                                                   | 字典映射 / OSS 地址 / 过期响应守卫 / 幂等懒加载                          |
| 布局与外观     | `useDevice` `useLayoutMode` `useTitle` `useTheme` `useWatermark` `useRouteListener`                          | 设备判断、布局模式、标题、主题、水印、路由监听                           |
| 实时与通信     | `useWebSocket` `useTodoQueue` `useChat`                                                                      | 连接状态机 → 待办弹窗 / 聊天                                             |
| 错误边界       | `usePageErrorBoundary`                                                                                       | 与 `utils/page-error.ts` 配套                                            |

> 这 21 个文件**不分子目录**：分类边界本身就是模糊的（`useDict` 算数据还是壳辅助？），
> 而平铺时「放哪」从不是问题。等文件数超过 30，或某一组超过 8 个，再按**消费方**拆
> 子目录（如 `crud/`、`realtime/`），不要按抽象类型拆。

## 3. 关键机制（改动前必读）

**动态路由**：`publicRoutes` + 后端 `GET /login/getRoutes` → `transformBackendRoutes`（拼 `Layout`、解析组件、把目录的 `noRedirect` 换成首个可见子页）→ `router.addRoute`。守卫用单飞 `permissionInitialization` 保证只初始化一次。菜单的 `route_name` 必须等于页面组件 `defineOptions({ name })`，否则标签栏缓存失效（现网 24 个页面已对齐）。

**列表页壳**：22 个表格页全部走壳——20 个用 `useCrud` + `UseCrudView`（其中 9 个 `readonly`），2 个树形页用 `useTreeCrud` + `TreeCrudView`；没有手写表格。

两个壳**只保留各自不同的部分**（表格主体、数据源、工具栏差异）；其余共享：
`common/components/crudShell/` 下的 `SearchCard`（搜索区）、`TableColumns`（生成列，会把页面的 `#cell-<prop>` 透传下去）、`FormDialog`（新增/修改弹窗，**内置重复提交与过期提交保护**；`submitDisabled` 只挡提交、`formDisabled` 连输入一起禁）；逻辑侧用 `useCrudDialog`（弹窗状态/会话号/提交守卫/删除确认）、`useCrudShellView`（列偏好 / `cell-*` 插槽转发 / 冷启动判定）与 `common/composables/crud-types.ts`（共享 option 字段 `BaseCrudOptions`、`CrudShellPropsBase`）。**加公共 prop 或改提交行为时改这些共享件，别只改一个壳。**

页面只提供 `pageApi`、表单字段与 `columns`；分页/搜索/弹窗/批量删除/列渲染由壳负责。

**壳的泛型**：`useCrud<Q, T>` / `useTreeCrud<Q, T>` 的 `Q`（查询条件）与 `T`（行类型）会一路传到 `slotProps` 和壳组件，所以 `#search-form="{ searchData }"` 的字段名写错会被 `vue-tsc` 抓到。新增页面时把 VO 类型传进去即可。例外：`#cell-<prop>` 的 `row` 来自 el-table 的插槽，仍是 `any`。

**bpmn-js 没有类型定义**：`views/bpm/modeler/bpmn-types.ts` 里手写了本项目用到的表面（`ServiceMap` / `BpmnElement` / `ModdleElement`），取服务请走 `getService('canvas')` 这类按名推导的写法，不要用 `modeler.get<any>(...)`。

壳的输出是 `slotProps`（`tableData` / `paginationData` / `handleAdd` …）。

两个壳共用**过期响应守卫** `useLatestRequest()`：`begin()` 让此前请求作废，`isCurrent(id)` 才允许写入数据/错误/loading，`onScopeDispose` 时整体失效。失败时不抛错，而是置 `tableError` / `treeError`，壳内渲染「数据加载失败 + 重试」（调 `slotProps.refresh()`），并隐藏分页避免用旧 total 误导。

列配置也是壳的一部分：页面传 `columns`（`TableColumnDef[]`）即由壳渲染列、管排序/显隐/列宽并持久化，单元格用 `#cell-<prop>` 覆盖，选择列与操作列分别放 `#table-prefix` / `#table-append`；现网 20 个列表页 + 2 个树形页（`dept` / `menu`）已全部接入；树形页的树列不参与列设置，固定在 `#table-prefix`。`columns` 为必填（少了它 `vue-tsc` 直接报错），壳里没有「页面自写列」的第二条路径。单元格全局 `nowrap + 省略号`，所以**生成列默认开启 `show-overflow-tooltip`**（`showOverflowTooltip: false` 可关）；树形页的树列在 `#table-prefix` 里自写，需要的话自行加该属性。

**冷启动**（加载中且无数据、非失败态）用 `Skeleton` 占位：列表壳与树表壳用 `variant="table"`，审批详情抽屉用 `variant="page"`；其余加载态仍用 `v-table-loading` 扫描线——有旧数据时保留数据，翻页不会整表消失。骨架自带 180ms 延迟，快接口不出骨架；行高已与 `el-table` 对齐（骨架 41px / 表格 40px）。

**弹窗会话号（唯一来源在 `useCrudDialog`，两个壳共用）**：每次打开/关闭弹窗都会递增，三处消费同一份：

- `slotProps.sessionId` —— `FormDialog` 用它挡「校验还没回来就关窗 / 连点」的重复提交；
- `onDialogOpen` 上下文里的 `session` —— 页面异步回填返回后用它判断结果是否过期；
- `crud.state.isCurrentSession(session)` / `crud.state.sessionId` —— 页面侧判定与取快照。

弹窗状态、会话号、提交守卫、删除确认都在 `common/composables/useCrudDialog.ts`；两个壳只保留自己不同的部分（分页 / 树 / parentRow / 批量删除）。

**提交锁按会话划分**（`FormDialog` 的 `lockedSession` + `useCrudDialog` 的 `submittingSession`）：同一个会话内连点只发一次请求；**会话切换后新弹窗不再继承旧请求的 loading，也不被旧请求阻塞**。两把锁都只在"锁还是自己这个会话"时才释放——否则旧请求收尾会把新会话的锁清掉。见 `tests/crud-dialog-lock.spec.ts`。

**不要自己再造会话计数器**，用记录 ID 判断也不够（同一条记录会被重新打开）。这套保护见 `tests/crud-dialog-session.spec.ts`。

**懒加载依赖**：需要「初次用时才拉、并发只发一次、失败可重试」的数据（菜单树、部门树、用户列表…）统一用 `common/composables/useLazyResource.ts` 的 `createLazyLoader`，不要手写 `let loaded` + `inflight` 那一套。需要等渲染的场景（ElTree 的 `setChecked`）把 `await nextTick()` 放进 loader 里，这样 `ensure()` 返回时节点已存在。

**编辑弹窗的关联数据回填**：角色/岗位/通知都需要「取依赖 → 应用历史关联 ID → 就绪后才能保存」，统一用 `common/composables/useEditHydration.ts`：

- `register(key, task)` 登记步骤，**全部成功才算 `ready`**——不要让某个分支自己把就绪标志置真（历史上就是这样把空权限提交上去的）；
- 步骤里的 `isCurrent()` 同时校验「未被新触发取代 + 会话未变 + 弹窗仍开」，**每次 `await` 之后都要重新判**；
- 抛错或返回 `false` 记为失败，页面用 `hydration.error` 显示提示条并调 `hydration.retry()`；
- **`retry()` 补跑所有「未确认」的步骤**：失败的和从未执行的（状态 `skipped`）都算，按登记顺序**串行**执行，前一步失败即停；**已成功（`ok`）的步骤不重跑**——否则详情步骤会把服务端数据重新覆盖到表单，用户重试前编辑的内容会丢；
- 依赖变化只需重跑某一步时用 `restart(key)`（如角色切换数据范围），期间 `ready` 自动回落；
- 由别的步骤顺带完成、不需在打开时单独跑的步骤用 `register(key, task, { runOnStart: false })`（如通知的发布范围选项）：打开时状态为 `skipped`（不阻塞就绪但不代表执行过），`retry()` 会真正补跑它；
- 页面里只为编辑拦截提交：`:submit-disabled="!hydration.ready && isEditing"`，新增不受影响；
- **每个步骤只重置自己负责的数据**：历史 bug 是「菜单」步骤顺手清了部门树勾选，重试菜单时把已回填的部门范围抹掉，保存即提交空 `deptIds`（后端先删后插 = 清空原权限）；
- 回填会整体覆盖表单的页面（如通知详情）要同时传 `:form-disabled="!hydration.ready && isEditing"`，否则用户先打的字会被迟到的响应冲掉。

见 `tests/edit-hydration.spec.ts` 与 `tests/concurrency/crud-shell-timing.spec.ts`。

**请求层**：`request.ts` 统一注入 token、401 并发去重（`handleUnauthorized` + `resetUnauthorizedHandling`）、默认超时 10s（长任务用 `LONG_REQUEST_TIMEOUT=60s`）、错误文案本地化。业务码非 200 直接 reject。

**字典**：后端 `system_dict_data` 的 `label` 是**展示文案**、`value` 是**编码**；映射写成 `map[value] = label`，`getDictItem(type, code)` 按 `value` 匹配。

**主题**：三层令牌 `--p-*`（原始值）→ `--theme-*`（语义）→ 组件变量。页面禁止裸色值/裸尺寸。

**实时推送**：`webSocket.ts`（连接/心跳/指数退避/可见性恢复）→ `useWebSocket` → `useTodoQueue`（待办弹窗）、`useChat`（聊天）、Notify 组件。

**重连时的旧连接事件**：`connect()` 会先 close 旧客户端再建新的，而浏览器的 close/error 事件是**异步派发**的，可能在新连接建立之后才到。若旧客户端照常写状态，就会把「已连接」覆盖成「已断开」。三道防线缺一不可：`close()` 之后 `onclose`/`onerror` 直接 return（手动关闭已上报过）、`close()` 解绑 `onStatusChange`、`useWebSocket` 的状态回调校验 `wsClient === client`。见 `tests/websocket-status.spec.ts`。

**聊天会话**：聊天数据只驻留内存。`Chat` 随布局卸载时调用 `useChat.destroy()`，清空消息/联系人/未读/选中项/面板状态并解除监听；`refreshOnlineUsers` 用「会话版本 + 当前 userId」双重校验丢弃过期响应，避免换账号后读到上一个人的会话。

**页面错误边界**：`usePageErrorBoundary(scope)`（`AppMain` 与 `layouts/index.vue` 共用）+ `utils/page-error.ts` 的 `shouldShowPageError`。**只有**资源/动态模块加载失败与 `setup`/`render` 自身抛错才整页兜底；接口失败、事件处理器里未捕获的 rejection 只打日志、页面保持可用。改这块前先看 `tests/page-error.spec.ts`。

**图标按需加载**：`vite/icon-subset.ts` 在构建期扫描源码里出现的 `lucide:x` / `ep:x`，只把用到的图标打进 `virtual:icon-subset`（入口同步注册）；后端菜单等运行时才知道的名字走 `AppIcon`（`common/components/AppIcon/`），它先 `ensureIconCollection` 懒加载完整集合（`virtual:icon-full-<prefix>`，按前缀分 chunk），再渲染。**新增图标不需要登记**，写进模板即被扫到；图标选择器用 `virtual:icon-names` 只取名字。

**缓存键（`common/constants/cache-key.ts`）**：8 个键统一由 `${系统名}-${环境}-<用途>-key` 组成，**环境段必须用 `import.meta.env.MODE`**。Vite 只向客户端注入 `BASE_URL` / `MODE` / `DEV` / `PROD` / `SSR` 与 `VITE_` 开头的变量，**没有 `NODE_ENV`**（`.env` 里写 `NODE_ENV=` 不仅不生效，还会触发 Vite 告警）。`types/env.d.ts` 已开启 `strictImportMetaEnv`，写错键名会直接编译报错。改键等于一次性重置所有人的登录态与偏好设置。

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

## 4.1 异步写入的三条硬规则（改页面逻辑前必读）

这三条来自反复出现的「串数据」问题：构建、类型检查、常规单测都不会失败，但会写错数据。

1. **`await` 之后要写共享状态，判据必须重新取，且要能区分「两次操作」**
   - 比记录 ID 不够：同一条记录被重新打开时 ID 相同 → 用弹窗会话号（`onDialogOpen` 上下文里的 `session` + `crud.state.isCurrentSession`）
   - token 要在**发起请求前**捕获，不能在响应回调里取（那时可能已经换号）
2. **提交前必须确认依赖数据已就绪，而不是「快好了」**
   - 多个异步回填时，用**全部完成**才算就绪的闸门；不要各分支分别把同一个标志置真
   - 等数据赋值不够，还要等渲染（Element Plus 的树要 `await nextTick()` 后 `setChecked` 才生效）
3. **同一操作要幂等**：连点、重试、重复进入都不能写两遍（提交、未读计数、上传回填都属于此类）

改动涉及「打开弹窗后异步回填」「保存前校验」「跨会话的登录态」时，跑一遍 `tests/concurrency/`；
那组用例失败即表示时序保证被破坏。

## 5. 验证命令

| 命令                            | 作用                                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `pnpm dev`                      | 开发服务器（`.env.dev`）                                                                                                 |
| `pnpm typecheck`                | `vue-tsc --noEmit`                                                                                                       |
| `pnpm test:unit`                | vitest 全量，45 文件 / 390 用例（约 6s）；`test:unit:watch` 为监听模式                                                   |
| `pnpm build`                    | **已串联** `typecheck → test:unit → vite build`，任一失败即中断                                                          |
| `pnpm build:dev` / `build:test` | 只打包，不跑测试                                                                                                         |
| `pnpm format`                   | Prettier 格式化 `src/`                                                                                                   |
| `pnpm size`                     | 打包体积守门：断言入口不含 `element-plus-*.js`、不含只在个别页面用的重型依赖、无未引用 EP 组件、首屏不超预算（需先构建） |

## 5.1 打包体积红线（改 `vite.config.ts` / 插件注册前必读）

`manualChunks` 的**数组/对象写法会把列出的包当作 chunk 入口**，而 Rollup 对 chunk 入口的导出**不做 tree-shaking**。`element-plus/es/index.mjs` 是 re-export 全部 91 个组件的 barrel，一旦成为 chunk 入口就会整包保留——实测登录页首屏 **273KB → 500KB（gzip）**，源码从未引用的 `tour` / `cascader` / `table-v2` / `color-picker` 全被打进去。

- **不要把 `element-plus` 写进 `manualChunks`**（改函数式写法同样无效，必须完全不干预）；
- `vendor`（vue 系）与 `echarts` 两条可以保留：它们本身就是独立依赖，且 echarts 只在 `/dashboard` 懒加载；
- **只服务个别页面的重型依赖不要全局注册**（在 `installPlugins` 里注册等于写进入口）。highlight.js 曾这样被塞进入口（raw 117KB / gzip 33KB），现改为随 `CodeBlock.vue` 懒加载；
- 验证方式：`pnpm build && pnpm size`（该脚本会直接断言上述红线，见 `scripts/check-bundle-size.mjs`）。

**图标**：菜单图标由后端 `meta.icon` 下发，构建期扫不到源码里。`vite/icon-subset.ts` 的 `RUNTIME_ICONS` 登记了这批名字——**不登记也能用**：`AppIcon` 会降级为懒加载完整集合（lucide 80.5KB + ep 30.2KB，gzip），只是慢。想让某个图标进首屏就加进去（当前 16 个约 2KB）。注意这批名字进的是 `buildSubset` 而非 `scanIconNames`（后者契约是「只抓源码字面量」，由 `tests/icon-scan.spec.ts` 锁住）。

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
11. **`<script setup>` 局部注册必须用 PascalCase 名**：`import { HighlightjsComponent as Highlightjs }` 生效，写成小写映射（`const components = { highlightjs: ... }`）**不报错**，但 `<highlightjs>` 会原样留在 DOM 里、代码不高亮。
12. **`require: true` 是无效的 prop 选项**：正确写法是 `required: true`。写错不会运行时报错，但类型检查拿不到必填约束（`CodeBlock` 踩过，改成局部注册后由 `vue-tsc` 暴露）。
13. **`import.meta.env.NODE_ENV` 在 Vite 里不存在**：只会得到 `undefined`，键名悄悄变成 `管理后台-undefined-token-key`（缓存键踩过）。**单测抓不到**——vitest 会把整个 `process.env` 铺进 `import.meta.env`，那里 `NODE_ENV` 恰好等于 `'test'`。要用 `MODE`，并靠 `strictImportMetaEnv` + 源码级断言兜住。
14. **`.env` 里的 `NODE_ENV` 不只是无效，还有副作用**：Vite 会把它读成构建模式信号（`VITE_USER_NODE_ENV`）并在三种 mode 下都告警。设 `NODE_ENV=development` 会真的产出开发版构建。

## 7. 复杂度热点

`views/system/user/profile` (1148) · `approval/components/ApprovalDetailDrawer` (862) · `views/bpm/modeler/index` (837) · `views/dashboard` (701) · `views/system/notice` (688) · `views/bpm/definition` (627)。改动这些文件前先读现有结构，不要顺手重构。
