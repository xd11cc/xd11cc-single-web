<template>
  <UseCrudView
    :slotProps="crud.slotProps"
    :columns="columns"
    :formRules="formRules"
    :submit-disabled="!noticeFormReady && isEditing"
    :add-title="$t('system.notice.dialogs.add')"
    :edit-title="$t('system.notice.dialogs.edit')"
    dialog-width="min(800px, calc(100vw - 32px))"
    label-width="144px"
  >
    <!-- 详情回填失败时的弹窗内提示（仅编辑；新增不受影响） -->
    <template #dialog-banner>
      <el-alert
        v-if="isEditing && noticeError"
        type="warning"
        :closable="false"
        show-icon
        class="perms-alert"
      >
        <span>{{ $t('system.notice.messages.detailsLoadFailed') }}</span>
        <el-button link type="primary" size="small" @click="retryNoticeDetail">
          {{ $t('common.retry') }}
        </el-button>
      </el-alert>
    </template>

    <!-- 搜索区字段 -->
    <template #search-form="{ searchData }">
      <el-form-item prop="title" :label="$t('system.notice.search.title')">
        <el-input
          v-model="searchData.title"
          :placeholder="$t('system.notice.formPlaceholder.title')"
        />
      </el-form-item>
      <el-form-item prop="type" :label="$t('system.notice.search.type')">
        <el-select
          v-model="searchData.type"
          :placeholder="$t('system.notice.formPlaceholder.type')"
          clearable
          class="search-field-sm"
        >
          <el-option
            v-for="item in getDictList('system_notice_type')"
            :key="item.id"
            :label="String(item.label)"
            :value="String(item.value)"
          />
        </el-select>
      </el-form-item>
      <el-form-item prop="status" :label="$t('system.notice.search.status')">
        <el-select
          v-model="searchData.status"
          :placeholder="$t('system.notice.formPlaceholder.status')"
          clearable
          class="search-field-sm"
        >
          <el-option
            v-for="item in getDictList('system_notice_status')"
            :key="item.id"
            :label="String(item.label)"
            :value="String(item.value)"
          />
        </el-select>
      </el-form-item>
    </template>

    <!-- 工具栏 -->
    <template #actions="{ handleAdd, handleBatchRemove }">
      <el-button type="primary" @click="handleAdd" v-permission="['system:notice:add']">
        <template #icon><Icon icon="lucide:plus-circle" /></template>
        {{ $t('system.notice.actions.add') }}
      </el-button>
      <el-button type="danger" @click="handleBatchRemove" v-permission="['system:notice:delete']">
        <template #icon><Icon icon="lucide:trash-2" /></template>
        {{ $t('common.batchDelete') }}
      </el-button>
    </template>

    <!-- 表格列 -->
    <!-- 固定列：不参与列设置 -->
    <template #table-prefix>
      <el-table-column type="selection" width="50" align="center" />
    </template>

    <template #cell-type="{ row }">
      <el-tag
        :type="getDictItem('system_notice_type', String(row.type))?.listClass || 'info'"
        effect="plain"
        size="small"
        disable-transitions
      >
        {{ getDictItem('system_notice_type', String(row.type))?.label }}
      </el-tag>
    </template>

    <template #cell-scope="{ row }">
      {{ scopeLabel(row.scope) }}
    </template>

    <template #cell-status="{ row }">
      <el-tag
        :type="getDictItem('system_notice_status', String(row.status))?.listClass || 'info'"
        effect="plain"
        size="small"
        disable-transitions
      >
        {{ getDictItem('system_notice_status', String(row.status))?.label }}
      </el-tag>
    </template>

    <!-- 操作列：固定在生成列之后 -->
    <template #table-append="{ handleEdit, handleRemove }">
      <el-table-column fixed="right" :label="$t('common.action')" width="120" align="center">
        <template #default="scope">
          <el-tooltip :content="$t('system.notice.actions.edit')" placement="top">
            <el-button
              type="warning"
              text
              bg
              size="small"
              @click="handleEdit(scope.row)"
              v-permission="['system:notice:update']"
              :disabled="scope.row.status === NOTICE_STATUS.PUBLISHED"
            >
              <Icon icon="lucide:pencil" />
            </el-button>
          </el-tooltip>
          <el-tooltip
            v-if="
              scope.row.status === NOTICE_STATUS.DRAFT || scope.row.status === NOTICE_STATUS.REVOKED
            "
            :content="$t('system.notice.actions.publish')"
            placement="top"
          >
            <el-button
              type="success"
              text
              bg
              size="small"
              @click="handlePublish(scope.row)"
              v-permission="['system:notice:publish']"
            >
              <Icon icon="lucide:send" />
            </el-button>
          </el-tooltip>
          <el-tooltip
            v-if="scope.row.status === NOTICE_STATUS.PUBLISHED"
            :content="$t('system.notice.actions.revoke')"
            placement="top"
          >
            <el-button
              type="info"
              text
              bg
              size="small"
              @click="handleRevoke(scope.row)"
              v-permission="['system:notice:publish']"
            >
              <Icon icon="lucide:x" />
            </el-button>
          </el-tooltip>
          <el-tooltip :content="$t('system.notice.dialogs.detail')" placement="top">
            <el-button type="primary" text bg size="small" @click="handleDetail(scope.row)">
              <Icon icon="lucide:eye" />
            </el-button>
          </el-tooltip>
          <el-tooltip :content="$t('system.notice.actions.delete')" placement="top">
            <el-button
              type="danger"
              text
              bg
              size="small"
              @click="handleRemove(scope.row)"
              v-permission="['system:notice:delete']"
            >
              <Icon icon="lucide:trash-2" />
            </el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </template>

    <!-- 新增/编辑表单 -->
    <template #form-fields="{ formData }">
      <el-col :span="24">
        <el-form-item prop="title" :label="$t('system.notice.search.title')">
          <el-input
            v-model="formData.title"
            :placeholder="$t('system.notice.formPlaceholder.title')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="type" :label="$t('system.notice.search.type')">
          <el-select
            v-model="formData.type"
            :placeholder="$t('system.notice.formPlaceholder.type')"
            class="full-width"
          >
            <el-option
              v-for="item in getDictList('system_notice_type')"
              :key="item.id"
              :label="String(item.label)"
              :value="String(item.value)"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="scope" :label="$t('system.notice.form.scope')">
          <el-select
            v-model="formData.scope"
            :placeholder="$t('system.notice.formPlaceholder.scope')"
            class="full-width"
          >
            <el-option
              v-for="item in getDictList('system_notice_scope')"
              :key="item.id"
              :label="String(item.label)"
              :value="String(item.value)"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="24" v-if="formData.scope === NOTICE_SCOPE.DEPT">
        <el-form-item :label="$t('system.notice.form.scopeDept')">
          <el-tree
            ref="deptTreeRef"
            :data="deptTreeData"
            :props="{ label: 'deptName', children: 'children' }"
            node-key="id"
            show-checkbox
            check-strictly
            default-expand-all
            class="scope-tree"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24" v-if="formData.scope === NOTICE_SCOPE.USER">
        <el-form-item :label="$t('system.notice.form.scopeUser')">
          <el-select
            v-model="formData.scopeUserIds"
            multiple
            filterable
            :placeholder="$t('system.notice.formPlaceholder.scopeUser')"
            class="full-width"
          >
            <el-option
              v-for="item in userListData"
              :key="item.id"
              :label="item.username"
              :value="item.id!"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item prop="content" :label="$t('system.notice.form.content')">
          <el-input
            type="textarea"
            v-model="formData.content"
            :placeholder="$t('system.notice.formPlaceholder.content')"
            :autosize="{ minRows: 4, maxRows: 10 }"
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item prop="remark" :label="$t('system.notice.form.remark')">
          <el-input
            type="textarea"
            v-model="formData.remark"
            :placeholder="$t('system.notice.formPlaceholder.remark')"
            autosize
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-col>
    </template>

    <!-- 页面自有弹窗 / 抽屉：放进 #extra，保证壳只有一个根节点 -->
    <template #extra>
      <!-- 详情弹窗：不属于新增/编辑，放在壳的同一级 -->
      <el-dialog v-model="detailVisible" :title="$t('system.notice.dialogs.detail')" width="50%">
        <el-descriptions :column="2" border>
          <el-descriptions-item :label="$t('system.notice.columns.title')" :span="2">{{
            detailData.title
          }}</el-descriptions-item>
          <el-descriptions-item :label="$t('system.notice.columns.type')">
            {{ getDictItem('system_notice_type', String(detailData.type))?.label }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('system.notice.columns.status')">
            {{ getDictItem('system_notice_status', String(detailData.status))?.label }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('system.notice.columns.scope')">{{
            scopeLabel(detailData.scope)
          }}</el-descriptions-item>
          <el-descriptions-item :label="$t('system.notice.columns.senderName')">{{
            detailData.senderName || '-'
          }}</el-descriptions-item>
          <el-descriptions-item :label="$t('system.notice.columns.publishTime')">{{
            detailData.publishTime || '-'
          }}</el-descriptions-item>
          <el-descriptions-item :label="$t('system.notice.columns.createTime')">{{
            detailData.createTime || '-'
          }}</el-descriptions-item>
          <el-descriptions-item :label="$t('system.notice.form.content')" :span="2">
            <div style="white-space: pre-wrap">{{ detailData.content || '-' }}</div>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('system.notice.form.remark')" :span="2">{{
            detailData.remark || '-'
          }}</el-descriptions-item>
        </el-descriptions>
      </el-dialog>
    </template>
  </UseCrudView>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import type { FormRules } from 'element-plus'
