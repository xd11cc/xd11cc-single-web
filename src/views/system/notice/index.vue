<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
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
            style="width: 130px"
          >
            <el-option
              v-for="item in getDictList('system_notice_type')"
              :key="item.id"
              :label="item.value"
              :value="Number(item.label)"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="status" :label="$t('system.notice.search.status')">
          <el-select
            v-model="searchData.status"
            :placeholder="$t('system.notice.formPlaceholder.status')"
            clearable
            style="width: 130px"
          >
            <el-option
              v-for="item in getDictList('system_notice_status')"
              :key="item.id"
              :label="item.value"
              :value="Number(item.label)"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <template #icon><Icon icon="lucide:search" /></template
            >{{ $t('system.notice.actions.query') }}
          </el-button>
          <el-button @click="resetSearch">
            <template #icon><Icon icon="lucide:rotate-ccw" /></template
            >{{ $t('system.notice.actions.reset') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" @click="handleAdd" v-permission="['system:notice:add']">
            <template #icon><Icon icon="lucide:plus-circle" /></template>
            {{ $t('system.notice.actions.add') }}
          </el-button>
          <el-button
            type="danger"
            @click="handleBatchRemove"
            v-permission="['system:notice:delete']"
          >
            <template #icon><Icon icon="lucide:trash-2" /></template>
            {{ $t('system.notice.actions.batchDelete') }}
          </el-button>
        </div>
      </div>

      <div class="table-wrapper">
        <el-table ref="tableRef" :data="tableData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column
            prop="title"
            :label="$t('system.notice.columns.title')"
            min-width="200"
          />
          <el-table-column
            prop="type"
            :label="$t('system.notice.columns.type')"
            align="center"
            width="100"
          >
            <template #default="scope">
              <el-tag
                :type="
                  getDictItem('system_notice_type', String(scope.row.type))?.listClass || 'info'
                "
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
              {{ scopeMap[scope.row.scope] || '-' }}
            </template>
          </el-table-column>
          <el-table-column
            prop="senderName"
            :label="$t('system.notice.columns.senderName')"
            align="center"
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
          <el-table-column
            fixed="right"
            :label="$t('system.notice.columns.action')"
            width="120"
            align="center"
          >
            <template #default="scope">
              <el-tooltip :content="$t('system.notice.actions.edit')" placement="top">
                <el-button
                  type="warning"
                  text
                  bg
                  size="small"
                  @click="handleModify(scope.row)"
                  v-permission="['system:notice:update']"
                  :disabled="scope.row.status === 1"
                >
                  <Icon icon="lucide:pencil" />
                </el-button>
              </el-tooltip>
              <el-tooltip
                v-if="scope.row.status === 0 || scope.row.status === 2"
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
                v-if="scope.row.status === 1"
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
        </el-table>
      </div>

      <div class="page-wrapper">
        <el-pagination
          background
          :layout="paginationData.layout"
          :page-sizes="paginationData.pageSizes"
          :total="paginationData.total"
          :page-size="paginationData.pageSize"
          :current-page="paginationData.currentPage"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增、修改弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="
        formData.id === undefined
          ? $t('system.notice.dialogs.add')
          : $t('system.notice.dialogs.edit')
      "
      width="min(800px, calc(100vw - 32px))"
      destroy-on-close
      @close="handleClose"
    >
      <el-form
        ref="formRef"
        class="adaptive-form"
        :model="formData"
        :rules="formRules"
        label-width="144px"
        label-position="left"
      >
        <el-row :gutter="20">
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
                style="width: 100%"
              >
                <el-option
                  v-for="item in getDictList('system_notice_type')"
                  :key="item.id"
                  :label="item.value"
                  :value="Number(item.label)"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="scope" :label="$t('system.notice.form.scope')">
              <el-select
                v-model="formData.scope"
                :placeholder="$t('system.notice.formPlaceholder.scope')"
                style="width: 100%"
              >
                <el-option :value="1" :label="$t('system.notice.types.all')" />
                <el-option :value="2" :label="$t('system.notice.types.dept')" />
                <el-option :value="3" :label="$t('system.notice.types.user')" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24" v-if="formData.scope === 2">
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
          <el-col :span="24" v-if="formData.scope === 3">
            <el-form-item :label="$t('system.notice.form.scopeUser')">
              <el-select
                v-model="formData.scopeUserIds"
                multiple
                filterable
                :placeholder="$t('system.notice.formPlaceholder.scopeUser')"
                style="width: 100%"
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
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleCreateOrUpdate">{{
          $t('common.confirm')
        }}</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
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
          scopeMap[detailData.scope!] || '-'
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
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { useDict } from '@/common/composables/useDict'
import { usePagination } from '@@/composables/usePagination'
import type { FormRules } from 'element-plus'
import { cloneDeep } from 'lodash-es'
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

const { getDictList, getDictItem } = useDict(['system_notice_type', 'system_notice_status'])

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)

const searchFormRef = useTemplateRef('searchFormRef')
const searchData = reactive<SystemNoticeQueryVO>({})

const tableRef = useTemplateRef('tableRef')
const tableData = ref<SystemNoticeVO[]>([])

