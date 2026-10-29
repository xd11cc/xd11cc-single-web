<template>
  <UseCrudView :slotProps="crud.slotProps" readonly>
    <!-- 搜索区字段 -->
    <template #search-form="{ searchData }">
      <el-form-item prop="module" :label="$t('system.operateLog.search.module')">
        <el-input
          v-model="searchData.module"
          :placeholder="$t('system.operateLog.formPlaceholder.module')"
        />
      </el-form-item>
      <el-form-item prop="operateType" :label="$t('system.operateLog.search.operateType')">
        <el-select
          v-model="searchData.operateType"
          :placeholder="$t('system.operateLog.formPlaceholder.operateType')"
          clearable
          class="search-field"
        >
          <el-option
            v-for="item in getDictList('system_operate_type')"
            :key="item.id"
            :label="item.label"
            :value="item.value!"
          />
        </el-select>
      </el-form-item>
      <el-form-item prop="status" :label="$t('system.operateLog.search.status')">
        <el-select
          v-model="searchData.status"
          :placeholder="$t('system.operateLog.formPlaceholder.status')"
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
      <el-button
        type="danger"
        @click="handleBatchRemove"
        v-permission="['system:operateLog:delete']"
      >
        <template #icon><Icon icon="lucide:trash-2" /></template>
        {{ $t('common.batchDelete') }}
      </el-button>
      <el-button
        type="danger"
        plain
        @click="handleClean"
        v-permission="['system:operateLog:clean']"
      >
        <template #icon><Icon icon="lucide:trash" /></template>
        {{ $t('system.operateLog.actions.clean') }}
      </el-button>
    </template>

    <!-- 表格列 -->
    <template #table="{ handleRemove }">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="module" :label="$t('system.operateLog.columns.module')" />
      <el-table-column
        prop="operateType"
        :label="$t('system.operateLog.columns.operateType')"
        align="center"
        width="100"
      >
        <template #default="scope">
          <el-tag
            :type="getDictItem('system_operate_type', scope.row.operateType)?.listClass || 'info'"
            effect="plain"
            size="small"
            disable-transitions
          >
            {{
              getDictItem('system_operate_type', scope.row.operateType)?.label ||
              scope.row.operateType
            }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="requestMethod"
        :label="$t('system.operateLog.columns.requestMethod')"
        width="100"
      />
      <el-table-column
        prop="operateIp"
        :label="$t('system.operateLog.columns.operateIp')"
        width="140"
      />
      <el-table-column
        prop="status"
        :label="$t('system.operateLog.columns.status')"
        align="center"
        width="80"
      >
        <template #default="scope">
          <el-tag
            :type="getDictItem('system_operate_status', scope.row.status)?.listClass || 'info'"
            effect="plain"
            size="small"
            disable-transitions
          >
            {{ getDictItem('system_operate_status', scope.row.status)?.label || scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="costTime"
        :label="$t('system.operateLog.columns.costTime')"
        align="center"
        width="100"
      >
        <template #default="scope"> {{ scope.row.costTime }}ms </template>
      </el-table-column>
      <el-table-column
        prop="createTime"
        :label="$t('system.operateLog.columns.createTime')"
        align="center"
        min-width="160"
      />
      <el-table-column fixed="right" :label="$t('common.action')" width="90" align="center">
        <template #default="scope">
          <el-tooltip :content="$t('system.operateLog.actions.detail')" placement="top">
            <el-button type="primary" text bg size="small" @click="handleDetail(scope.row)">
              <Icon icon="lucide:eye" />
            </el-button>
          </el-tooltip>
          <el-tooltip :content="$t('common.delete')" placement="top">
            <el-button
              type="danger"
              text
              bg
              size="small"
              @click="handleRemove(scope.row)"
              v-permission="['system:operateLog:delete']"
            >
              <Icon icon="lucide:trash-2" />
            </el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </template>

    <!-- 页面自有弹窗 / 抽屉：放进 #extra，保证壳只有一个根节点 -->
    <template #extra>
      <!-- 详情弹窗：不属于新增/编辑，放在壳的同一级 -->
      <!-- 详情弹窗 -->
      <el-dialog
        v-model="detailVisible"
        :title="$t('system.operateLog.dialogs.detail')"
        width="50%"
      >
        <el-descriptions :column="2" border>
          <el-descriptions-item :label="$t('system.operateLog.detail.module')">{{
            detailData.module
          }}</el-descriptions-item>
          <el-descriptions-item :label="$t('system.operateLog.detail.operateType')">
            {{
              getDictItem('system_operate_type', detailData.operateType || '')?.label ||
              detailData.operateType
            }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('system.operateLog.detail.requestMethod')">{{
            detailData.requestMethod
          }}</el-descriptions-item>
          <el-descriptions-item :label="$t('system.operateLog.detail.status')">
            <el-tag
              :type="
                getDictItem('system_operate_status', detailData.status || '')?.listClass || 'info'
              "
              effect="plain"
              size="small"
            >
              {{
                getDictItem('system_operate_status', detailData.status || '')?.label ||
                detailData.status
              }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('system.operateLog.detail.operateDesc')" :span="2">{{
            detailData.operateDesc
          }}</el-descriptions-item>
          <el-descriptions-item :label="$t('system.operateLog.detail.requestUrl')" :span="2">{{
            detailData.requestUrl
          }}</el-descriptions-item>
          <el-descriptions-item :label="$t('system.operateLog.detail.method')" :span="2">{{
            detailData.method
          }}</el-descriptions-item>
          <el-descriptions-item :label="$t('system.operateLog.detail.operateIp')">{{
            detailData.operateIp
          }}</el-descriptions-item>
          <el-descriptions-item :label="$t('system.operateLog.detail.costTime')"
            >{{ detailData.costTime }}ms</el-descriptions-item
          >
          <el-descriptions-item :label="$t('system.operateLog.detail.requestParam')" :span="2">
            <el-input
              v-if="detailData.requestParam"
              type="textarea"
              :model-value="detailData.requestParam"
              readonly
              :autosize="{ minRows: 2, maxRows: 6 }"
            />
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('system.operateLog.detail.responseResult')" :span="2">
            <el-input
              v-if="detailData.responseResult"
              type="textarea"
              :model-value="detailData.responseResult"
              readonly
              :autosize="{ minRows: 2, maxRows: 6 }"
            />
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item
            v-if="detailData.errorMsg"
            :label="$t('system.operateLog.detail.errorMsg')"
            :span="2"
          >
            <el-input
              type="textarea"
              :model-value="detailData.errorMsg"
              readonly
              :autosize="{ minRows: 2, maxRows: 4 }"
            />
          </el-descriptions-item>
          <el-descriptions-item :label="$t('system.operateLog.detail.createTime')" :span="2">{{
            detailData.createTime
          }}</el-descriptions-item>
        </el-descriptions>
        <template #footer>
          <el-button @click="detailVisible = false">{{ $t('common.close') }}</el-button>
        </template>
      </el-dialog>
    </template>
  </UseCrudView>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import UseCrudView from '@/common/components/useCrud/index.vue'
import { useCrud } from '@/common/composables/useCrud'
import { useDict } from '@/common/composables/useDict'
import { operateLogPage, removeOperateLogByIds, cleanOperateLog } from './apis'
import type { SystemOperateLogQueryVO, SystemOperateLogVO } from './apis/type'

const { t } = useI18n()
const $t = t

defineOptions({
  name: 'OperateLog',
})

const { getDictList, getDictItem } = useDict(['system_operate_type', 'system_operate_status'])

// 只读列表：只有查询与删除，没有新增/编辑
const crud = useCrud<SystemOperateLogQueryVO, SystemOperateLogVO>({
  pageApi: (query) => operateLogPage(query),
  removeApi: (ids) => removeOperateLogByIds(ids),
  removeConfirmText: () => $t('system.operateLog.messages.deleteConfirm'),
  batchRemoveConfirmText: (count) => $t('system.operateLog.messages.batchDeleteConfirm', { count }),
})

const detailVisible = ref(false)
const detailData = ref<SystemOperateLogVO>({})

function handleDetail(row: SystemOperateLogVO) {
  detailData.value = row
  detailVisible.value = true
}

function handleClean() {
  ElMessageBox.confirm(
    $t('system.operateLog.messages.cleanConfirm'),
    $t('common.messages.warningTitle'),
    {
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel'),
      type: 'error',
    },
  ).then(() => {
    cleanOperateLog().then(() => {
      ElMessage.success($t('system.operateLog.messages.cleanSuccess'))
      crud.refresh()
    })
  })
}
</script>
