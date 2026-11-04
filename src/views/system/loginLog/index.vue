<template>
  <UseCrudView :columns="columns" :slotProps="crud.slotProps" readonly>
    <!-- 搜索区字段 -->
    <template #search-form="{ searchData }">
      <el-form-item prop="username" :label="$t('system.loginLog.search.username')">
        <el-input
          v-model="searchData.username"
          :placeholder="$t('system.loginLog.formPlaceholder.username')"
        />
      </el-form-item>
      <el-form-item prop="loginType" :label="$t('system.loginLog.search.loginType')">
        <el-select
          v-model="searchData.loginType"
          :placeholder="$t('system.loginLog.formPlaceholder.loginType')"
          clearable
          class="search-field"
        >
          <el-option
            v-for="item in getDictList('system_login_type')"
            :key="item.id"
            :label="item.label"
            :value="item.value!"
          />
        </el-select>
      </el-form-item>
      <el-form-item prop="status" :label="$t('system.loginLog.search.status')">
        <el-select
          v-model="searchData.status"
          :placeholder="$t('system.loginLog.formPlaceholder.status')"
          clearable
          class="search-field"
        >
          <el-option
            v-for="item in getDictList('system_operate_status')"
            :key="item.id"
            :label="item.label"
            :value="item.value!"
          />
        </el-select>
      </el-form-item>
    </template>

    <!-- 工具栏：批量删除 + 清空（只读列表没有新增） -->
    <template #actions="{ handleBatchRemove }">
      <el-button type="danger" @click="handleBatchRemove" v-permission="['system:loginLog:delete']">
        <template #icon><Icon icon="lucide:trash-2" /></template>
        {{ $t('common.batchDelete') }}
      </el-button>
      <el-button type="danger" plain @click="handleClean" v-permission="['system:loginLog:clean']">
        <template #icon><Icon icon="lucide:trash" /></template>
        {{ $t('system.loginLog.actions.clean') }}
      </el-button>
    </template>

    <!-- 表格列 -->
    <!-- 固定列：不参与列设置 -->
    <template #table-prefix>
      <el-table-column type="selection" width="50" align="center" />
    </template>

    <template #cell-loginType="{ row }">
      <el-tag
        :type="getDictItem('system_login_type', row.loginType)?.listClass || 'info'"
        effect="plain"
        size="small"
        disable-transitions
      >
        {{ getDictItem('system_login_type', row.loginType)?.label || row.loginType }}
      </el-tag>
    </template>

    <template #cell-status="{ row }">
      <el-tag
        :type="getDictItem('system_operate_status', row.status)?.listClass || 'info'"
        effect="plain"
        size="small"
        disable-transitions
      >
        {{ getDictItem('system_operate_status', row.status)?.label || row.status }}
      </el-tag>
    </template>

    <!-- 操作列：固定在生成列之后 -->
    <template #table-append="{ handleRemove }">
      <el-table-column fixed="right" :label="$t('common.action')" width="70" align="center">
        <template #default="scope">
          <el-tooltip :content="$t('common.delete')" placement="top">
            <el-button
              type="danger"
              text
              bg
              size="small"
              @click="handleRemove(scope.row)"
              v-permission="['system:loginLog:delete']"
            >
              <Icon icon="lucide:trash-2" />
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
import { useDict } from '@/common/composables/useDict'
import { loginLogPage, removeLoginLogByIds, cleanLoginLog } from './apis'
import type { SystemLoginLogQueryVO, SystemLoginLogVO } from './apis/type'
import type { TableColumnDef } from '@@/composables/useTableColumns'

const { t } = useI18n()
const $t = t

defineOptions({
  name: 'LoginLog',
})

const { getDictList, getDictItem } = useDict(['system_login_type', 'system_operate_status'])

// 只读列表：只有查询与删除，没有新增/编辑
// 列定义：排序 / 显隐 / 列宽由列表壳统一管理
const columns = computed<TableColumnDef[]>(() => [
  { prop: 'username', label: t('system.loginLog.columns.username') },
  {
    prop: 'loginType',
    label: t('system.loginLog.columns.loginType'),
    width: 100,
    align: 'center',
  },
  { prop: 'status', label: t('system.loginLog.columns.status'), width: 80, align: 'center' },
  { prop: 'loginIp', label: t('system.loginLog.columns.loginIp'), width: 140 },
  { prop: 'browser', label: t('system.loginLog.columns.browser') },
  { prop: 'os', label: t('system.loginLog.columns.os') },
  { prop: 'msg', label: t('system.loginLog.columns.msg') },
  {
    prop: 'loginTime',
    label: t('system.loginLog.columns.loginTime'),
    minWidth: 160,
    align: 'center',
  },
])

const crud = useCrud<SystemLoginLogQueryVO, SystemLoginLogVO>({
  pageApi: (query) => loginLogPage(query),
  removeApi: (ids) => removeLoginLogByIds(ids),
  removeConfirmText: () => $t('system.loginLog.messages.deleteConfirm'),
  batchRemoveConfirmText: (count) => $t('system.loginLog.messages.batchDeleteConfirm', { count }),
})

function handleClean() {
  ElMessageBox.confirm(
    $t('system.loginLog.messages.cleanConfirm'),
    $t('common.messages.warningTitle'),
    {
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel'),
      type: 'error',
    },
  ).then(() => {
    cleanLoginLog().then(() => {
      ElMessage.success($t('system.loginLog.messages.cleanSuccess'))
      crud.refresh()
    })
  })
}
</script>
