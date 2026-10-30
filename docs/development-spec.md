# 前端开发规范

> 本文是**上手教程**：讲这套项目里页面怎么写、为什么这么写，示例可以直接照抄。
> 硬性约束与项目索引见 `AGENTS.md`（两者冲突时以 `AGENTS.md` 为准）。
>
> 建议阅读顺序：§0 → §2（先判断表格形态）→ 对应章节的完整示例 → §11 提交前自查。

---

## 0. 开始之前

三条经验，能省掉大部分返工：

1. **能套壳就套壳** —— 列表页优先用 `UseCrudView` / `TreeCrudView`。这两套壳已经做好搜索区、分页、新增/编辑弹窗、删除确认、加载态和间距，手写一遍通常只是在重复它们（壳不适用的情况见 §3.3 手写表格）
2. **用设计令牌，不写裸值** —— 颜色、圆角、字号、间距、动效时长都有对应的 `--p-*` / `--theme-*`，换主题、切暗色时才不会漏改（§7）
3. **文案进 i18n** —— 用户可见文本放 `src/i18n/locales/`，中英两套同步改；只改一半，切到英文时会出现中英混排（§5）

这些点在 §11 有一份可逐项核对的自查表。

---

## 1. 目录与文件结构

```text
src/views/<domain>/<module>/
├── index.vue          # 页面
└── apis/
    ├── index.ts       # 请求函数
    └── type.ts        # 请求/响应类型
```

| 项           | 约定                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| 页面目录     | 小写，多单词用短横线（`expression-config`、`notice-user`）                    |
| 组件文件     | PascalCase（`PropertyPanel.vue`、`TodoPopup.vue`）                            |
| 公共组件     | 放 `src/common/components/<Name>/index.vue`                                   |
| 组合式函数   | 放 `src/common/composables/use<Name>.ts`，导出 `use<Name>()`                  |
| 请求函数命名 | `<module>Page` / `add<Module>` / `modify<Module>ById` / `remove<Module>ByIds` |

**组件 `name` 与后端菜单的 `route_name` 保持一致（区分大小写）**，这是标签栏缓存的匹配依据：`<keep-alive :include>` 按组件 `name` 命中，写差一个大小写不会报错，只是这一页的缓存悄悄失效——切换标签时状态照常丢失，很难联想到是命名问题。

> 现状：24 个菜单页面的 `name` 已与后端 `route_name` 对齐（PascalCase，如 `Config` / `Dict` / `ApprovalTodo`），可以直接参照。
> 视图路由的 `meta.keepAlive` 由 `transformBackendRoutes` 默认置为 `true`（目录为 `false`），所以新页面把 `name` 写对就自动有缓存。
>
> 想确认缓存是否真的生效，看这条链路是否四环齐全：菜单 `route_name` = 组件 `name` → 转换层写 `meta.keepAlive` → `tags-view` 记入 `cachedViews` → `AppMain` 的 `include` 命中。

---

## 2. 表格形态判定

先判断这张表属于哪一类，再看对应章节——比直接照抄某个页面省事，也能避免「用错壳再改回来」。

```text
有分页查询接口（返回 { rows, total }）？
├─ 是 ──→ 普通表格   → UseCrudView + useCrud        （§3.1）
└─ 否
   └─ 数据是层级结构（children）？
      ├─ 是 ──→ 树形表格 → TreeCrudView + useTreeCrud  （§3.2）
      └─ 否 ──→ 是否只读/无增删改？
         ├─ 是 ──→ 普通表格 + readonly                （§3.1.6）
         └─ 否 ──→ 手写表格                          （§3.3）
```

当前分布：普通表格 14 个（含 5 个只读列表）、树形表格 2 个、手写表格 6 个。

---

## 3. 表格开发规范

### 3.1 普通表格：`UseCrudView` + `useCrud`

绝大多数列表页都是这一套。壳里已经实现：搜索区、工具栏、表格容器、分页、新增/编辑弹窗、删除确认、加载态、底部间距；页面只需要提供 `pageApi`、搜索字段和 `#table` 列定义。

#### 3.1.1 最小实现