import UseCrudView from '@/common/components/useCrud/index.vue'
import { useCrud } from '@/common/composables/useCrud'
import { createLazyLoader } from '@/common/composables/useLazyResource'
import { useDict } from '@/common/composables/useDict'
import {
  noticePage,
  addNotice,
  modifyNoticeById,
  removeNoticeByIds,
  getNoticeById,
  publishNotice,
  revokeNotice,
} from './apis'
import type { SystemNoticeVO, SystemNoticeQueryVO } from './apis/type'
import type { TableColumnDef } from '@@/composables/useTableColumns'
import { deptTreeList } from '@/views/system/dept/apis'
import type { SystemDeptTreeVO } from '@/views/system/dept/apis/type'
import { userList } from '@/views/system/user/apis'
import type { SystemUserVO } from '@/views/system/user/apis/type'

const { t } = useI18n()
const $t = t

defineOptions({
  name: 'Notice',
})

const crud = useCrud<SystemNoticeQueryVO, SystemNoticeVO>({
  pageApi: (query) => noticePage(query),
  // 新增不需要回填历史详情，直接提交；只有编辑要等详情与范围就绪
  addApi: (data) => addNotice(data),
  updateApi: (data) => {
    if (!noticeFormReady.value) {
      ElMessage.warning($t('system.notice.messages.detailsNotReady'))
      return Promise.reject(new Error('notice form data not ready'))
    }
    return modifyNoticeById(data)
  },
  removeApi: (ids) => removeNoticeByIds(ids),
  defaultForm: () => ({ type: '1', scope: '1' }),
  // 发布范围依赖弹窗内的部门树勾选状态，提交前统一组装载荷
  transformPayload: (form, isAdd) => ({
    ...(isAdd ? {} : { id: form.id }),
    title: form.title,
    content: form.content,
    type: form.type,
    scope: form.scope,
    scopeDeptIds:
      form.scope === NOTICE_SCOPE.DEPT
        ? (deptTreeRef.value?.getCheckedKeys(false) as number[]) || []
        : undefined,
    scopeUserIds: form.scope === NOTICE_SCOPE.USER ? form.scopeUserIds || [] : undefined,
    remark: form.remark,
  }),
  removeConfirmText: (row) => $t('system.notice.messages.deleteConfirm', { title: row?.title }),
  batchRemoveConfirmText: (count) => $t('system.notice.messages.batchDeleteConfirm', { count }),
  // 编辑需要完整数据（列表接口不返回 content 与发布范围），依赖数据就绪前禁止提交。
  onDialogOpen: ({ isAdd, row, form, session }) => {
    ++noticeDetailRequestId
    noticeScopeRequestId++
    if (isAdd) {
      noticeHydrationSession = -1
      noticeHydrationFailedSession = -1
      noticeError.value = false
      noticeFormReady.value = true
      return
    }
    noticeHydrationSession = session
    void hydrateNoticeDetail(session, row?.id, form)
  },
})

