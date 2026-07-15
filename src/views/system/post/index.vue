<template>
  <UseCrudView :slotProps="crud.slotProps" :formRules="formRules" add-title="新增岗位" edit-title="修改岗位">
    <!-- 搜索区字段 -->
    <template #search-form="{ searchData }">
      <el-form-item prop="postCode" label="岗位编码">
        <el-input v-model="searchData.postCode" placeholder="请输入岗位编码" />
      </el-form-item>
      <el-form-item prop="postName" label="岗位名称">
        <el-input v-model="searchData.postName" placeholder="请输入岗位名称" />
      </el-form-item>
      <el-form-item prop="status" label="状态">
        <el-select v-model="searchData.status" placeholder="岗位状态" clearable style="width: 150px">
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
      <el-button type="primary" @click="crud.methods.handleAdd" v-permission="['system:post:add']">
        <template #icon><Icon icon="lucide:plus-circle" /></template>新增
      </el-button>
      <el-button type="danger" @click="handleBatchRemove" v-permission="['system:post:delete']">
        <template #icon><Icon icon="lucide:trash-2" /></template>批量删除
      </el-button>
    </template>

    <!-- 表格列 -->
    <template #table>
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="postCode" label="岗位编码" align="center" />
      <el-table-column prop="postName" label="岗位名称" align="center" />
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
      <el-table-column prop="remark" label="备注" align="center" />
      <el-table-column prop="createTime" label="创建时间" align="center" min-width="160" />
      <el-table-column fixed="right" label="操作" width="150" align="center">
        <template #default="scope">
          <el-button
            type="warning"
            text
            bg
            size="small"
            @click="crud.methods.handleEdit(scope.row)"
            v-permission="['system:post:update']"
          >修改</el-button>
          <el-button
            type="danger"
            text
            bg
            size="small"
            @click="crud.methods.handleRemove(scope.row)"
            v-permission="['system:post:delete']"
          >删除</el-button>
        </template>
      </el-table-column>
    </template>

    <!-- 弹窗表单字段 -->
    <template #form-fields="{ formData }">
      <el-col :span="12">
        <el-form-item prop="postName" label="岗位名称">
          <el-input v-model="formData.postName" placeholder="请输入岗位名称" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="postCode" label="岗位编码">
          <el-input v-model="formData.postCode" placeholder="请输入岗位编码" />
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
        <el-form-item prop="deptIds" label="所属部门">
          <el-tree
            ref="deptTreeRef"
            :data="deptTreeData"
            :props="{ label: 'deptName', children: 'children' }"
            node-key="id"
            show-checkbox
            check-strictly
            default-expand-all
            class="dept-tree"
          />
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
    </template>
  </UseCrudView>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { ref, nextTick } from 'vue'
import type { FormRules } from 'element-plus'
import { cloneDeep } from 'lodash-es'
import UseCrudView from '@/common/components/useCrud/index.vue'
import { useCrud } from '@/common/composables/useCrud'
import { useDict } from '@/common/composables/useDict'
import { postPage, addPost, modifyPostById, removePostByIds, getPostDeptIds } from './apis'
import type { SystemPostVO, SystemPostQueryVO } from './apis/type'
import { deptTreeList } from '@/views/system/dept/apis'
import type { SystemDeptTreeVO } from '@/views/system/dept/apis/type'

defineOptions({ name: 'post' })

// ─── 字典 ─────────────────────────────────────────────────
const { getDictList, getDictItem } = useDict(['system_status'])

// ─── CRUD 核心（状态 + 搜索/分页/删除/弹窗生命周期） ──────
const crud = useCrud<SystemPostQueryVO, SystemPostVO>({
  pageApi: (query) => postPage(query),
  addApi: (data) => addPost(data),
  updateApi: (data) => modifyPostById(data),
  removeApi: (ids) => removePostByIds(ids),
  defaultForm: () => ({ status: '0' }),
  transformPayload: (form, isAdd) => {
    const checkedKeys = (deptTreeRef.value?.getCheckedKeys(false) as number[]) || []
    const halfCheckedKeys = (deptTreeRef.value?.getHalfCheckedKeys() as number[]) || []
    const deptIds = [...(checkedKeys || []), ...(halfCheckedKeys || [])]
    const payload: Record<string, any> = {
      postCode: form.postCode,
      postName: form.postName,
      status: form.status,
      deptIds,
      remark: form.remark,
    }
    if (!isAdd) {
      payload.id = form.id
    }
    return payload
  },
})

// ─── 依赖数据（部门树） ───────────────────────────────────
const deptTreeData = ref<SystemDeptTreeVO[]>([])
const deptTreeRef = ref<any>(null)

const formRules: FormRules = {
  postCode: [{ required: true, trigger: 'blur', message: '请输入岗位编码' }],
  postName: [{ required: true, trigger: 'blur', message: '请输入岗位名称' }],
  status: [{ required: true, trigger: 'change', message: '请选择状态' }],
}

function getDeptTree() {
  deptTreeList({}).then(({ data }) => { deptTreeData.value = data })
}

// ─── 编辑时回填部门选中状态（模块特有逻辑） ───────────────
const originalHandleEdit = crud.methods.handleEdit
crud.methods.handleEdit = (row: SystemPostVO) => {
  originalHandleEdit(row)
  nextTick(() => {
    deptTreeRef.value?.setCheckedKeys([])
    if (row.id) {
      getPostDeptIds(row.id).then(({ data }) => {
        data.forEach((id) => {
          deptTreeRef.value?.setChecked(id, true, false)
        })
      })
    }
  })
}

// ─── 弹窗关闭时清除树选中状态（模块特有逻辑） ──────────────
const originalHandleClose = crud.methods.handleClose
crud.methods.handleClose = () => {
  originalHandleClose()
  deptTreeRef.value?.setCheckedKeys([])
}

// ─── 自定义单条删除（保留岗位名称提示文案） ──────────────────
const originalHandleRemove = crud.methods.handleRemove
crud.methods.handleRemove = (row: SystemPostVO) => {
  ElMessageBox.confirm(`正在删除岗位「${row.postName}」，确认删除？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    removePostByIds(String(row.id)).then((res) => {
      ElMessage.success(res.msg || '删除成功')
      crud.methods.getTableData()
    })
  })
}

// ─── 自定义批量删除（保留原始提示文案） ──────────────────────
function handleBatchRemove() {
  const selectedRows = crud.slotProps.rowSelection
  if (selectedRows.length === 0) {
    ElMessage.warning('请先选择要删除的数据')
    return
  }
  const ids = selectedRows.map((r: any) => r.id).join(',')
  ElMessageBox.confirm(`正在删除 ${selectedRows.length} 条岗位数据，确认删除？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    removePostByIds(ids).then((res) => {
      ElMessage.success(res.msg || '删除成功')
      crud.methods.getTableData()
    })
  })
}

// ─── 初始化依赖数据 ──────────────────────────────────────
getDeptTree()
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

.dept-tree {
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 8px;
  max-height: 300px;
  overflow-y: auto;
}
</style>