```vue
<template>
  <UseCrudView
    :slotProps="crud.slotProps"
    :formRules="formRules"
    :add-title="$t('system.demo.dialogs.add')"
    :edit-title="$t('system.demo.dialogs.edit')"
  >
    <template #search-form="{ searchData }">
      <el-form-item prop="name" :label="$t('system.demo.search.name')">
        <el-input v-model="searchData.name" :placeholder="$t('system.demo.placeholder.name')" />
      </el-form-item>
    </template>

    <template #actions="{ handleAdd, handleBatchRemove }">
      <el-button type="primary" @click="handleAdd" v-permission="['system:demo:add']">
        <template #icon><Icon icon="lucide:plus-circle" /></template>
        {{ $t('common.add') }}
      </el-button>
      <el-button type="danger" @click="handleBatchRemove" v-permission="['system:demo:delete']">
        <template #icon><Icon icon="lucide:trash-2" /></template>
        {{ $t('common.batchDelete') }}
      </el-button>
    </template>

    <template #table="{ handleEdit, handleRemove }">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="name" :label="$t('system.demo.columns.name')" min-width="160" />
      <el-table-column
        prop="createTime"
        :label="$t('system.demo.columns.createTime')"
        align="center"
        min-width="160"
      />
      <el-table-column fixed="right" :label="$t('common.action')" width="90" align="center">
        <template #default="scope">
          <el-tooltip :content="$t('common.edit')" placement="top">
            <el-button
              type="warning"
              text
              bg
              size="small"
              @click="handleEdit(scope.row)"
              v-permission="['system:demo:update']"
            >
              <Icon icon="lucide:pencil" />
            </el-button>
          </el-tooltip>
          <el-tooltip :content="$t('common.delete')" placement="top">
            <el-button
              type="danger"
              text
              bg
              size="small"
              @click="handleRemove(scope.row)"
              v-permission="['system:demo:delete']"
            >
              <Icon icon="lucide:trash-2" />
            </el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </template>

    <template #form-fields="{ formData }">
      <el-col :span="12">
        <el-form-item prop="name" :label="$t('system.demo.form.name')">
          <el-input v-model="formData.name" :placeholder="$t('system.demo.placeholder.name')" />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item prop="remark" :label="$t('system.demo.form.remark')">
          <el-input
            v-model="formData.remark"
            type="textarea"
            autosize
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-col>
    </template>
  </UseCrudView>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import type { FormRules } from 'element-plus'
import UseCrudView from '@/common/components/useCrud/index.vue'
import { useCrud } from '@/common/composables/useCrud'
import { demoPage, addDemo, modifyDemoById, removeDemoByIds } from './apis'
import type { DemoQueryVO, DemoVO } from './apis/type'

const { t } = useI18n()
const $t = t

defineOptions({ name: 'Demo' })

const formRules: FormRules<DemoVO> = {
  name: [{ required: true, trigger: 'blur', message: () => $t('system.demo.placeholder.name') }],
}

const crud = useCrud<DemoQueryVO, DemoVO>({
  pageApi: (query) => demoPage(query),
  addApi: (data) => addDemo(data),
  updateApi: (data) => modifyDemoById(data),
  removeApi: (ids) => removeDemoByIds(ids),
  defaultForm: () => ({ status: '0' }),
  defaultQuery: () => ({}),
  removeConfirmText: (row) => $t('system.demo.messages.deleteConfirm', { name: row?.name }),
  batchRemoveConfirmText: (count) => $t('system.demo.messages.batchDeleteConfirm', { count }),
})
</script>
```

**页面里不应该出现**：`<el-card>`、`<el-pagination>`、`<el-dialog>`、`getTableData`、`loading`、`searchData`、`<style>`。

#### 3.1.2 `UseCrudView` 属性

| 属性                     | 类型                     | 默认                             | 说明                                                         |
| ------------------------ | ------------------------ | -------------------------------- | ------------------------------------------------------------ |
| `slotProps`              | `UseCrudSlotProps`       | 必填                             | 固定传 `crud.slotProps`                                      |
| `formRules`              | `FormRules`              | —                                | 新增/编辑共用校验；只读列表可不传                            |
| `addTitle` / `editTitle` | `string`                 | 自动                             | 不传则用「新增」「编辑」                                     |
| `readonly`               | `boolean`                | `false`                          | 不渲染新增/编辑弹窗                                          |
| `dialogWidth`            | `string`                 | `min(760px, calc(100vw - 32px))` | 宽表单可传 `min(860px, …)`                                   |
| `tableProps`             | `object`                 | —                                | 透传 `el-table` 属性，如 `{ border: true, height: '520px' }` |
| `labelWidth`             | `string`                 | `168px`                          | 窄标签可传 `144px`                                           |
| `labelPosition`          | `'left'\|'right'\|'top'` | `left`                           |                                                              |
| `hidePagination`         | `boolean`                | `false`                          | 后端无分页接口时隐藏分页区                                   |

#### 3.1.3 插槽

| 插槽             | 作用域参数                                   | 放什么                            |
| ---------------- | -------------------------------------------- | --------------------------------- |
| `#search-form`   | `{ searchData }`                             | 搜索字段（**不含**查询/重置按钮） |
| `#actions`       | 全部                                         | 工具栏左侧按钮                    |
| `#actions-right` | 全部                                         | 工具栏右侧按钮（导出、清理）      |
| `#table`         | `{ handleEdit, handleRemove, tableData, … }` | **只放 `el-table-column`**        |
| `#form-fields`   | `{ formData }`                               | 弹窗表单字段                      |
| `#empty`         | —                                            | 自定义空状态                      |