const formRef = useTemplateRef('formRef')
const deptTreeRef = useTemplateRef('deptTreeRef')
const formData = ref<any>({ type: 1, scope: 1 })
const detailData = ref<SystemNoticeVO>({})

const deptTreeData = ref<SystemDeptTreeVO[]>([])
const userListData = ref<SystemUserVO[]>([])

const scopeMap: Record<number, string> = {
  1: $t('system.notice.types.all'),
  2: $t('system.notice.types.dept'),
  3: $t('system.notice.types.user'),
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

function handleSearch() {
  paginationData.currentPage = 1
  getTableData()
}

function resetSearch() {
  searchFormRef.value?.resetFields()
  paginationData.currentPage = 1
  getTableData()
}

function handleAdd() {
  dialogVisible.value = true
  formData.value = { type: 1, scope: 1 }
}

function handleModify(row: SystemNoticeVO) {
  dialogVisible.value = true
  getNoticeById(row.id!).then(({ data }) => {
    formData.value = {
      ...data,
      scopeDeptIds: data.scopeDeptIds ? data.scopeDeptIds.split(',').map(Number) : [],
      scopeUserIds: data.scopeUserIds ? data.scopeUserIds.split(',').map(Number) : [],
    }
    if (data.scope === 2 && formData.value.scopeDeptIds.length) {
      nextTick(() => {
        formData.value.scopeDeptIds.forEach((id: number) => {
          deptTreeRef.value?.setChecked(id, true, false)
        })
      })
    }
  })
}

function handleClose() {
  formData.value = { type: 1, scope: 1 }
  formRef.value?.clearValidate()
}

function handleCreateOrUpdate() {
  formRef.value?.validate((valid) => {
    if (!valid) return
    submitLoading.value = true

    const scopeDeptIds =
      formData.value.scope === 2
        ? (deptTreeRef.value?.getCheckedKeys(false) as number[]) || []
        : undefined
    const scopeUserIds = formData.value.scope === 3 ? formData.value.scopeUserIds || [] : undefined

    const isAdd = formData.value.id === undefined
    const api = isAdd
      ? addNotice({
          title: formData.value.title,
          content: formData.value.content,
          type: formData.value.type,
          scope: formData.value.scope,
          scopeDeptIds,
          scopeUserIds,
          remark: formData.value.remark,
        })
      : modifyNoticeById({
          id: formData.value.id,
          title: formData.value.title,
          content: formData.value.content,
          type: formData.value.type,
          scope: formData.value.scope,
          scopeDeptIds,
          scopeUserIds,
          remark: formData.value.remark,
        })

    api
      .then((res) => {
        ElMessage.success(res.msg || $t('system.notice.messages.operationSuccess'))
        dialogVisible.value = false
        getTableData()
      })
      .finally(() => {
        submitLoading.value = false
      })
  })
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
      getTableData()
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
      getTableData()
    })
  })
}

function handleRemove(row: SystemNoticeVO) {
  ElMessageBox.confirm(
    $t('system.notice.messages.deleteConfirm', { title: row.title }),
    $t('common.messages.confirmTitle'),
    {
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel'),
      type: 'warning',
    },
  ).then(() => {
    removeNoticeByIds(String(row.id)).then((res) => {
      ElMessage.success(res.msg || $t('system.notice.messages.deleteSuccess'))
      getTableData()
    })
  })
}

function handleBatchRemove() {
  const selectedRows = (tableRef.value?.getSelectionRows() as SystemNoticeVO[]) || []
  if (selectedRows.length === 0) {
    ElMessage.warning($t('system.notice.messages.selectFirst'))
    return
  }
  const ids = selectedRows.map((row) => row.id).join(',')
  ElMessageBox.confirm(
    $t('system.notice.messages.batchDeleteConfirm', { count: selectedRows.length }),
    $t('common.messages.confirmTitle'),
    {
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel'),
      type: 'warning',
    },
  ).then(() => {
    removeNoticeByIds(ids).then((res) => {
      ElMessage.success(res.msg || $t('system.notice.messages.deleteSuccess'))
      getTableData()
    })
  })
}

function getTableData() {
  loading.value = true
  const params: SystemNoticeQueryVO = {
    ...searchData,
    currentPage: paginationData.currentPage,
    pageSize: paginationData.pageSize,
  }
  noticePage(params)
    .then(({ data }) => {
      tableData.value = data.rows
      paginationData.total = data.total
    })
    .catch(() => {
      tableData.value = []
    })
    .finally(() => {
      loading.value = false
    })
}

function getDeptTree() {
  deptTreeList({}).then(({ data }) => {
    deptTreeData.value = data
  })
}

function getUserList() {
  userList().then(({ data }) => {
    userListData.value = data
  })
}

getDeptTree()
getUserList()

watch([() => paginationData.currentPage, () => paginationData.pageSize], getTableData, {
  immediate: true,
})
</script>

<style lang="scss" scoped>
.search-wrapper {
  margin-bottom: 20px;
  :deep(.el-card__body) {
    padding-bottom: 2px;
  }
}

.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.table-wrapper {
  margin-bottom: 20px;
}

.page-wrapper {
  display: flex;
  justify-content: flex-end;
}

.scope-tree {
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 8px;
  max-height: 300px;
  overflow-y: auto;
}
</style>
