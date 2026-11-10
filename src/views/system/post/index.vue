<template>
  <UseCrudView
    :slotProps="crud.slotProps"
    :columns="columns"
    :formRules="formRules"
    :submit-disabled="!deptPermsLoaded && isEditing"
    :add-title="$t('system.post.dialogs.add')"
    :edit-title="$t('system.post.dialogs.edit')"
  >
    <!-- 部门回填失败时的弹窗内提示（仅编辑；新增不受影响） -->
    <template #dialog-banner>
      <el-alert
        v-if="isEditing && deptError"
        type="warning"
        :closable="false"
        show-icon
        class="perms-alert"
      >
        <span>{{ $t('system.post.messages.deptLoadFailed') }}</span>
        <el-button link type="primary" size="small" @click="retryDeptLoad">
          {{ $t('common.retry') }}
        </el-button>
      </el-alert>
    </template>

    <!-- 搜索区字段 -->
    <template #search-form="{ searchData }">
      <el-form-item prop="postCode" :label="$t('system.post.columns.postCode')">
        <el-input
          v-model="searchData.postCode"
          :placeholder="$t('system.post.formPlaceholder.postCode')"
        />
      </el-form-item>
      <el-form-item prop="postName" :label="$t('system.post.columns.postName')">
        <el-input
          v-model="searchData.postName"
          :placeholder="$t('system.post.formPlaceholder.postName')"
        />
      </el-form-item>
      <el-form-item prop="status" :label="$t('system.post.form.status')">
        <el-select
          v-model="searchData.status"
          :placeholder="$t('system.post.formPlaceholder.status')"
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
      <el-button type="primary" @click="handleAdd" v-permission="['system:post:add']">
        <template #icon><Icon icon="lucide:plus-circle" /></template>{{ $t('common.add') }}
      </el-button>
      <el-button type="danger" @click="handleBatchRemove" v-permission="['system:post:delete']">
        <template #icon><Icon icon="lucide:trash-2" /></template>{{ $t('common.batchDelete') }}
      </el-button>
    </template>

    <!-- 表格列 -->
    <!-- 选择列：不参与列设置 -->
    <template #table-prefix>
      <el-table-column type="selection" width="50" align="center" />
    </template>

    <!-- 状态列：字典标签 -->
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
              v-permission="['system:post:update']"
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
              v-permission="['system:post:delete']"
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
        <el-form-item prop="postName" :label="$t('system.post.form.postName')">
          <el-input
            v-model="formData.postName"
            :placeholder="$t('system.post.formPlaceholder.postName')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="postCode" :label="$t('system.post.columns.postCode')">
          <el-input
            v-model="formData.postCode"
            :placeholder="$t('system.post.formPlaceholder.postCode')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="status" :label="$t('system.post.form.status')">
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
        <el-form-item prop="deptIds" :label="$t('system.post.form.deptIds')">
          <el-tree
            ref="deptTreeRef"
            :data="deptTreeData"
            :props="{ label: 'deptName', children: 'children' }"
            node-key="id"
            show-checkbox
            check-strictly
            default-expand-all
            class="dept-tree"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item prop="remark" :label="$t('system.post.form.remark')">
          <el-input
            type="textarea"
            v-model="formData.remark"
            :placeholder="$t('system.post.formPlaceholder.remark')"
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
import { ref, nextTick } from 'vue'
import type { FormRules, TreeInstance } from 'element-plus'
import UseCrudView from '@/common/components/useCrud/index.vue'
import { useCrud } from '@/common/composables/useCrud'
import { createLazyLoader } from '@/common/composables/useLazyResource'
import { useDict } from '@/common/composables/useDict'
import { postPage, addPost, modifyPostById, removePostByIds, getPostDeptIds } from './apis'
import type { SystemPostVO, SystemPostQueryVO } from './apis/type'
import type { TableColumnDef } from '@@/composables/useTableColumns'
import { deptTreeList } from '@/views/system/dept/apis'
import type { SystemDeptTreeVO } from '@/views/system/dept/apis/type'

const { t } = useI18n()
const $t = t

defineOptions({ name: 'Post' })

// ─── 字典 ─────────────────────────────────────────────────
const { getDictList, getDictItem } = useDict(['system_status'])

// ─── CRUD 核心（状态 + 搜索/分页/删除/弹窗生命周期） ──────
// 列定义：排序 / 显隐 / 列宽由列表壳统一管理
const columns = computed<TableColumnDef[]>(() => [
  { prop: 'postCode', label: $t('system.post.columns.postCode') },
  { prop: 'postName', label: $t('system.post.columns.postName') },
  { prop: 'status', label: $t('system.post.columns.status'), align: 'center', width: 80 },
  { prop: 'remark', label: $t('system.post.columns.remark') },
  {
    prop: 'createTime',
    label: $t('system.post.columns.createTime'),
    align: 'center',
    minWidth: 160,
  },
])