#### 3.1.4 `useCrud` 配置项

| 选项                                           | 必填 | 说明                             |
| ---------------------------------------------- | ---- | -------------------------------- |
| `pageApi`                                      | ✅   | 分页查询                         |
| `addApi` / `updateApi` / `removeApi`           | —    | 只读列表不传                     |
| `transformPayload`                             | —    | 提交前转载荷（补关联字段）       |
| `defaultForm`                                  | —    | 新增初始值                       |
| `defaultQuery`                                 | —    | 搜索初始值，**重置时恢复为此值** |
| `removeConfirmText` / `batchRemoveConfirmText` | —    | 自定义删除确认文案               |

删除接口按后端约定接收逗号拼接的 id 字符串：`removeApi: (ids) => removeXxxByIds(ids)`。

#### 3.1.5 对外接口只有三条路径

```ts
const crud = useCrud({ … })
crud.slotProps   // 模板：绑定给壳；动作从插槽作用域取
crud.refresh()   // 脚本：自定义动作后重新拉数据
crud.state       // 脚本：读写 formData / dialogVisible（回填联动）
```

| 路径        | 用途                 | 典型场景                                    |
| ----------- | -------------------- | ------------------------------------------- |
| `slotProps` | 模板消费             | `<UseCrudView :slotProps="crud.slotProps">` |
| `refresh()` | 脚本主动刷新         | 行内状态开关、执行一次等自定义动作后        |
| `state`     | 脚本读写弹窗内部状态 | 编辑时回填树勾选、监听 `dataScope` 变化     |

不要通过替换返回对象上的方法来扩展行为，原因在下面这段注释里：

```ts
// ❌ 反例：slotProps 里保存的是原函数引用，替换不会生效，
//    而且绕过了 onDialogOpen 这份显式契约
const original = crud.methods.handleEdit
crud.methods.handleEdit = (row) => { … }
```

需要「编辑时做额外处理」用 `onDialogOpen`；需要「自定义删除文案」用 `removeConfirmText`。

#### 3.1.6 只读列表

没有增删改的列表（日志、在线用户、消息记录）用壳 + `readonly` 最省事，手写等于把壳的骨架再抄一遍：

```vue
<UseCrudView :slotProps="crud.slotProps" readonly>
  <template #search-form="{ searchData }">…</template>
  <template #actions>
    <el-button type="danger" @click="handleClean" v-permission="['system:log:clean']">清理</el-button>
  </template>
  <template #table>…</template>
</UseCrudView>
```

```ts
const crud = useCrud({ pageApi: (q) => logPage(q), removeApi: (ids) => removeLogByIds(ids) })
```

**后端没有分页接口时**（如在线用户，一次返回全量数组），在 `pageApi` 里做一层适配，同时用
`hide-pagination` 隐藏分页区——不要为了一个页面手写整套骨架：

```ts
const crud = useCrud<{ username?: string }, OnlineUserVO>({
  pageApi: async (query) => {
    const res = await onlineUserList(query.username)
    const rows = res.data ?? []
    return { ...res, data: { rows, total: rows.length } }
  },
})
```

```vue
<UseCrudView :slotProps="crud.slotProps" readonly hide-pagination> … </UseCrudView>
```

只读列表的工具栏只放「批量删除 / 清空 / 全部已读」这类动作，行内只放「详情 / 强制下线 / 重投」，
属于**动作**而非新增编辑，因此不需要 `addApi` / `updateApi`。

### 3.2 树形表格：`TreeCrudView` + `useTreeCrud`

用于 **layered 数据 + 无分页**（部门、菜单）。

#### 3.2.1 最小实现

```vue
<template>
  <TreeCrudView
    :slotProps="crud.slotProps"
    :formRules="formRules"
    :add-title="$t('system.dept.dialogs.add')"
    :edit-title="$t('system.dept.dialogs.edit')"
    dialog-width="min(720px, calc(100vw - 32px))"
    label-width="144px"
    :default-expanded="true"
  >
    <template #search-form="{ searchData }">…</template>

    <template #actions>
      <el-button type="primary" @click="crud.methods.handleAdd" v-permission="['system:dept:add']">
        {{ $t('system.dept.actions.add') }}
      </el-button>
    </template>

    <template #table="{ handleAddChild, handleEdit, handleRemove }">…</template>

    <template #form-fields="{ formData, treeData }">
      <el-col :span="24">
        <el-form-item prop="parentId" :label="$t('system.dept.form.parentId')">
          <el-tree-select v-model="formData.parentId" :data="treeData" … />
        </el-form-item>
      </el-col>
      …
    </template>
  </TreeCrudView>
</template>

<script lang="ts" setup>
const crud = useTreeCrud<SystemDeptQueryVO, SystemDeptTreeVO>({
  treeApi: (query) => deptTreeList(query),
  addApi: (data) => addDept(data),
  updateApi: (data) => modifyDeptById(data),
  removeApi: (id) => removeDeptById(id as number),
  defaultForm: () => ({ status: '0', sort: 0 }),
  removeConfirmText: (row) => $t('system.dept.messages.deleteConfirm', { deptName: row?.deptName }),
  removeGuard: (row) =>
    row?.children?.length ? $t('system.dept.messages.hasChildren') : undefined,
})

crud.methods.getTreeData()
</script>
```

