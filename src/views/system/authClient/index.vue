<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="name" :label="$t('system.authClient.search.name')">
          <el-input
            v-model="searchData.name"
            :placeholder="$t('system.authClient.formPlaceholder.name')"
          />
        </el-form-item>
        <el-form-item prop="source" :label="$t('system.authClient.search.source')">
          <el-input
            v-model="searchData.source"
            :placeholder="$t('system.authClient.formPlaceholder.source')"
          />
        </el-form-item>
        <el-form-item prop="status" :label="$t('system.authClient.search.status')">
          <el-select
            v-model="searchData.status"
            :placeholder="$t('system.authClient.search.statusPlaceholder')"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in getDictList('system_status')"
              :key="item.id"
              :label="item.value"
              :value="item.label!"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <template #icon><Icon icon="lucide:search" /></template
            >{{ $t('system.authClient.actions.query') }}
          </el-button>
          <el-button @click="resetSearch">
            <template #icon><Icon icon="lucide:rotate-ccw" /></template
            >{{ $t('system.authClient.actions.reset') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" @click="handleAdd" v-permission="['auth:clientConfig:add']">
            <template #icon><Icon icon="lucide:plus-circle" /></template>
            {{ $t('system.authClient.actions.add') }}
          </el-button>
          <el-button
            type="danger"
            @click="handleBatchRemove"
            v-permission="['auth:clientConfig:delete']"
          >
            <template #icon><Icon icon="lucide:trash-2" /></template>
            {{ $t('system.authClient.actions.batchDelete') }}
          </el-button>
        </div>
      </div>

      <div class="table-wrapper">
        <el-table ref="tableRef" :data="tableData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column
            prop="name"
            :label="$t('system.authClient.columns.name')"
            align="center"
          />
          <el-table-column
            prop="source"
            :label="$t('system.authClient.columns.source')"
            align="center"
          />
          <el-table-column
            prop="icon"
            :label="$t('system.authClient.columns.icon')"
            align="center"
            width="80"
          >
            <template #default="scope">
              <img v-if="scope.row.icon" :src="ossUrl + scope.row.icon" class="table-icon" />
            </template>
          </el-table-column>
          <el-table-column
            prop="clientId"
            :label="$t('system.authClient.columns.clientId')"
            align="center"
          />
          <el-table-column
            prop="sort"
            :label="$t('system.authClient.columns.sort')"
            align="center"
            width="80"
          />
          <el-table-column
            prop="status"
            :label="$t('system.authClient.columns.status')"
            align="center"
            width="80"
          >
            <template #default="scope">
              <el-tag
                :type="getDictItem('system_status', scope.row.status)?.listClass || 'info'"
                effect="plain"
                size="small"
                disable-transitions
              >
                {{ getDictItem('system_status', scope.row.status)?.value }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="remark"
            :label="$t('system.authClient.columns.remark')"
            align="center"
          />
          <el-table-column
            prop="createTime"
            :label="$t('system.authClient.columns.createTime')"
            align="center"
            min-width="160"
          />
          <el-table-column
            fixed="right"
            :label="$t('system.authClient.columns.action')"
            width="90"
            align="center"
          >
            <template #default="scope">
              <el-tooltip :content="$t('system.authClient.actions.edit')" placement="top">
                <el-button
                  type="warning"
                  text
                  bg
                  size="small"
                  @click="handleModify(scope.row)"
                  v-permission="['auth:clientConfig:update']"
                >
                  <Icon icon="lucide:pencil" />
                </el-button>
              </el-tooltip>
              <el-tooltip :content="$t('system.authClient.actions.delete')" placement="top">
                <el-button
                  type="danger"
                  text
                  bg
                  size="small"
                  @click="handleRemove(scope.row)"
                  v-permission="['auth:clientConfig:delete']"
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
          ? $t('system.authClient.dialogs.add')
          : $t('system.authClient.dialogs.edit')
      "
      width="min(760px, calc(100vw - 32px))"
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
          <el-col :span="12">
            <el-form-item prop="name" :label="$t('system.authClient.search.name')">
              <el-input
                v-model="formData.name"
                :placeholder="$t('system.authClient.formPlaceholder.name')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="source" :label="$t('system.authClient.search.source')">
              <el-input
                v-model="formData.source"
                :placeholder="$t('system.authClient.formPlaceholder.source')"
                maxlength="32"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="clientId" :label="$t('system.authClient.form.clientId')">
              <el-input
                v-model="formData.clientId"
                :placeholder="$t('system.authClient.formPlaceholder.clientId')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="clientSecret" :label="$t('system.authClient.form.clientSecret')">
              <el-input
                v-model="formData.clientSecret"
                :placeholder="$t('system.authClient.formPlaceholder.clientSecret')"
                show-password
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="icon" :label="$t('system.authClient.form.icon')">
              <el-upload
                v-model:file-list="iconFileList"
                list-type="picture"
                :limit="1"
                :http-request="handleIconUpload"
                :on-remove="handleIconRemove"
                :on-exceed="handleIconExceed"
              >
                <el-button type="primary" size="small">
                  <template #icon><Icon icon="lucide:upload" /></template>
                  {{ $t('system.authClient.actions.upload') }}
                </el-button>
                <template #tip>
                  <div class="el-upload__tip">{{ $t('system.authClient.upload.tip') }}</div>
                </template>
              </el-upload>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="sort" :label="$t('system.authClient.form.sort')">
              <el-input-number
                v-model="formData.sort"
                :min="0"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item prop="redirectUri" :label="$t('system.authClient.form.redirectUri')">
              <el-input
                v-model="formData.redirectUri"
                :placeholder="$t('system.authClient.formPlaceholder.redirectUri')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="status" :label="$t('system.authClient.form.status')">
              <el-radio-group v-model="formData.status">
                <el-radio
                  v-for="item in getDictList('system_status')"
                  :key="item.id"
                  :value="item.label"
                >
                  {{ item.value }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item prop="remark" :label="$t('system.authClient.form.remark')">
              <el-input
                type="textarea"
                v-model="formData.remark"
                :placeholder="$t('system.authClient.formPlaceholder.remark')"
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
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { useDict } from '@/common/composables/useDict'
import { useOssUrl } from '@@/composables/useOssUrl'
import { usePagination } from '@@/composables/usePagination'
import request from '@@/utils/request'
import type { FormRules } from 'element-plus'
import { cloneDeep } from 'lodash-es'
import {
  authClientConfigPage,
  addAuthClientConfig,
  modifyAuthClientConfigById,
  removeAuthClientConfigByIds,
} from './apis'
import type { AuthClientConfigVO, AuthClientConfigQueryVO } from './apis/type'

const { t } = useI18n()
const $t = t

defineOptions({
  name: 'authClient',
})

const { getDictList, getDictItem } = useDict(['system_status'])
const { ossUrl } = useOssUrl()

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const iconFileList = ref<any[]>([])

const searchFormRef = useTemplateRef('searchFormRef')
const searchData = reactive<AuthClientConfigQueryVO>({})

const tableRef = useTemplateRef('tableRef')
const tableData = ref<AuthClientConfigVO[]>([])

const formRef = useTemplateRef('formRef')
const formData = ref<any>({ status: '0', sort: 0 })

const formRules: FormRules = {
  source: [
    {
      required: true,
      trigger: 'blur',
      message: () => $t('system.authClient.formPlaceholder.source'),
    },
  ],
  clientId: [
    {
      required: true,
      trigger: 'blur',
      message: () => $t('system.authClient.formPlaceholder.clientId'),
    },
  ],
  clientSecret: [
    {
      required: true,
      trigger: 'blur',
      message: () => $t('system.authClient.formPlaceholder.clientSecret'),
    },
  ],
  icon: [
    {
      required: true,
      trigger: 'change',
      message: () => $t('system.authClient.formPlaceholder.icon'),
    },
  ],
  status: [
    {
      required: true,
      trigger: 'change',
      message: () => $t('system.authClient.formPlaceholder.status'),
    },
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
  formData.value = { status: '0', sort: 0 }
  iconFileList.value = []
}

function handleModify(row: AuthClientConfigVO) {
  dialogVisible.value = true
  formData.value = cloneDeep(row)
  if (row.icon && ossUrl.value) {
    iconFileList.value = [
      {
        uid: String(row.id ?? Date.now()),
        name: 'icon',
        url: ossUrl.value + row.icon,
      },
    ]
  } else {
    iconFileList.value = []
  }
}

function handleClose() {
  formData.value = { status: '0', sort: 0 }
  iconFileList.value = []
  formRef.value?.clearValidate()
}

function handleCreateOrUpdate() {
  formRef.value?.validate((valid) => {
    if (!valid) return
    submitLoading.value = true
    const isAdd = formData.value.id === undefined
    const api = isAdd
      ? addAuthClientConfig(formData.value)
      : modifyAuthClientConfigById(formData.value)
    api
      .then((res) => {
        ElMessage.success(res.msg || $t('system.authClient.messages.operationSuccess'))
        dialogVisible.value = false
        getTableData()
      })
      .finally(() => {
        submitLoading.value = false
      })
  })
}

function handleRemove(row: AuthClientConfigVO) {
  ElMessageBox.confirm(
    $t('system.authClient.messages.deleteConfirm', { name: row.name || row.source }),
    $t('common.messages.confirmTitle'),
    {
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel'),
      type: 'warning',
    },
  ).then(() => {
    removeAuthClientConfigByIds(String(row.id)).then((res) => {
      ElMessage.success(res.msg || $t('system.authClient.messages.deleteSuccess'))
      getTableData()
    })
  })
}

function handleBatchRemove() {
  const selectedRows = (tableRef.value?.getSelectionRows() as AuthClientConfigVO[]) || []
  if (selectedRows.length === 0) {
    ElMessage.warning($t('system.authClient.messages.selectFirst'))
    return
  }
  const ids = selectedRows.map((row) => row.id).join(',')
  ElMessageBox.confirm(
    $t('system.authClient.messages.batchDeleteConfirm', { count: selectedRows.length }),
    $t('common.messages.confirmTitle'),
    {
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel'),
      type: 'warning',
    },
  ).then(() => {
    removeAuthClientConfigByIds(ids).then((res) => {
      ElMessage.success(res.msg || $t('system.authClient.messages.deleteSuccess'))
      getTableData()
    })
  })
}

function handleIconUpload(options: any) {
  const { file, onSuccess, onError } = options
  const uploadFormData = new FormData()
  uploadFormData.append('file', file)
  return request({
    url: '/file/upload',
    method: 'POST',
    data: uploadFormData,
  })
    .then((res: any) => {
      if (res.data?.fileId) {
        formData.value.icon = res.data.fileId
      }
      onSuccess(res.data)
    })
    .catch(() => {
      onError()
      iconFileList.value = []
    })
}

function handleIconRemove() {
  formData.value.icon = ''
}

function handleIconExceed() {
  ElMessage.warning('只能上传一个图标文件')
}

function getTableData() {
  loading.value = true
  const params: AuthClientConfigQueryVO = {
    ...searchData,
    currentPage: paginationData.currentPage,
    pageSize: paginationData.pageSize,
  }
  authClientConfigPage(params)
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

.table-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  vertical-align: middle;
}

.el-upload__tip {
  font-size: 12px;
  color: var(--el-color-info);
  margin-top: 4px;
  line-height: 1.4;
}
</style>
