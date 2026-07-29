<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="username" :label="$t('system.onlineUser.search.username')">
          <el-input v-model="searchData.username" :placeholder="$t('system.onlineUser.formPlaceholder.username')" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <template #icon><Icon icon="lucide:search" /></template>{{ $t('common.search') }}
          </el-button>
          <el-button @click="resetSearch">
            <template #icon><Icon icon="lucide:rotate-ccw" /></template>{{ $t('common.reset') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" shadow="never">
      <div class="table-wrapper">
        <el-table :data="tableData">
          <el-table-column type="index" :label="$t('system.onlineUser.columns.index')" width="60" align="center" />
          <el-table-column prop="username" :label="$t('system.onlineUser.columns.username')" align="center" />
          <el-table-column prop="ipAddr" :label="$t('system.onlineUser.columns.ipAddr')" align="center" width="140" />
          <el-table-column prop="browser" :label="$t('system.onlineUser.columns.browser')" align="center" />
          <el-table-column prop="os" :label="$t('system.onlineUser.columns.os')" align="center" />
          <el-table-column prop="loginTime" :label="$t('system.onlineUser.columns.loginTime')" align="center" min-width="160" />
          <el-table-column fixed="right" :label="$t('system.onlineUser.columns.action')" width="70" align="center">
            <template #default="scope">
              <el-tooltip :content="$t('system.onlineUser.actions.forceLogout')" placement="top">
                <el-button
                  type="danger"
                  text
                  bg
                  size="small"
                  @click="handleForceLogout(scope.row)"
                  v-permission="['system:onlineUser:forceLogout']"
                >
                  <Icon icon="lucide:log-out" />
                </el-button>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n"
import { Icon } from '@iconify/vue'
import { onlineUserList, forceLogout } from './apis'
import type { OnlineUserVO } from './apis/type'

const { t } = useI18n(); const $t = t

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
  ElMessageBox.confirm(
    $t('system.onlineUser.messages.forceLogoutConfirm', { username: row.username }),
    $t('common.messages.confirmTitle'),
    {
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel'),
      type: 'warning',
    }
  ).then(() => {
    if (row.tokenId) {
      forceLogout(row.tokenId).then(() => {
        ElMessage.success($t('system.onlineUser.messages.forceLogoutSuccess'))
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