#### 3.2.2 与普通表格的差异

| 项           | `useCrud`                     | `useTreeCrud`                                      |
| ------------ | ----------------------------- | -------------------------------------------------- |
| 数据接口     | `pageApi` → `{ rows, total }` | `treeApi` → 完整数组                               |
| 分页         | 有                            | 无                                                 |
| 新增子级     | —                             | `handleAddChild(row)`，可用 `childForm` 定制默认值 |
| 删除         | `removeApi(ids)` 逗号拼接     | `removeApi(id)` 单条                               |
| 删除前置校验 | —                             | `removeGuard(row)` 返回文案则拦截                  |
| 展开/收起    | —                             | 壳已内置按钮，页面里不用再写                        |
| 行点击       | `@row-click` 透传             | 壳内置「点整行展开子节点」                         |

#### 3.2.3 `TreeCrudView` 属性

| 属性                                                                                                               | 默认      | 说明             |
| ------------------------------------------------------------------------------------------------------------------ | --------- | ---------------- |
| `slotProps` / `formRules` / `addTitle` / `editTitle` / `readonly` / `dialogWidth` / `labelWidth` / `labelPosition` | 同 §3.1.2 |                  |
| `rowKey`                                                                                                           | `id`      | 树表主键字段     |
| `defaultExpanded`                                                                                                  | `false`   | 初始是否全部展开 |

#### 3.2.4 容易踩的坑

- 页面里不用再写「展开全部/收起全部」按钮——壳已经渲染，文案走 `common.expandAll` / `common.collapseAll`
- 父级选择直接用 `#form-fields` 作用域里的 `treeData`，另发一次请求容易和后端树不同步
- 子级默认值有业务规则时用 `childForm(parent)`（参考菜单：目录下加菜单、菜单下加按钮）

### 3.3 手写表格

**先排除这三种「以为不能用、其实能用」的情况：**

| 情况                                               | 正确做法                                           |
| -------------------------------------------------- | -------------------------------------------------- |
| 没有新增/编辑（日志、消息、审批记录、代码生成表）  | `readonly`（§3.1.6）                               |
| 操作是审批、生成、导出、撤销这类**动作**而非增删改 | 动作按钮放 `#actions` 或行内，弹窗放 `#extra` 插槽 |
| 后端没有分页接口                                   | `hide-pagination` + `pageApi` 里做适配（§3.1.6）   |

只有当**壳在结构上表达不了**时才允许手写：

| 真正的阻碍                           | 典型形态                                              |
| ------------------------------------ | ----------------------------------------------------- |
| 一页里有多个互相独立的列表           | 主从双表（上表选中 → 下表联动，且两者都要自己的分页） |
| 表格内嵌可编辑单元格                 | 点击单元格原地编辑，不弹窗                            |
| 非分页语义                           | 无限滚动、游标翻页                                    |
| 页面骨架不是「搜索 + 工具栏 + 表格」 | 看板、树 + 详情双栏                                   |

> **存量待迁移（6 个）**：`approval/started`、`approval/todo`、`approval/done`、
> `tool/generateCode`、`bpm/expression-config`、`system/notice`。
> 技术上**都可以迁移**——前 4 个没有增删改，用 `readonly`；后 2 个是标准 CRUD，用普通壳。
> 它们目前是手写的，属于历史遗留，**不是设计上的豁免**。

手写表格也建议沿用同一套骨架，否则间距、加载态和列表页会对不上：

#### 3.3.1 沿用页面骨架类

壳内部渲染的四个类，手写时用同名类即可，不要再写一份样式（否则两套规则会互相覆盖）：

```vue
<div class="app-container">
  <el-card shadow="never" class="search-wrapper">…</el-card>
  <el-card shadow="never">
    <div class="toolbar-wrapper">…</div>
    <div v-table-loading="loading" class="table-wrapper">
      <el-table :data="rows">…</el-table>
    </div>
    <div class="page-wrapper">
      <el-pagination … />
    </div>
  </el-card>
</div>
```