/** 是否在编辑已有记录：只有编辑需要等详情与范围回填 */
const isEditing = computed(() => crud.state.formData.value?.id != null)
/** 详情回填是否失败（编辑时给出持久提示 + 重试入口） */
const noticeError = ref(false)

/**
 * 回填编辑所需的详情与发布范围。
 * 独立成函数是为了「加载失败」时能就地重试，而不是让用户关掉弹窗重开。
 */
async function hydrateNoticeDetail(session: number, noticeId: number | undefined, form: any) {
  ++noticeDetailRequestId
  const requestId = noticeDetailRequestId
  noticeFormReady.value = false
  noticeError.value = false
  noticeHydrationSession = session
  noticeHydrationFailedSession = -1

  const isCurrent = () =>
    requestId === noticeDetailRequestId &&
    Boolean(crud.state.dialogVisible.value) &&
    crud.state.isCurrentSession(session) &&
    crud.state.formData.value === form

  try {
    if (!noticeId) throw new Error('notice id is missing')
    const { data } = await getNoticeById(noticeId)
    if (!isCurrent()) return
    const scopeDeptIds = parseIdList(data.scopeDeptIds)
    const scopeUserIds = parseIdList(data.scopeUserIds)
    if (!scopeDeptIds || !scopeUserIds) throw new Error('notice scope ids are invalid')
    Object.assign(form, { ...data, scopeDeptIds, scopeUserIds })

    const optionsReady = await ensureNoticeScopeOptions(data.scope, isCurrent, scopeDeptIds)
    if (!isCurrent()) return
    if (!optionsReady) throw new Error('notice scope options are not ready')
    noticeFormReady.value = true
  } catch {
    if (isCurrent()) {
      noticeHydrationFailedSession = session
      noticeError.value = true
    }
  } finally {
    if (noticeHydrationSession === session) noticeHydrationSession = -1
  }
}

