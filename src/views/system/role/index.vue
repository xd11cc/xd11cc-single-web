<template>
  <UseCrudView
    :slotProps="crud.slotProps"
    :columns="columns"
    :formRules="formRules"
    :add-title="$t('system.role.dialogs.add')"
    :edit-title="$t('system.role.dialogs.edit')"
    :submit-disabled="!permsLoaded && isEditing"
  >
    <!-- 权限回填失败时的弹窗内提示（仅编辑；新增不受影响） -->
    <template #dialog-banner>
      <el-alert
        v-if="isEditing && permsError"
        type="warning"
        :closable="false"
        show-icon
        class="perms-alert"
      >
        <span>{{ $t('system.role.messages.permsLoadFailed') }}</span>
        <el-button link type="primary" size="small" @click="retryPermissionLoad">
          {{ $t('common.retry') }}
        </el-button>
      </el-alert>
    </template>

    <!-- 搜索区字段 -->
    <template #search-form="{ searchData }">
      <el-form-item prop="roleName" :label="$t('system.role.search.roleName')">
        <el-input
          v-model="searchData.roleName"
          :placeholder="$t('system.role.formPlaceholder.roleName')"
        />
      </el-form-item>
      <el-form-item prop="roleCode" :label="$t('system.role.search.roleKey')">
        <el-input
          v-model="searchData.roleCode"
          :placeholder="$t('system.role.formPlaceholder.roleKey')"
        />
      </el-form-item>
      <el-form-item prop="status" :label="$t('system.role.search.status')">
        <el-select
          v-model="searchData.status"
          :placeholder="$t('system.role.formPlaceholder.status')"
          clearable
          class="search-field"
        >
          <el-option
            v-for="item in getDictList('system_status')"
            :key="item.id"
            :label="item.label"
            :value="item.value!"
          />
        </el-select>
      </el-form-item>
    </template>

    <!-- 工具栏按钮 -->
    <template #actions="{ handleAdd, handleBatchRemove }">
      <el-button type="primary" @click="handleAdd" v-permission="['system:role:add']">
        <template #icon><Icon icon="lucide:plus-circle" /></template>{{ $t('common.add') }}
      </el-button>
      <el-button type="danger" @click="handleBatchRemove" v-permission="['system:role:delete']">
        <template #icon><Icon icon="lucide:trash-2" /></template>{{ $t('common.batchDelete') }}
      </el-button>
    </template>

    <!-- 表格列 -->
    <!-- 固定列：不参与列设置 -->
    <template #table-prefix>
      <el-table-column type="selection" width="50" align="center" />
    </template>

    <template #cell-status="{ row }">
      <el-tag
        :type="getDictItem('system_status', row.status)?.listClass || 'info'"
        effect="plain"
        size="small"
        disable-transitions
      >
        {{ getDictItem('system_status', row.status)?.label }}
      </el-tag>
    </template>

    <!-- 操作列：固定在生成列之后 -->
    <template #table-append="{ handleEdit, handleRemove }">
      <el-table-column fixed="right" :label="$t('common.action')" width="90" align="center">
        <template #default="scope">
          <el-tooltip :content="$t('common.edit')" placement="top">
            <el-button
              type="warning"
              text
              bg
              size="small"
              @click="handleEdit(scope.row)"
              v-permission="['system:role:update']"
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
              v-permission="['system:role:delete']"
            >
              <Icon icon="lucide:trash-2" />
            </el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </template>

    <!-- 弹窗表单字段 -->
    <template #form-fields="{ formData }">
      <el-col :span="12">
        <el-form-item prop="roleName" :label="$t('system.role.search.roleName')">
          <el-input
            v-model="formData.roleName"
            :placeholder="$t('system.role.formPlaceholder.roleName')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="roleCode" :label="$t('system.role.search.roleKey')">
          <el-input
            v-model="formData.roleCode"
            :placeholder="$t('system.role.formPlaceholder.roleKey')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="status" :label="$t('system.role.search.status')">
          <el-radio-group v-model="formData.status">
            <el-radio
              v-for="item in getDictList('system_status')"
              :key="item.id"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item prop="menuIds" :label="$t('system.role.form.menuIds')">
          <el-tree
            ref="menuTreeRef"
            :data="menuTreeData"
            :props="{ label: 'menuName', children: 'children' }"
            node-key="id"
            show-checkbox
            check-strictly
            default-expand-all
            class="menu-tree"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item prop="dataScope" :label="$t('system.role.form.dataScope')">
          <el-select
            v-model="formData.dataScope"
            :placeholder="$t('system.role.formPlaceholder.dataScope')"
            style="width: 100%"
          >
            <el-option
              v-for="item in dataScopeOptions"
              :key="item.label"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="24" v-if="formData.dataScope === '5'">
        <el-form-item :label="$t('system.role.form.deptAuthLabel')">
          <el-tree
            ref="deptTreeRef"
            :data="deptTreeData"
            :props="{ label: 'deptName', children: 'children' }"
            node-key="id"
            show-checkbox
            check-strictly
            default-expand-all
            class="menu-tree"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item prop="remark" :label="$t('system.role.form.remark')">
          <el-input
            type="textarea"
            v-model="formData.remark"
            :placeholder="$t('system.role.formPlaceholder.remark')"
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
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { ref, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormRules, TreeInstance } from 'element-plus'
import UseCrudView from '@/common/components/useCrud/index.vue'
import { useCrud } from '@/common/composables/useCrud'
import { createLazyLoader } from '@/common/composables/useLazyResource'
import { useDict } from '@/common/composables/useDict'
import {
  rolePage,
  addRole,
  modifyRoleById,
  removeRoleByIds,
  getRoleMenuIds,
  getRoleDeptIds,
} from './apis'
import type { SystemRoleVO, SystemRoleQueryVO } from './apis/type'
import type { TableColumnDef } from '@@/composables/useTableColumns'
import { treeList } from '@/views/system/menu/apis'
import type { SystemMenuTreeVO } from '@/views/system/menu/apis/type'
import { deptTreeList } from '@/views/system/dept/apis'
import type { SystemDeptTreeVO } from '@/views/system/dept/apis/type'