这四个类的样式由 `src/common/assets/styles/page-scaffold.scss` 统一提供：`.search-wrapper`（下间距）、`.toolbar-wrapper`（左右分布 + 下间距）、`.table-wrapper`（下间距）、`.page-wrapper`（右对齐分页）。

这四个类不要在页面 `<style>` 里重复定义。当前 `approval/*`、`bpm/expression-config` 还没挂 `.table-wrapper`，属待补齐项。

#### 3.3.2 表格视觉参考（与壳保持一致）

见 §4，与普通表格完全一致（对齐、表头换行、列宽、操作列）。

#### 3.3.3 其余同等要求

| 项             | 要求                                                      |
| -------------- | --------------------------------------------------------- |
| 加载态         | 用 `v-table-loading`（不用 `v-loading`，全站统一这一套）   |
| 删除确认       | `ElMessageBox.confirm` + i18n 文案                        |
| 权限           | `v-permission` + 后端 `@PreAuthorize` + 菜单 SQL 三处同名 |
| 搜索区字段宽度 | 用 `search-field*` 档位类，内联 `style="width"` 会被覆盖   |
| 弹窗           | `.adaptive-form` + `el-col` 布局                          |
| i18n / 令牌    | 同普通页面                                                |

#### 3.3.4 参考实现

`src/views/system/notice/index.vue`：手写表格 + 详情弹窗 + 发布/撤回，骨架类、加载态、i18n、权限均合规。

---

## 4. 表格视觉规范（三种形态通用）

### 4.1 对齐

| 列类型                         | 写法                                         |
| ------------------------------ | -------------------------------------------- |
| 文本（名称、编码、备注、路径） | **不写 `align`**（默认左对齐）               |
| 数值（排序、数量、金额）       | `align="right"`                              |
| 时间                           | `align="center"`                             |
| 状态 / 类型（`el-tag`）        | `align="center"` + 定宽                      |
| 操作列                         | `fixed="right"` + `align="center"`           |
| 勾选列                         | `type="selection" width="50" align="center"` |

文本列建议左对齐：居中会让每行起始位置参差，纵向扫读变慢。

### 4.2 超长内容

| 位置                     | 行为                | 说明                                                                                                     |
| ------------------------ | ------------------- | -------------------------------------------------------------------------------------------------------- |
| 数据单元格               | 单行截断 + 悬浮提示 | `el-table-column` 被全局包装，纯文本列**自动**开启 `show-overflow-tooltip`，不要手写                     |
| 插槽列（标签/链接/开关） | 默认不开启          | 内容可能很长时显式加 `show-overflow-tooltip`                                                             |
| 表头                     | **换行，不截断**    | Element Plus 的 tooltip 只作用于单元格，表头无 tooltip；表头是静态标签，换行即可完整可读，也不依赖 hover |

因此**列名可以放心写长**，不需要为了塞下英文而缩短文案。

### 4.3 列宽

| 场景                         | 写法                                          |
| ---------------------------- | --------------------------------------------- |
| 文本列                       | `min-width="160"`（可拉伸）                   |
| 定宽短列（状态、排序、时间） | `width="80"` ~ `"170"`                        |
| 操作列                       | 2 个按钮 `width="90"`；4 个按钮 `width="150"` |

列宽用 `min-width` / `width` 属性，内联 `style` 容易被 EP 的样式覆盖。

### 4.4 表格属性

`border` / `height` 等通过 `:table-props` 传给壳；手写表格直接写在 `el-table` 上。不要在 `#table` 插槽里再包一层 `el-table`——表头和列宽会双重计算。

---

## 5. i18n 规范

### 5.1 双文件同步

`src/i18n/locales/<domain>/<module>.ts` 里 `zh` 与 `en` 的 key 保持一致：漏 key 时 vue-i18n 会回退成 key 本身，界面上直接露出 `system.user.title` 这样的字面量。

### 5.2 key 分层

```ts
export const zh = {
  actions: { add: '新增', exportTitle: '导出' },
  columns: { name: '名称', status: '状态' },
  dialogs: { add: '新增示例', edit: '编辑示例' },
  form: { name: '名称', remark: '备注' },
  formPlaceholder: { name: '请输入名称' },
  messages: { deleteConfirm: '确认删除 {name}？', batchDeleteConfirm: '正在删除 {count} 条数据' },
  search: { name: '名称', status: '状态' },
}
```

| 分组              | 用途         |
| ----------------- | ------------ |
| `search`          | 搜索区标签   |
| `columns`         | 表头         |
| `form`            | 弹窗表单标签 |
| `formPlaceholder` | placeholder  |
| `dialogs`         | 弹窗标题     |
| `actions`         | 按钮         |
| `messages`        | 提示/确认    |

