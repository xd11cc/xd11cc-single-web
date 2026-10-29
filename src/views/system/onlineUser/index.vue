<template>
  <UseCrudView :slotProps="crud.slotProps" readonly hide-pagination>
    <!-- 搜索区字段 -->
    <template #search-form="{ searchData }">
      <el-form-item prop="username" :label="$t('system.onlineUser.search.username')">
        <el-input
          v-model="searchData.username"
          :placeholder="$t('system.onlineUser.formPlaceholder.username')"
        />
      </el-form-item>
    </template>

    <!-- 表格列 -->
    <template #table>
      <el-table-column
        type="index"
        :label="$t('system.onlineUser.columns.index')"
        width="60"
        align="center"
      />
      <el-table-column prop="username" :label="$t('system.onlineUser.columns.username')" />
      <el-table-column prop="ipAddr" :label="$t('system.onlineUser.columns.ipAddr')" width="140" />
      <el-table-column prop="browser" :label="$t('system.onlineUser.columns.browser')" />
      <el-table-column prop="os" :label="$t('system.onlineUser.columns.os')" />
      <el-table-column
        prop="loginTime"
        :label="$t('system.onlineUser.columns.loginTime')"
        align="center"
        min-width="160"
      />
      <el-table-column fixed="right" :label="$t('common.action')" width="70" align="center">
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
    </template>
  </UseCrudView>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import UseCrudView from '@/common/components/useCrud/index.vue'
import { useCrud } from '@/common/composables/useCrud'
import { onlineUserList, forceLogout } from './apis'
import type { OnlineUserVO } from './apis/type'

const { t } = useI18n()
const $t = t

defineOptions({
  name: 'OnlineUser',
})

// 在线用户是「一次性返回全量」的接口，没有分页。
// 在适配层把数组包装成分页结构，页面即可复用同一套壳（分页区用 hide-pagination 隐藏）。
const crud = useCrud<{ username?: string }, OnlineUserVO>({
  pageApi: async (query) => {
    const res = await onlineUserList(query.username)
    const rows = res.data ?? []
    return { ...res, data: { rows, total: rows.length } }
  },
})

function handleForceLogout(row: OnlineUserVO) {
  ElMessageBox.confirm(
    $t('system.onlineUser.messages.forceLogoutConfirm', { username: row.username }),
    $t('common.messages.confirmTitle'),
    {
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel'),
      type: 'warning',
    },
  ).then(() => {
    if (row.tokenId) {
      forceLogout(row.tokenId).then(() => {
        ElMessage.success($t('system.onlineUser.messages.forceLogoutSuccess'))
        crud.refresh()
      })
    }
  })
}
</script>