const { t } = useI18n()
const $t = t

defineOptions({ name: 'Role' })

// ─── 字典 ─────────────────────────────────────────────────
const { getDictList, getDictItem } = useDict(['system_status'])

// ─── CRUD 核心（状态 + 搜索/分页/删除/弹窗生命周期） ──────
// 列定义：排序 / 显隐 / 列宽由列表壳统一管理
const columns = computed<TableColumnDef[]>(() => [
  { prop: 'roleName', label: $t('system.role.search.roleName') },
  { prop: 'roleCode', label: $t('system.role.search.roleKey') },
  { prop: 'status', label: $t('system.role.search.status'), width: 80, align: 'center' },
  { prop: 'remark', label: $t('system.role.form.remark') },
  {
    prop: 'createTime',
    label: $t('system.role.columns.createTime'),
    minWidth: 160,
    align: 'center',
  },
])

const crud = useCrud<SystemRoleQueryVO, SystemRoleVO>({
  pageApi: (query) => rolePage(query),
  removeConfirmText: (row) => $t('system.role.messages.deleteConfirm', { roleName: row?.roleName }),
  batchRemoveConfirmText: (count) => $t('system.role.messages.batchDeleteConfirm', { count }),
  // 编辑时回填菜单/部门勾选、补 dataScope 默认值（模块特有逻辑）
  onDialogOpen: ({ isAdd, form, row, session }) => {
    if (!isAdd && !form.dataScope) form.dataScope = '1'
    deptPermsLoaded.value = form.dataScope !== '5'
    void loadMenuPermissions(session, isAdd ? undefined : row?.id)
  },
  // 新增不需要历史权限：菜单树没加载好也可以先建角色，稍后到编辑页补权限。
  // 只有编辑才会「先删后插」覆盖原权限，因此那里必须拦住。
  addApi: (data) => addRole(data),
  updateApi: (data) => {
    // 边界兜底：权限没回填完就提交，后端「先删后插」会把原权限清空。
    // 按钮已禁用，这里再挡一道。
    if (!permsLoaded.value) {
      ElMessage.warning($t('system.role.messages.permsNotReady'))
      return Promise.reject(new Error('permissions not loaded'))
    }
    return modifyRoleById(data)
  },
  removeApi: (ids) => removeRoleByIds(ids),
  defaultForm: () => ({ status: '0', dataScope: '1' }),
  transformPayload: (form, isAdd) => {
    const checkedKeys = (menuTreeRef.value?.getCheckedKeys(false) as number[]) || []
    const halfCheckedKeys = (menuTreeRef.value?.getHalfCheckedKeys() as number[]) || []
    const menuIds = [...checkedKeys, ...halfCheckedKeys]
    const deptIds =
      form.dataScope === '5' ? (deptTreeRef.value?.getCheckedKeys(false) as number[]) || [] : []
    const payload: Record<string, any> = {
      roleCode: form.roleCode,
      roleName: form.roleName,
      status: form.status,
      dataScope: form.dataScope,
      menuIds,
      deptIds,
      remark: form.remark,
    }
    if (!isAdd) {
      payload.id = form.id
    }
    return payload
  },
})