文案统一走 `t()`，包括 `ElMessage.warning('只能上传一个文件')` 这类提示——它同样会被英文用户看到。

### 5.3 动态引用

部分 key 不出现在 `t('…')` 字面量里：配置对象 + `t(item.labelKey)`、三元 `t(a ? 'x' : 'y')`、模板字符串 ``t(`a.${type}`)``。删文案前先确认没有间接引用。

### 5.4 校验

目前是**人工校验**（未接入自动化脚本）：

1. 新增文案后左右切换一次中英文，确认没有显示成 key 原文、也没有中文残留
2. 检查同一个 key 在中英两个对象里都存在
3. 含占位符（`{name}` / `{count}`）的文案，中英占位符保持一致
4. 模板插值写成 `{{ $t('x') }}`；写成单花括号 `{ $t('x') }` 会被当纯文本原样显示，而构建与 `vue-tsc` 都不会报错

---

## 6. 权限规范

同一个操作权限在三处保持同名，缺一处都会出现「按钮能点但接口 403」或「有权限却看不到按钮」：

| 位置   | 写法                                                    | 缺失后果                         |
| ------ | ------------------------------------------------------- | -------------------------------- |
| 前端   | `v-permission="['system:demo:add']"`                    | 无权限用户仍可见按钮             |
| 后端   | `@PreAuthorize("@ss.hasPermission('system:demo:add')")` | 接口裸奔                         |
| 菜单表 | `system_menu` 插一条 `menu_type='F'` 记录               | **按钮消失**（指令直接移除元素） |

前端指令行为：`permissions` 含 `*:*:*` 或匹配项才保留元素，否则 `parentNode.removeChild(el)`。**权限标识写错的表现是按钮凭空消失，不是点击 403。**

新增权限时，顺手在 `doc/sql/migration/` 下补一个可重复执行的迁移脚本（参考 `20261028_add_workflow_category_perms.sql`），否则已有环境里这条权限不会生效。

---

## 7. 样式与主题规范

### 7.1 令牌优先

| 类型 | 令牌                                                               |
| ---- | ------------------------------------------------------------------ |
| 颜色 | `--theme-*`（文字/背景/边框/强调/功能色）                          |
| 圆角 | `--p-radius-xs/sm/md/lg/xl/2xl/full`                               |
| 字号 | `--p-text-xs/sm/base/md/lg/xl/2xl/3xl/display`                     |
| 间距 | `--p-space-0-5/1/1-5/2/2-5/3/3-5/4/4-5/5/6/7/8/10/12`              |
| 动效 | `--p-duration-fast/normal/slow`、`--p-ease-out`、`--p-ease-in-out` |
| 阴影 | `--theme-shadow-sm/md/lg/xl`                                       |

当前令牌化率：圆角 100%、字号 100%、过渡 97%、间距 85%。新增代码保持这个比例即可。

### 7.2 强调色的三种用法

| 场景                       | 令牌                                        |
| -------------------------- | ------------------------------------------- |
| 强调色**当文字**           | `--theme-accent-strong`                     |
| 强调色**当图标/装饰**      | `--theme-accent`                            |
| 强调色**当填充**（配文字） | `--theme-accent-fill` + `--theme-accent-on` |

用 `accent` 当文字对比度仅 3.61，不达 AA。

### 7.3 暗色

全部走令牌后切一次主题检查。注意卡片面层 `--theme-bg-surface` 与浮层 `--theme-bg-elevated` 不要混用；暗色下阴影几乎不可见，需要层次时用边框或 `--theme-card-highlight`。

### 7.4 移动端

全局已处理：单元格两行截断、表头换行、工具栏换行、分页居中、搜索项独占一行、弹窗内边距收紧，页面里不用再处理一遍。

特殊需求使用已全局注入的断点 mixin（无需 import）：

```scss
@include sm { … }      // ≤768
@include phone { … }   // ≤576
@include xs { … }      // ≤480
@include mobile { … }  // ≤991
```

### 7.5 搜索区字段宽度

用档位类，不要内联 `style="width"`（内联会被 EP 的搜索项样式覆盖）：

| 类                | 宽度  |
| ----------------- | ----- |
| `search-field-sm` | 130px |
| `search-field`    | 150px |
| `search-field-md` | 180px |
| `search-field-lg` | 200px |
| `search-field-xl` | 220px |

原因：`el-select` / `el-input` 自带 `width: var(--el-*-width)`，与单类选择器同权重且 EP 样式后加载，会把宽度覆盖成 100%。全局已用 `html` 前缀提权。

---

## 8. 加载态规范