/** 用户点「重试」：清掉范围选项缓存后按当前会话重新回填 */
function retryNoticeDetail() {
  deptOptionsLoader.reset()
  userOptionsLoader.reset()
  const form = crud.state.formData.value
  void hydrateNoticeDetail(crud.state.sessionId, form.id, form)
}

/**
 * <p>与后端 system_notice.status 一致，类型为 char(2) 字符串，
 * 不能用数字比较，否则判断恒为 false。</p>
 */
/** 通知范围（char(2)，必须字符串比较） */
/** 通知范围编码：仅用于行为判断，展示文案走字典 system_notice_scope */
const NOTICE_SCOPE = {
  ALL: '1',
  DEPT: '2',
  USER: '3',
} as const

const NOTICE_STATUS = {
  DRAFT: '0',
  PUBLISHED: '1',
  REVOKED: '2',
} as const

const { getDictList, getDictItem } = useDict([
  'system_notice_type',
  'system_notice_status',
  'system_notice_scope',
])

const deptTreeRef = useTemplateRef('deptTreeRef')
const deptTreeData = ref<SystemDeptTreeVO[]>([])
const userListData = ref<SystemUserVO[]>([])

const detailVisible = ref(false)
const detailData = ref<SystemNoticeVO>({})
const noticeFormReady = ref(true)
let noticeDetailRequestId = 0
let noticeScopeRequestId = 0
let noticeHydrationSession = -1
let noticeHydrationFailedSession = -1

const deptOptionsLoader = createLazyLoader(async () => {
  const { data } = await deptTreeList({})
  deptTreeData.value = data ?? []
  // 等树渲染出节点，setChecked 才能生效
  await nextTick()
})

const userOptionsLoader = createLazyLoader(async () => {
  const { data } = await userList()
  userListData.value = data ?? []
  await nextTick()
})

function parseIdList(value?: string): number[] | null {
  if (!value) return []
  const parts = value.split(',').map((item) => item.trim())
  if (parts.some((item) => !item)) return null
  const ids = parts.map(Number)
  return ids.every((id) => Number.isSafeInteger(id) && id > 0) ? ids : null
}

function applyNoticeDeptIds(ids: number[]): boolean {
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
  tree.setCheckedKeys([], false)
  ids.forEach((id) => tree.setChecked(id, true, false))
  return true
}

async function ensureNoticeScopeOptions(
  scope: string | undefined,
  isCurrent: () => boolean,
  deptIds?: number[],
): Promise<boolean> {
  if (scope === NOTICE_SCOPE.DEPT) {
    if (!(await deptOptionsLoader.ensure())) return false
    await nextTick()
    if (!isCurrent()) return false
    return deptIds === undefined || applyNoticeDeptIds(deptIds)
  }
  if (scope === NOTICE_SCOPE.USER) {
    if (!(await userOptionsLoader.ensure())) return false
    await nextTick()
    return isCurrent()
  }
  return isCurrent()
}

// scope 展示文案由字典 system_notice_scope 提供
function scopeLabel(scope?: string) {
  if (!scope) return '-'
  return getDictItem('system_notice_scope', scope)?.label ?? scope
}