/**
 * 回填菜单权限。
 * 独立成函数是因为「加载失败」时用户需要能重试，而不是关掉弹窗重开。
 */
async function loadMenuPermissions(session: number, roleId: number | undefined) {
  const isCurrent = () => crud.state.isCurrentSession(session)
  menuPermsLoaded.value = false
  permsError.value = false
  await nextTick()
  if (!isCurrent()) return
  menuTreeRef.value?.setCheckedKeys([])
  deptTreeRef.value?.setCheckedKeys([])

  const menuTreeReady = await menuTreeLoader.ensure()
  if (!isCurrent()) return
  if (!menuTreeReady) {
    permsError.value = true
    return
  }

  // 新增没有历史权限要回填
  if (!roleId) {
    menuPermsLoaded.value = true
    return
  }

  try {
    const { data: menuIds } = await getRoleMenuIds(roleId)
    if (!isCurrent()) return
    await nextTick()
    if (!isCurrent()) return
    if (!applyTreeCheckedIds(menuTreeRef.value, menuTreeData.value, menuIds)) {
      permsError.value = true
      return
    }
    menuPermsLoaded.value = true
  } catch {
    // 失败时保持禁止提交，并让提示条给出重试入口
    permsError.value = true
  }
}

/** 是否在编辑已有记录：只有编辑才会覆盖原权限，因此只有它需要强制等待回填 */
const isEditing = computed(() => crud.state.formData.value?.id != null)

/** 回填自定义范围下的部门权限（同样要可重试） */
async function loadDeptPermissions(session: number, roleId: number | undefined, requestId: number) {
  const isCurrent = () =>
    requestId === deptPermissionRequestId &&
    crud.state.dialogVisible &&
    crud.state.isCurrentSession(session) &&
    crud.state.formData.value.dataScope === '5'

  await nextTick()
  if (!isCurrent()) return
  const treeReady = await deptTreeLoader.ensure()
  if (!isCurrent()) return
  if (!treeReady) {
    permsError.value = true
    return
  }
  if (!roleId) {
    // 新增角色没有历史部门范围要回填，确认树可用即可
    deptPermsLoaded.value = true
    return
  }

  deptTreeRef.value?.setCheckedKeys([])
  try {
    const { data } = await getRoleDeptIds(roleId)
    if (!isCurrent()) return
    if (!applyTreeCheckedIds(deptTreeRef.value, deptTreeData.value, data)) {
      permsError.value = true
      return
    }
    deptPermsLoaded.value = true
  } catch {
    permsError.value = true
  }
}

/** 用户点「重试」：清掉加载器缓存，按当前弹窗会话重新回填菜单与部门 */
function retryPermissionLoad() {
  permsError.value = false
  menuTreeLoader.reset()
  deptTreeLoader.reset()
  const session = crud.state.sessionId
  const scope = crud.state.formData.value.dataScope
  const roleId = crud.state.formData.value.id as number | undefined
  deptPermsLoaded.value = scope !== '5'
  void loadMenuPermissions(session, roleId)
  if (scope === '5') {
    const requestId = ++deptPermissionRequestId
    void loadDeptPermissions(session, roleId, requestId)
  }
}

