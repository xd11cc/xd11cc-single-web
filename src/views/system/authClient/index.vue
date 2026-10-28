<template>
  <UseCrudView
    :slotProps="crud.slotProps"
    :formRules="formRules"
    :add-title="$t('system.authClient.dialogs.add')"
    :edit-title="$t('system.authClient.dialogs.edit')"
    label-width="144px"
  >
    <!-- 搜索区字段 -->
    <template #search-form="{ searchData }">
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
          class="search-field"
        >
          <el-option
            v-for="item in getDictList('system_status')"
            :key="item.id"
            :label="item.value"
            :value="item.label!"
          />
        </el-select>
      </el-form-item>
    </template>

    <!-- 工具栏按钮 -->
    <template #actions>
      <el-button
        type="primary"
        @click="crud.methods.handleAdd"
        v-permission="['auth:clientConfig:add']"
      >
        <template #icon><Icon icon="lucide:plus-circle" /></template>
        {{ $t('common.add') }}
      </el-button>
      <el-button
        type="danger"
        @click="crud.methods.handleBatchRemove"
        v-permission="['auth:clientConfig:delete']"
      >
        <template #icon><Icon icon="lucide:trash-2" /></template>
        {{ $t('common.batchDelete') }}
      </el-button>
    </template>

    <!-- 表格列 -->
    <template #table="{ handleEdit, handleRemove }">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="name" :label="$t('system.authClient.columns.name')" />
      <el-table-column prop="source" :label="$t('system.authClient.columns.source')" />
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
      <el-table-column prop="clientId" :label="$t('system.authClient.columns.clientId')" />
      <el-table-column
        prop="sort"
        :label="$t('system.authClient.columns.sort')"
        align="right"
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
      <el-table-column prop="remark" :label="$t('system.authClient.columns.remark')" />
      <el-table-column
        prop="createTime"
        :label="$t('system.authClient.columns.createTime')"
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
              v-permission="['auth:clientConfig:update']"
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
              v-permission="['auth:clientConfig:delete']"
            >
              <Icon icon="lucide:trash-2" />
            </el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </template>

    <!-- 新增/修改表单字段 -->
    <template #form-fields="{ formData }">
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
    </template>
  </UseCrudView>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import type { FormRules } from 'element-plus'
import UseCrudView from '@/common/components/useCrud/index.vue'
import { useCrud } from '@/common/composables/useCrud'
import { useDict } from '@/common/composables/useDict'
import { useOssUrl } from '@@/composables/useOssUrl'
import { LONG_REQUEST_TIMEOUT } from '@@/utils/request'
import request from '@@/utils/request'
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

const iconFileList = ref<any[]>([])

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

const crud = useCrud<AuthClientConfigQueryVO, AuthClientConfigVO>({
  pageApi: (query) => authClientConfigPage(query),
  addApi: (data) => addAuthClientConfig(data),
  updateApi: (data) => modifyAuthClientConfigById(data),
  removeApi: (ids) => removeAuthClientConfigByIds(ids),
  defaultForm: () => ({ status: '0', sort: 0 }),
  removeConfirmText: (row) =>
    $t('system.authClient.messages.deleteConfirm', { name: row?.name || row?.source }),
  batchRemoveConfirmText: (count) => $t('system.authClient.messages.batchDeleteConfirm', { count }),
})

// 弹窗打开/关闭时同步上传组件的文件列表：
// 新增时清空，编辑时回显已有图标。
watch(
  () => crud.state.dialogVisible.value,
  (visible) => {
    if (!visible) {
      iconFileList.value = []
      return
    }
    const icon = crud.state.formData.value?.icon
    iconFileList.value =
      icon && ossUrl.value
        ? [{ uid: String(Date.now()), name: 'icon', url: ossUrl.value + icon }]
        : []
  },
)

function handleIconUpload(options: any) {
  const { file, onSuccess, onError } = options
  const uploadFormData = new FormData()
  uploadFormData.append('file', file)
  return request({
    url: '/file/upload',
    method: 'POST',
    data: uploadFormData,
    timeout: LONG_REQUEST_TIMEOUT,
  })
    .then((res: any) => {
      if (res.data?.fileId) {
        crud.state.formData.value.icon = res.data.fileId
      }
      onSuccess(res.data)
    })
    .catch(() => {
      onError()
      iconFileList.value = []
    })
}

function handleIconRemove() {
  crud.state.formData.value.icon = ''
}

function handleIconExceed() {
  ElMessage.warning($t('system.authClient.upload.limit'))
}
</script>

<style lang="scss" scoped>
.table-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  vertical-align: middle;
}

.el-upload__tip {
  font-size: var(--p-text-sm);
  color: var(--el-color-info);
  margin-top: var(--p-space-1);
  line-height: 1.4;
}
</style>
