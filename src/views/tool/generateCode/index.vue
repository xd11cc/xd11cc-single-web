<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData" @keyup.enter="handleSearch">
        <el-form-item prop="tableName" label="表名称">
          <el-input v-model="searchData.tableName" placeholder="请输入表名称" />
        </el-form-item>
        <el-form-item prop="tableComment" label="表注释">
          <el-input v-model="searchData.tableComment" placeholder="请输入表注释" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <template #icon><Icon icon="lucide:search" /></template> 查询
          </el-button>
          <el-button @click="resetSearch">
            <template #icon><Icon icon="lucide:rotate-ccw" /></template> 重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card v-loading="loading" shadow="never">
      <div class="table-wrapper">
        <el-table ref="tableRef" :data="tableData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="tableName" label="表名称" align="center" />
          <el-table-column prop="tableComment" label="表注释" align="center" />
          <el-table-column prop="createTime" label="创建时间" align="center" />
          <el-table-column fixed="right" label="操作" width="150" align="center">
            <template #default="scope">
              <el-button
                type="success"
                text
                bg
                size="small"
                @click="handleGenerateCode(scope.row)"
                v-permission="['system:generate:code']"
                >生成代码</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="dictTypePage-wrapper">
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
    <el-dialog v-model="dialogVisible" title="生成代码" width="80%" @close="handleClose">
      <el-tabs v-model="activeTab" class="code-tabs">
        <el-tab-pane
          v-for="item in previewCodeData"
          :key="item.fileName"
          :label="item.fileName"
          :name="item.fileName"
        >
          <CodeBlock :code="item.content" language="java" />
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { usePagination } from '@@/composables/usePagination'
import { PreviewCodeVO, type TableInfoQueryVO, type TableInfoVO } from './apis/type'
import { generateCodePage, generateCode } from './apis'
import CodeBlock from './components/CodeBlock.vue'

defineOptions({
  name: 'generateCode',
})

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const loading = ref<boolean>(false)

const dialogVisible = ref<boolean>(false)

const searchData: TableInfoQueryVO = reactive({})

const tableData = ref<TableInfoVO[]>([])

const previewCodeData = ref<PreviewCodeVO[]>([])

const activeTab = ref<string>('')

const searchFormRef = useTemplateRef('searchFormRef')

function handleSearch() {
  getTableData()
}

function resetSearch() {
  searchFormRef.value?.resetFields()
  getTableData()
}

function handleGenerateCode(row: any) {
  dialogVisible.value = true
  generateCode(row.tableName).then((res) => {
    previewCodeData.value = res.data
    activeTab.value = res.data[0].fileName
  })
}

function handleClose() {}

function getTableData() {
  loading.value = true
  const requestParam = {
    ...searchData,
    currentPage: paginationData.currentPage,
    pageSize: paginationData.pageSize,
  }
  generateCodePage(requestParam)
    .then(({ data }) => {
      paginationData.total = data.total
      tableData.value = data.rows
    })
    .catch(() => {
      tableData.value = []
    })
    .finally(() => {
      loading.value = false
    })
}

// 监听分页变化
watch([() => paginationData.currentPage, () => paginationData.pageSize], getTableData, {
  immediate: true,
})
</script>

<style lang="scss" scoped></style>