const deptTreeData = ref<SystemDeptTreeVO[]>([])
const deptTreeRef = ref<TreeInstance>()
const deptPermsLoaded = ref(true)
let deptPermissionRequestId = 0

const crud = useCrud<SystemPostQueryVO, SystemPostVO>({
  pageApi: (query) => postPage(query),
  // 新增不需要历史部门范围：部门树没加载好也可以先建岗位，稍后到编辑页补。
  // 只有编辑会覆盖原范围，因此那里必须拦住。
  addApi: (data) => addPost(data),
  updateApi: (data) => {
    if (!deptPermsLoaded.value) {
      ElMessage.warning($t('system.post.messages.deptPermissionsNotReady'))
      return Promise.reject(new Error('department permissions not ready'))
    }
    return modifyPostById(data)
  },
  removeApi: (ids) => removePostByIds(ids),
  defaultForm: () => ({ status: '0' }),
  removeConfirmText: (row) => $t('system.post.messages.deleteConfirm', { postName: row?.postName }),
  batchRemoveConfirmText: (count) => $t('system.post.messages.batchDeleteConfirm', { count }),
  transformPayload: (form, isAdd) => {
    const checkedKeys = (deptTreeRef.value?.getCheckedKeys(false) as number[]) || []
    const halfCheckedKeys = (deptTreeRef.value?.getHalfCheckedKeys() as number[]) || []
    const deptIds = [...(checkedKeys || []), ...(halfCheckedKeys || [])]
    const payload: Record<string, any> = {
      postCode: form.postCode,
      postName: form.postName,
      status: form.status,
      deptIds,
      remark: form.remark,
    }
    if (!isAdd) {
      payload.id = form.id
    }
    return payload
  },
  // 新增和编辑都依赖已渲染的部门树；编辑还需完成原权限回填。
  onDialogOpen: ({ isAdd, row, session }) => {
    const requestId = ++deptPermissionRequestId
    void loadDeptPermissions(session, isAdd ? undefined : row?.id, requestId)
  },
})

/** 是否在编辑已有记录：只有编辑会覆盖原部门范围 */
const isEditing = computed(() => crud.state.formData.value?.id != null)
/** 部门回填是否失败（编辑时用它给出持久提示 + 重试入口） */
const deptError = ref(false)

/** 回填部门范围（可重试） */
async function loadDeptPermissions(session: number, postId: number | undefined, requestId: number) {
  const isCurrent = () =>
    requestId === deptPermissionRequestId && crud.state.isCurrentSession(session)

  deptPermsLoaded.value = false
  deptError.value = false
  await nextTick()
  if (!isCurrent()) return
  deptTreeRef.value?.setCheckedKeys([])

  const treeReady = await deptTreeLoader.ensure()
  if (!isCurrent()) return
  if (!treeReady || !deptTreeRef.value) {
    deptError.value = true
    return
  }

  // 新增没有历史部门要回填
  if (!postId) {
    deptPermsLoaded.value = true
    return
  }

  try {
    const { data } = await getPostDeptIds(postId)
    if (!isCurrent()) return
    await nextTick()
    if (!isCurrent()) return
    if (!applyDeptCheckedIds(data)) {
      deptError.value = true
      return
    }
    deptPermsLoaded.value = true
  } catch {
    deptError.value = true
  }
}

/** 用户点「重试」：清缓存后按当前会话重新回填 */
function retryDeptLoad() {
  deptTreeLoader.reset()
  const requestId = ++deptPermissionRequestId
  void loadDeptPermissions(
    crud.state.sessionId,
    crud.state.formData.value.id as number | undefined,
    requestId,
  )
}

// ─── 依赖数据（部门树） ───────────────────────────────────
const formRules: FormRules = {
  postCode: [{ required: true, trigger: 'blur', message: () => $t('system.post.form.postCode') }],
  postName: [{ required: true, trigger: 'blur', message: () => $t('system.post.form.postName') }],
  status: [
    { required: true, trigger: 'change', message: () => $t('system.post.formPlaceholder.status') },
  ],
}

const deptTreeLoader = createLazyLoader(async () => {
  const { data } = await deptTreeList({})
  deptTreeData.value = data ?? []
  // 等树渲染出节点，setChecked 才能生效
  await nextTick()
})

function applyDeptCheckedIds(ids: number[]): boolean {
  const tree = deptTreeRef.value
  if (!tree) return false
  const availableIds = new Set<number>()
  const visit = (nodes: SystemDeptTreeVO[]) => {
    for (const node of nodes) {
      availableIds.add(node.id)
      if (node.children?.length) visit(node.children)
    }
  }
  visit(deptTreeData.value)
  if (ids.some((id) => !availableIds.has(id))) return false
  ids.forEach((id) => tree.setChecked(id, true, false))
  return true
}

// ─── 初始化依赖数据 ──────────────────────────────────────
void deptTreeLoader.ensure()
</script>

<style lang="scss" scoped>
.dept-tree {
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: var(--p-radius-sm);
  padding: var(--p-space-2);
  max-height: 300px;
  overflow-y: auto;
}
</style>