| 场景                   | 用什么                      |
| ---------------------- | --------------------------- |
| 列表换页 / 搜索 / 刷新 | `v-table-loading`（壳内置） |
| 首屏整块无数据         | `Skeleton` 组件             |

加载态统一用 `v-table-loading`（而不是 `v-loading`）：它自带 `role="status"` / `aria-live`，视觉是「浅色遮罩 + 沿顶边扫过的强调色细线」，全站只有这一套，换页面时不会跳变。

骨架屏用法：

```vue
<Skeleton :loading="loading" variant="table" :rows="8" :columns="6">
  <el-table :data="rows">…</el-table>
</Skeleton>
```

`variant` 支持 `page` / `card` / `table` / `list`；`delay` 默认 180ms，接口更快时完全不闪骨架。

---

## 9. 表单与弹窗规范

| 项           | 要求                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| 字段布局     | 壳的 `#form-fields` 外层已有 `el-row`，每个字段包一层 `el-col`（`:span="12"` 半宽 / `:span="24"` 整行） |
| 窄屏降级     | `.adaptive-form` 已处理断点，页面里不用再写                                                             |
| 校验规则     | 通过 `formRules` 传给壳；动态规则用 `computed`                                                          |
| 额外弹窗     | 详情抽屉、生成器等等放壳的 **`#extra` 插槽**，不要塞进 `#form-fields`，也**不要放在壳的同级**           |
| 弹窗内写表单 | 模板里用 `#form-fields` 的 `formData`；脚本里用 `crud.state.formData.value`                             |

---

## 10. 代码质量

| 项              | 要求                                                            |
| --------------- | --------------------------------------------------------------- |
| 调试残留        | `console.log` 提交前清掉（`console.warn` / `error` 可以留）      |
| 注释掉的代码    | 不要提交；确实要留就转成 TODO + 说明                            |
| 未使用导入/导出 | 顺手删掉                                                        |
| 死组件 / 死页面 | 后端接口不存在时不加页面；功能下线时把前端一起删掉              |
| 无效样式        | 被更高优先级覆盖、实际不生效的声明删掉                          |
| 提交前          | `vue-tsc --noEmit`、`pnpm build:dev` 通过，且手工点过受影响页面 |

---

## 11. 提交前自查

按表格过一遍即可。这些项都对应上面章节里容易返工的点，勾完基本不会再被打回。

### 11.1 通用

- [ ] 没有硬编码文案（含 `ElMessage` 参数）
- [ ] 没有硬编码颜色 / 圆角 / 字号 / 间距
- [ ] `zh` / `en` 两套 key 一致
- [ ] 暗色主题检查过
- [ ] 移动端（≤375px）检查过
- [ ] `vue-tsc` / `build:dev` 通过，中英文各切换一次确认无 key 原文

### 11.2 普通表格

- [ ] 使用 `UseCrudView` + `useCrud`，页面无 `<el-card>` / `<el-pagination>` / `<el-dialog>`
- [ ] 页面 `<style>` 里没有 `.search-wrapper` / `.toolbar-wrapper` / `.table-wrapper` / `.page-wrapper`
- [ ] 搜索字段用 `search-field*` 类，无内联宽度
- [ ] 重置后条件真的清空（依赖 `defaultQuery`）
- [ ] 删除确认文案含变量插值
- [ ] 每个写操作按钮有 `v-permission`，与后端 `@PreAuthorize`、菜单 SQL 一致

### 11.3 树形表格

- [ ] 使用 `TreeCrudView` + `useTreeCrud`，页面无手写展开/收起
- [ ] `defaultExpanded` 符合业务预期
- [ ] 有子节点时删除被 `removeGuard` 拦截（如业务要求）
- [ ] 父级选择使用插槽提供的 `treeData`
- [ ] 子级创建默认值通过 `childForm` 表达，而非在页面里判断

### 11.4 手写表格

- [ ] 确认属于 §3.3 允许的三种情况之一
- [ ] 复用 `.search-wrapper` / `.toolbar-wrapper` / `.table-wrapper` / `.page-wrapper`，未重复定义样式
- [ ] 使用 `v-table-loading`，未使用 `v-loading`
- [ ] 对齐、表头换行、列宽符合 §4
- [ ] i18n、权限、令牌同普通表格

---

## 12. 常见错误：现象与原因