const formRules: FormRules = {
  title: [
    { required: true, trigger: 'blur', message: () => $t('system.notice.formPlaceholder.title') },
  ],
  type: [
    { required: true, trigger: 'change', message: () => $t('system.notice.formPlaceholder.type') },
  ],
  scope: [
    { required: true, trigger: 'change', message: () => $t('system.notice.formPlaceholder.scope') },
  ],
}

// 列定义：排序 / 显隐 / 列宽由列表壳统一管理
const columns = computed<TableColumnDef[]>(() => [
  { prop: 'title', label: t('system.notice.columns.title'), minWidth: 200 },
  { prop: 'type', label: t('system.notice.columns.type'), width: 100, align: 'center' },
  { prop: 'scope', label: t('system.notice.columns.scope'), width: 120, align: 'center' },
  { prop: 'senderName', label: t('system.notice.columns.senderName'), width: 120 },
  { prop: 'status', label: t('system.notice.columns.status'), width: 100, align: 'center' },
  {
    prop: 'publishTime',
    label: t('system.notice.columns.publishTime'),
    minWidth: 160,
    align: 'center',
  },
  {
    prop: 'createTime',
    label: t('system.notice.columns.createTime'),
    minWidth: 160,
    align: 'center',
  },
])

watch(
  [
    () => crud.state.formData.value.scope,
    () => crud.state.sessionId,
    () => crud.state.dialogVisible,
  ],
  ([scope, session, dialogVisible]) => {
    const requestId = ++noticeScopeRequestId
    if (!dialogVisible) return
    // 编辑打开时，onDialogOpen 负责详情与原始范围的整体回填。
    // 若详情失败，范围变更也不能把不完整的编辑表单重新标记为可提交。
    if (noticeHydrationSession === session || noticeHydrationFailedSession === session) return

    const isCurrent = () =>
      requestId === noticeScopeRequestId &&
      crud.state.dialogVisible.value &&
      crud.state.isCurrentSession(session) &&
      crud.state.formData.value.scope === scope
    if (scope !== NOTICE_SCOPE.DEPT && scope !== NOTICE_SCOPE.USER) {
      noticeFormReady.value = true
      return
    }

    noticeFormReady.value = false
    void ensureNoticeScopeOptions(scope, isCurrent)
      .then((ready) => {
        if (!isCurrent()) return
        if (ready) noticeFormReady.value = true
        else ElMessage.warning($t('system.notice.messages.detailsNotReady'))
      })
      .catch(() => {
        if (isCurrent()) ElMessage.warning($t('system.notice.messages.detailsNotReady'))
      })
  },
  { flush: 'post' },
)

async function handleDetail(row: SystemNoticeVO) {
  const id = row.id
  detailData.value = row
  detailVisible.value = true
  if (!id) return
  try {
    // 列表行不一定带全文（不同后端版本的投影字段可能不同），详情单独取一次
    const { data } = await getNoticeById(id)
    // 期间用户可能已点了另一条的详情
    if (detailData.value?.id !== id) return
    detailData.value = { ...row, ...data }
  } catch {
    // 取详情失败时保留列表里的数据，标题等仍可阅读
  }
}

function handlePublish(row: SystemNoticeVO) {
  ElMessageBox.confirm(
    $t('system.notice.messages.publishConfirm', { title: row.title }),
    $t('common.messages.confirmTitle'),
    {
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel'),
      type: 'warning',
    },
  ).then(() => {
    publishNotice(row.id!).then((res) => {
      ElMessage.success(res.msg || $t('system.notice.messages.publishSuccess'))
      crud.refresh()
    })
  })
}

function handleRevoke(row: SystemNoticeVO) {
  ElMessageBox.confirm(
    $t('system.notice.messages.revokeConfirm', { title: row.title }),
    $t('common.messages.confirmTitle'),
    {
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel'),
      type: 'warning',
    },
  ).then(() => {
    revokeNotice(row.id!).then((res) => {
      ElMessage.success(res.msg || $t('system.notice.messages.revokeSuccess'))
      crud.refresh()
    })
  })
}

void deptOptionsLoader.ensure()
void userOptionsLoader.ensure()
</script>

<style lang="scss" scoped>
.full-width {
  width: 100%;
}

.scope-tree {
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: var(--p-radius-sm);
  padding: var(--p-space-2);
  max-height: 300px;
  overflow-y: auto;
}
</style>
