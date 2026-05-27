<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="name" label="应用名称">
          <el-input v-model="searchData.name" placeholder="请输入应用名称" />
        </el-form-item>
        <el-form-item prop="source" label="应用类型">
          <el-input v-model="searchData.source" placeholder="请输入应用类型" />
        </el-form-item>
        <el-form-item prop="status" label="状态">
          <el-select v-model="searchData.status" placeholder="状态" clearable style="width: 150px">
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
            <template #icon><Icon icon="lucide:search" /></template>查询
          </el-button>
          <el-button @click="resetSearch">
            <template #icon><Icon icon="lucide:rotate-ccw" /></template>重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" @click="handleAdd" v-permission="['auth:clientConfig:add']">
            <template #icon><Icon icon="lucide:plus-circle" /></template>
            新增
          </el-button>
          <el-button type="danger" @click="handleBatchRemove" v-permission="['auth:clientConfig:delete']">
            <template #icon><Icon icon="lucide:trash-2" /></template>
            批量删除
          </el-button>
        </div>
      </div>

      <div class="table-wrapper">
        <el-table ref="tableRef" :data="tableData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="name" label="应用名称" align="center" show-overflow-tooltip />
          <el-table-column prop="source" label="应用类型" align="center" show-overflow-tooltip />
          <el-table-column prop="icon" label="图标" align="center" width="80">
            <template #default="scope">
              <img v-if="scope.row.icon" :src="ossUrl + scope.row.icon" class="table-icon" />
            </template>
          </el-table-column>
          <el-table-column prop="clientId" label="应用ID" align="center" show-overflow-tooltip />
          <el-table-column prop="sort" label="排序" align="center" width="80" />
          <el-table-column prop="status" label="状态" align="center" width="80">
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
          <el-table-column prop="remark" label="备注" align="center" show-overflow-tooltip />
          <el-table-column prop="createTime" label="创建时间" align="center" min-width="160" show-overflow-tooltip />
          <el-table-column fixed="right" label="操作" width="150" align="center">
            <template #default="scope">
              <el-button
                type="primary"
                text
                bg
                size="small"
                @click="handleModify(scope.row)"
                v-permission="['auth:clientConfig:update']"
              >修改</el-button>
              <el-button
                type="danger"
                text
                bg
                size="small"
                @click="handleRemove(scope.row)"
                v-permission="['auth:clientConfig:delete']"
              >删除</el-button>
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
      :title="formData.id === undefined ? '新增授权应用' : '修改授权应用'"
      width="40%"
      @close="handleClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        label-position="left"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item prop="name" label="应用名称">
              <el-input v-model="formData.name" placeholder="请输入应用名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="source" label="应用类型">
              <el-input v-model="formData.source" placeholder="请输入应用类型" maxlength="32" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="clientId" label="应用ID">
              <el-input v-model="formData.clientId" placeholder="请输入应用ID" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="clientSecret" label="应用密钥">
              <el-input v-model="formData.clientSecret" placeholder="请输入应用密钥" show-password />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="icon" label="图标">
              <el-input v-model="formData.icon" placeholder="请输入图标标识" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="sort" label="排序">
              <el-input-number v-model="formData.sort" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item prop="redirectUri" label="重定向地址">
              <el-input v-model="formData.redirectUri" placeholder="请输入重定向地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="status" label="状态">
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
            <el-form-item prop="remark" label="备注">
              <el-input
                type="textarea"
                v-model="formData.remark"
                placeholder="请输入内容"
                autosize
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleCreateOrUpdate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useDict } from '@/common/composables/useDict'
import { useOssUrl } from '@@/composables/useOssUrl'
import { usePagination } from '@@/composables/usePagination'
import type { FormRules } from 'element-plus'
import { cloneDeep } from 'lodash-es'
import {
  authClientConfigPage,
  addAuthClientConfig,
  modifyAuthClientConfigById,
  removeAuthClientConfigByIds,
} from './apis'
import type { AuthClientConfigVO, AuthClientConfigQueryVO } from './apis/type'

defineOptions({
  name: 'authClient',
})

const { getDictList, getDictItem } = useDict(['system_status'])
const { ossUrl } = useOssUrl()

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)

const searchFormRef = useTemplateRef('searchFormRef')
const searchData = reactive<AuthClientConfigQueryVO>({})

const tableRef = useTemplateRef('tableRef')
const tableData = ref<AuthClientConfigVO[]>([])

const formRef = useTemplateRef('formRef')
const formData = ref<any>({ status: '0', sort: 0 })

const formRules: FormRules = {
  source: [{ required: true, trigger: 'blur', message: '请输入应用类型' }],
  clientId: [{ required: true, trigger: 'blur', message: '请输入应用ID' }],
  clientSecret: [{ required: true, trigger: 'blur', message: '请输入应用密钥' }],
  icon: [{ required: true, trigger: 'blur', message: '请输入图标标识' }],
  status: [{ required: true, trigger: 'change', message: '请选择状态' }],
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
}

function handleModify(row: AuthClientConfigVO) {
  dialogVisible.value = true
  formData.value = cloneDeep(row)
}

function handleClose() {
  formData.value = { status: '0', sort: 0 }
  formRef.value?.clearValidate()
}

function handleCreateOrUpdate() {
  formRef.value?.validate((valid) => {
    if (!valid) return
    submitLoading.value = true
    const isAdd = formData.value.id === undefined
    const api = isAdd ? addAuthClientConfig(formData.value) : modifyAuthClientConfigById(formData.value)
    api
      .then((res) => {
        ElMessage.success(res.msg || '操作成功')
        dialogVisible.value = false
        getTableData()
      })
      .finally(() => {
        submitLoading.value = false
      })
  })
}

function handleRemove(row: AuthClientConfigVO) {
  ElMessageBox.confirm(`正在删除授权应用「${row.name || row.source}」，确认删除？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    removeAuthClientConfigByIds(String(row.id)).then((res) => {
      ElMessage.success(res.msg || '删除成功')
      getTableData()
    })
  })
}

function handleBatchRemove() {
  const selectedRows = (tableRef.value?.getSelectionRows() as AuthClientConfigVO[]) || []
  if (selectedRows.length === 0) {
    ElMessage.warning('请选择要删除的数据')
    return
  }
  const ids = selectedRows.map((row) => row.id).join(',')
  ElMessageBox.confirm(`正在删除 ${selectedRows.length} 条授权应用数据，确认删除？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    removeAuthClientConfigByIds(ids).then((res) => {
      ElMessage.success(res.msg || '删除成功')
      getTableData()
    })
  })
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
</style>