1. **`v-loading`** —— 用 `v-table-loading`
2. **`el-dropdown` 默认插槽里套 `el-tooltip`** —— EP 用 `ElOnlyChild` 取触发元素，套一层组件后点击失效；触发元素用原生元素，提示改用 `title`
3. **给搜索框写内联宽度** —— 会被 EP 样式覆盖，改用 `search-field*` 档位类
4. **自己实现 `resetSearch`** —— `resetFields()` 只处理声明 `prop` 的字段，未声明 `prop` 的条件会残留；用壳的 `resetSearch()`
5. **为不存在的后端接口写页面** —— 先确认 Controller 有对应 `@RequestMapping`
6. **`v-permission` 用了没人种的权限标识** —— 表现是按钮消失而非报错
7. **页面根节点自己加 `.app-container`** —— 壳内部已有，会双倍内边距
8. **在 `#table` 里再包 `el-table`** —— 只放 `el-table-column`
9. **组件 `name` 与路由 `name` 大小写不一致** —— keep-alive 匹配区分大小写，缓存会静默失效
10. **在壳的同级再放弹窗、抽屉** —— 会让页面变成多根节点（fragment），而 `<transition mode="out-in">` + `<keep-alive>` 要求单一元素根：进入动画挂不上、`class` 也无法继承，**表现是右侧内容区直接空白**，构建与 `vue-tsc` 都不报错。把页面自有弹窗放进壳的 `#extra` 插槽即可——这类问题只能靠现象反推，所以单独列在这里
11. **在 `<keep-alive>` / `<transition>` 里用 `v-if` / `v-else` 放多个分支** —— 两者都要求**恰好一个**子节点。Vue 校验发生在**运行时**，`pnpm build:dev` 不会报错，只在浏览器里抛 `<KeepAlive> expects exactly one child component`。需要分支时把判断提到外层（如 `v-else-if` 与 `router-view` 并列），或让 `:is` 指向一个兜底组件
12. **patch 壳返回对象上的方法**（`crud.methods.handleEdit = …`）—— 用 `onDialogOpen` / `removeConfirmText` 等显式配置项，patch 既不生效也破坏契约
13. **提交被更高优先级覆盖的"无效样式"** —— 例如给 `type="primary"` 的按钮写 `--el-button-bg-color`，会被 `html .el-button--primary` 压制

---

## 13. 参考实现

| 场景                            | 文件                                    |
| ------------------------------- | --------------------------------------- |
| 最简普通表格                    | `src/views/system/config/index.vue`     |
| 普通表格 + 字典 + 载荷转换      | `src/views/system/post/index.vue`       |
| 普通表格 + 表单两列 + 权限树    | `src/views/system/role/index.vue`       |
| 普通表格 + 表单内文件上传       | `src/views/system/authClient/index.vue` |
| 普通表格 + 工具栏右侧按钮       | `src/views/system/dict/index.vue`       |
| 树形表格（默认展开 + 删除拦截） | `src/views/system/dept/index.vue`       |
| 树形表格（子级类型推导）        | `src/views/system/menu/index.vue`       |
| 手写表格（合规范本）            | `src/views/system/notice/index.vue`     |

---

## 14. 开发环境说明

### 14.1 依赖预构建（optimizeDeps）

`unplugin-vue-components` / `unplugin-auto-import` 是在**转换期**才注入
`element-plus/es/components/<x>/style/css` 这类 import 的，它们不参与 Vite 启动期的依赖扫描。

结果就是「第一次打开用到某个组件的页面」时，Vite 把它当新依赖去预构建并强制刷新：

```
✨ new dependencies optimized: .../components/upload/style/css
✨ optimized dependencies changed. reloading
```

这次重载会让正在加载的模块返回 `504 (Outdated Optimize Dep)`，动态 import 失败 →
路由启动失败 → `index.html` 里的 `#app-loading` 永远不被替换 → **整个应用卡在 loading 页**。

因此 `vite.config.ts` 里用 `elementPlusStyleDeps()` 把 Element Plus **全部组件样式目录**
声明为预构建依赖（`optimizeDeps.include`）。不要改成「按用量推导」——会漏掉
`ElMessage` / `ElMessageBox` / `ElNotification` 这类由 API 调用而非标签引入的样式。

改动 `vite.config.ts` 后需要重启 `pnpm dev`，配置不会热更新。

### 14.2 改了 vite 配置或依赖后的标准动作

```bash
rm -rf node_modules/.vite   # 清理旧预构建缓存
pnpm dev                    # 重新预构建并启动
```

### 14.3 两个已修的开发期坑

| 现象                                     | 原因                                                                                    | 处理                                                                                          |
| ---------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 点新页面后整页卡在 loading               | 上述重优化导致 504，`router.isReady()` 失败后 `app.mount()` 从未执行                    | `main.ts` 在 `isReady` 失败时也挂载；`guard.ts` 的 chunk 恢复在 dev 下延迟 800ms 等预构建完成 |
| 提示 `ElMessageBox` 找不到（仅类型报错） | 临时启动 dev server 会按「已扫描到的模块」重写 `types/auto/auto-imports.d.ts`，声明残缺 | 跑一次完整构建重新生成：`pnpm build:dev`                                                      |
