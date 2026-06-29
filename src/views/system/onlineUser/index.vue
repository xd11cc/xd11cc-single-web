<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="username" label="用户名">
          <el-input v-model="searchData.username" placeholder="请输入用户名" />
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
      <div class="table-wrapper">
        <el-table :data="tableData">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="username" label="用户名" align="center" />
          <el-table-column prop="ipAddr" label="登录IP" align="center" width="140" />
          <el-table-column prop="browser" label="浏览器" align="center" />
          <el-table-column prop="os" label="操作系统" align="center" />
          <el-table-column prop="loginTime" label="登录时间" align="center" min-width="160" />
          <el-table-column fixed="right" label="操作" width="100" align="center">
            <template #default="scope">
              <el-button
                type="danger"
                text
                bg
                size="small"
                @click="handleForceLogout(scope.row)"
                v-permission="['system:onlineUser:forceLogout']"
              >强退</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { onlineUserList, forceLogout } from './apis'
import type { OnlineUserVO } from './apis/type'

defineOptions({
  name: 'onlineUser',
})

const loading = ref(false)

const searchFormRef = useTemplateRef('searchFormRef')
const searchData = reactive<{ username?: string }>({})

const tableData = ref<OnlineUserVO[]>([])

function handleSearch() {
  getTableData()
}

function resetSearch() {
  searchFormRef.value?.resetFields()
  getTableData()
}

function handleForceLogout(row: OnlineUserVO) {
  ElMessageBox.confirm(`确认强退用户「${row.username}」？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    if (row.tokenId) {
      forceLogout(row.tokenId).then(() => {
        ElMessage.success('强退成功')
        getTableData()
      })
    }
  })
}

function getTableData() {
  loading.value = true
  onlineUserList(searchData.username)
    .then(({ data }) => {
      tableData.value = data
    })
    .catch(() => {
      tableData.value = []
    })
    .finally(() => {
      loading.value = false
    })
}

getTableData()
</script>

<style lang="scss" scoped>
.search-wrapper {
  margin-bottom: 20px;
  :deep(.el-card__body) {
    padding-bottom: 2px;
  }
}

.table-wrapper {
  margin-bottom: 20px;
}
</style>
