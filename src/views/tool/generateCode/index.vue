<template>
  <UseCrudView :columns="columns" :slotProps="crud.slotProps" readonly>
    <!-- 搜索区字段 -->
    <template #search-form="{ searchData }">
      <el-form-item prop="tableName" :label="$t('tool.generateCode.search.tableName')">
        <el-input
          v-model="searchData.tableName"
          :placeholder="$t('tool.generateCode.search.tableNamePlaceholder')"
        />
      </el-form-item>
      <el-form-item prop="tableComment" :label="$t('tool.generateCode.search.tableComment')">
        <el-input
          v-model="searchData.tableComment"
          :placeholder="$t('tool.generateCode.search.tableCommentPlaceholder')"
        />
      </el-form-item>
    </template>

    <!-- 表格列 -->
    <!-- 固定列：不参与列设置 -->
    <template #table-prefix>
      <el-table-column type="selection" width="50" align="center" />
    </template>

    <!-- 操作列：固定在生成列之后 -->
    <template #table-append="">
      <el-table-column fixed="right" :label="$t('common.action')" width="70" align="center">
        <template #default="scope">
          <el-tooltip :content="$t('tool.generateCode.actions.generate')" placement="top">
            <el-button
              type="success"
              text
              bg
              size="small"
              @click="handleGenerateCode(scope.row)"
              v-permission="['system:generate:code']"
            >
              <Icon icon="lucide:code-2" />
            </el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </template>

    <!-- 页面自有弹窗 / 抽屉：放进 #extra，保证壳只有一个根节点 -->
    <template #extra>
      <!-- 代码预览：不属于新增/编辑，放在壳的同一级 -->
      <el-dialog
        v-model="dialogVisible"
        :title="$t('tool.generateCode.dialog.title')"
        width="80%"
        class="generate-code-dialog"
        append-to-body
        destroy-on-close
      >
        <el-tabs v-model="activeTab" v-loading="previewLoading" class="code-tabs">
          <el-tab-pane
            v-for="item in previewCodeData"
            :key="item.fileName"
            :label="item.fileName"
            :name="item.fileName"
          >
            <CodeBlock :code="item.content" language="java" max-height="calc(90vh - 190px)" />
          </el-tab-pane>
        </el-tabs>
      </el-dialog>
    </template>
  </UseCrudView>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import UseCrudView from '@/common/components/useCrud/index.vue'
import { useCrud } from '@/common/composables/useCrud'
import { useLatestRequest } from '@/common/composables/useLatestRequest'
import type { TableColumnDef } from '@@/composables/useTableColumns'
import { type PreviewCodeVO, type TableInfoQueryVO, type TableInfoVO } from './apis/type'
import { generateCodePage, generateCode } from './apis'
import CodeBlock from './components/CodeBlock.vue'

const { t } = useI18n()
const $t = t

defineOptions({
  name: 'GenerateCode',
})

// 只读列表：代码生成没有新增/编辑，只有「生成并预览」这一动作
// 列定义：排序 / 显隐 / 列宽由列表壳统一管理
const columns = computed<TableColumnDef[]>(() => [
  { prop: 'tableName', label: t('tool.generateCode.columns.tableName') },
  { prop: 'tableComment', label: t('tool.generateCode.columns.tableComment') },
  { prop: 'createTime', label: t('tool.generateCode.columns.createTime'), align: 'center' },
])

const crud = useCrud<TableInfoQueryVO, TableInfoVO>({
  pageApi: (query) => generateCodePage(query),
})

const dialogVisible = ref(false)
const previewCodeData = ref<PreviewCodeVO[]>([])
const activeTab = ref('')

// 连续点不同行的「生成代码」时，先发的请求可能后回来，把预览换成上一张表的代码
const previewRequest = useLatestRequest()

const previewLoading = ref(false)

function handleGenerateCode(row: TableInfoVO) {
  if (!row.tableName) return
  dialogVisible.value = true
  // 先清空：否则加载期间弹窗里还是上一张表的代码，用户可能复制错
  previewCodeData.value = []
  activeTab.value = ''
  previewLoading.value = true
  const requestId = previewRequest.begin()
  generateCode(row.tableName)
    .then((res) => {
      if (!previewRequest.isCurrent(requestId)) return
      previewCodeData.value = res.data
      activeTab.value = res.data[0]?.fileName ?? ''
    })
    .catch(() => {
      if (!previewRequest.isCurrent(requestId)) return
      previewCodeData.value = []
    })
    .finally(() => {
      if (previewRequest.isCurrent(requestId)) previewLoading.value = false
    })
}
</script>

<style lang="scss" scoped>
.code-tabs {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.code-tabs :deep(.el-tabs__header) {
  flex: 0 0 auto;
}

.code-tabs :deep(.el-tabs__content),
.code-tabs :deep(.el-tab-pane) {
  min-height: 0;
}
</style>
