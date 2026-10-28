<template>
  <UseCrudView
    :slotProps="crud.slotProps"
    :formRules="formRules"
    :add-title="$t('system.notice.dialogs.add')"
    :edit-title="$t('system.notice.dialogs.edit')"
    dialog-width="min(800px, calc(100vw - 32px))"
    label-width="144px"
  >
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
            :label="String(item.value)"
            :value="String(item.label)"
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
            :label="String(item.value)"
            :value="String(item.label)"
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
    <template #table="{ handleEdit, handleRemove }">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="title" :label="$t('system.notice.columns.title')" min-width="200" />
      <el-table-column
        prop="type"
        :label="$t('system.notice.columns.type')"
        align="center"
        width="100"
      >
        <template #default="scope">
          <el-tag
            :type="getDictItem('system_notice_type', String(scope.row.type))?.listClass || 'info'"
            effect="plain"
            size="small"
            disable-transitions
          >
            {{ getDictItem('system_notice_type', String(scope.row.type))?.value }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="scope"
        :label="$t('system.notice.columns.scope')"
        align="center"
        width="120"
      >
        <template #default="scope">
          {{ scopeLabel(scope.row.scope) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="senderName"
        :label="$t('system.notice.columns.senderName')"
        width="120"
      />
      <el-table-column
        prop="status"
        :label="$t('system.notice.columns.status')"
        align="center"
        width="100"
      >
        <template #default="scope">
          <el-tag
            :type="
              getDictItem('system_notice_status', String(scope.row.status))?.listClass || 'info'
            "
            effect="plain"
            size="small"
            disable-transitions
          >
            {{ getDictItem('system_notice_status', String(scope.row.status))?.value }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="publishTime"
        :label="$t('system.notice.columns.publishTime')"
        align="center"
        min-width="160"
      />
      <el-table-column
        prop="createTime"
        :label="$t('system.notice.columns.createTime')"
        align="center"
        min-width="160"
      />
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
              :label="String(item.value)"
              :value="String(item.label)"
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
              :label="String(item.value)"
              :value="String(item.label)"
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
            {{ getDictItem('system_notice_type', String(detailData.type))?.value }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('system.notice.columns.status')">
            {{ getDictItem('system_notice_status', String(detailData.status))?.value }}
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
import { deptTreeList } from '@/views/system/dept/apis'
import type { SystemDeptTreeVO } from '@/views/system/dept/apis/type'
import { userList } from '@/views/system/user/apis'
import type { SystemUserVO } from '@/views/system/user/apis/type'

const { t } = useI18n()
const $t = t

defineOptions({
  name: 'notice',
})

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

// scope 展示文案由字典 system_notice_scope 提供
function scopeLabel(scope?: string) {
  if (!scope) return '-'
  return getDictItem('system_notice_scope', scope)?.value ?? scope
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

const crud = useCrud<SystemNoticeQueryVO, SystemNoticeVO>({
  pageApi: (query) => noticePage(query),
  addApi: (data) => addNotice(data),
  updateApi: (data) => modifyNoticeById(data),
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
  // 编辑需要完整数据（列表接口不返回 content 与发布范围），打开弹窗后补齐
  onDialogOpen: ({ isAdd, row, form }) => {
    if (isAdd) return
    getNoticeById(row.id).then(({ data }) => {
      Object.assign(form, {
        ...data,
        scopeDeptIds: data.scopeDeptIds ? data.scopeDeptIds.split(',').map(Number) : [],
        scopeUserIds: data.scopeUserIds ? data.scopeUserIds.split(',').map(Number) : [],
      })
      if (data.scope === NOTICE_SCOPE.DEPT && form.scopeDeptIds?.length) {
        nextTick(() => {
          form.scopeDeptIds.forEach((id: number) => {
            deptTreeRef.value?.setChecked(id, true, false)
          })
        })
      }
    })
  },
})

function handleDetail(row: SystemNoticeVO) {
  detailData.value = row
  detailVisible.value = true
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

deptTreeList({}).then(({ data }) => {
  deptTreeData.value = data
})
userList().then(({ data }) => {
  userListData.value = data
})
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