/**
 * 权限回填的两个独立就绪位。
 *
 * 只用一个标志是不够的：部门 watcher 单独把标志置为就绪时，菜单请求可能还在路上，
 * 那时保存会提交空 menuIds，而后端是「先删后插」——等于把权限清空。
 */
const menuPermsLoaded = ref(false)
const deptPermsLoaded = ref(false)
const permsLoaded = computed(() => menuPermsLoaded.value && deptPermsLoaded.value)
/** 权限回填是否失败（编辑时用它给出「为什么不能保存」的持久提示） */
const permsError = ref(false)

// ─── 依赖数据（菜单树 / 部门树） ──────────────────────────
const menuTreeData = ref<SystemMenuTreeVO[]>([])
const deptTreeData = ref<SystemDeptTreeVO[]>([])
const menuTreeRef = ref<TreeInstance>()
const deptTreeRef = ref<TreeInstance>()

// label 是展示文案，value 是提交给后端的编码（与 defaultForm / 自定义分支比较的 '5' 一致）
const dataScopeOptions = [
  { label: $t('system.role.dataScope.all'), value: '1' },
  { label: $t('system.role.dataScope.selfAndChildren'), value: '2' },
  { label: $t('system.role.dataScope.self'), value: '3' },
  { label: $t('system.role.dataScope.selfOnly'), value: '4' },
  { label: $t('system.role.dataScope.custom'), value: '5' },
]

const formRules: FormRules = {
  roleName: [{ required: true, trigger: 'blur', message: () => $t('system.role.form.roleName') }],
  roleCode: [{ required: true, trigger: 'blur', message: () => $t('system.role.form.roleKey') }],
}

type PermissionTreeNode = { id?: number; children?: PermissionTreeNode[] }

const menuTreeLoader = createLazyLoader(async () => {
  const { data } = await treeList({})
  menuTreeData.value = data ?? []
  // 等树渲染出节点：setChecked 必须在节点存在后调用才生效
  await nextTick()
})

const deptTreeLoader = createLazyLoader(async () => {
  const { data } = await deptTreeList({})
  deptTreeData.value = data ?? []
  await nextTick()
})

function applyTreeCheckedIds(
  tree: TreeInstance | undefined,
  nodes: PermissionTreeNode[],
  ids: number[],
): boolean {
  if (!tree) return false
  const availableIds = new Set<number>()
  const visit = (items: PermissionTreeNode[]) => {
    for (const item of items) {
      if (typeof item.id === 'number') availableIds.add(item.id)
      if (item.children?.length) visit(item.children)
    }
  }
  visit(nodes)
  if (ids.some((id) => !availableIds.has(id))) return false
  ids.forEach((id) => tree.setChecked(id, true, false))
  return true
}

// 同一弹窗内切换数据范围也会使旧请求过期，不能仅按 roleId 判断。
let deptPermissionRequestId = 0
watch(
  [
    () => crud.state.formData.value.dataScope,
    () => crud.state.sessionId,
    () => crud.state.dialogVisible,
  ],
  ([scope, session, dialogVisible]) => {
    const requestId = ++deptPermissionRequestId
    if (!dialogVisible) return
    if (scope !== '5') {
      deptPermsLoaded.value = true
      return
    }

    // 部门树或权限 ID 尚未成功加载并回填前禁止提交。
    deptPermsLoaded.value = false
    void loadDeptPermissions(session, crud.state.formData.value.id as number | undefined, requestId)
  },
  { flush: 'post' },
)

// ─── 初始化依赖数据 ──────────────────────────────────────
void menuTreeLoader.ensure()
void deptTreeLoader.ensure()
</script>

<style lang="scss" scoped>
.menu-tree {
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: var(--p-radius-sm);
  padding: var(--p-space-2);
  max-height: 300px;
  overflow-y: auto;
}
</style>
