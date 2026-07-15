<template>
  <UseCrudView :slotProps="crud.slotProps" :formRules="formRules" add-title="新增角色" edit-title="修改角色">
    <!-- 搜索区字段 -->
    <template #search-form="{ searchData }">
      <el-form-item prop="roleName" label="角色名称">
        <el-input v-model="searchData.roleName" placeholder="请输入角色名称" />
      </el-form-item>
      <el-form-item prop="roleCode" label="角色编码">
        <el-input v-model="searchData.roleCode" placeholder="请输入角色编码" />
      </el-form-item>
      <el-form-item prop="status" label="状态">
        <el-select
          v-model="searchData.status"
          placeholder="角色状态"
          clearable
          style="width: 150px"
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
      <el-button type="primary" @click="crud.methods.handleAdd" v-permission="['system:role:add']">
        <template #icon><Icon icon="lucide:plus-circle" /></template>新增
      </el-button>
      <el-button type="danger" @click="handleBatchRemove" v-permission="['system:role:delete']">
        <template #icon><Icon icon="lucide:trash-2" /></template>批量删除
      </el-button>
    </template>

    <!-- 表格列 -->
    <template #table>
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="roleName" label="角色名称" align="center" />
      <el-table-column prop="roleCode" label="角色编码" align="center" />
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
            v-permission="['system:role:update']"
          >修改</el-button>
          <el-button
            type="danger"
            text
            bg
            size="small"
            @click="crud.methods.handleRemove(scope.row)"
            v-permission="['system:role:delete']"
          >删除</el-button>
        </template>
      </el-table-column>
    </template>

    <!-- 弹窗表单字段 -->
    <template #form-fields="{ formData }">
      <el-col :span="12">
        <el-form-item prop="roleName" label="角色名称">
          <el-input v-model="formData.roleName" placeholder="请输入角色名称" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="roleCode" label="角色编码">
          <el-input v-model="formData.roleCode" placeholder="请输入角色编码" />
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
        <el-form-item prop="menuIds" label="菜单权限">
          <el-tree
            ref="menuTreeRef"
            :data="menuTreeData"
            :props="{ label: 'menuName', children: 'children' }"
            node-key="id"
            show-checkbox
            check-strictly
            default-expand-all
            class="menu-tree"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item prop="dataScope" label="数据权限">
          <el-select v-model="formData.dataScope" placeholder="请选择数据范围" style="width: 100%">
            <el-option
              v-for="item in dataScopeOptions"
              :key="item.label"
              :label="item.value"
              :value="item.label"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="24" v-if="formData.dataScope === '5'">
        <el-form-item label="部门权限">
          <el-tree
            ref="deptTreeRef"
            :data="deptTreeData"
            :props="{ label: 'deptName', children: 'children' }"
            node-key="id"
            show-checkbox
            check-strictly
            default-expand-all
            class="menu-tree"
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
import { ref, nextTick, watch } from 'vue'
import type { FormRules } from 'element-plus'
import { cloneDeep } from 'lodash-es'
import UseCrudView from '@/common/components/useCrud/index.vue'
import { useCrud } from '@/common/composables/useCrud'
import { useDict } from '@/common/composables/useDict'
import { rolePage, addRole, modifyRoleById, removeRoleByIds, getRoleMenuIds, getRoleDeptIds } from './apis'
import type { SystemRoleVO, SystemRoleQueryVO } from './apis/type'
import { treeList } from '@/views/system/menu/apis'
import type { SystemMenuTreeVO } from '@/views/system/menu/apis/type'
import { deptTreeList } from '@/views/system/dept/apis'
import type { SystemDeptTreeVO } from '@/views/system/dept/apis/type'

defineOptions({ name: 'role' })

// ─── 字典 ─────────────────────────────────────────────────
const { getDictList, getDictItem } = useDict(['system_status'])

// ─── CRUD 核心（状态 + 搜索/分页/删除/弹窗生命周期） ──────
const crud = useCrud<SystemRoleQueryVO, SystemRoleVO>({
  pageApi: (query) => rolePage(query),
  addApi: (data) => addRole(data),
  updateApi: (data) => modifyRoleById(data),
  removeApi: (ids) => removeRoleByIds(ids),
  defaultForm: () => ({ status: '0', dataScope: '1' }),
  transformPayload: (form, isAdd) => {
    const checkedKeys = (menuTreeRef.value?.getCheckedKeys(false) as number[]) || []
    const halfCheckedKeys = (menuTreeRef.value?.getHalfCheckedKeys() as number[]) || []
    const menuIds = [...checkedKeys, ...halfCheckedKeys]
    const deptIds = form.dataScope === '5'
      ? ((deptTreeRef.value?.getCheckedKeys(false) as number[]) || [])
      : []
    const payload: Record<string, any> = {
      roleCode: form.roleCode,
      roleName: form.roleName,
      status: form.status,
      dataScope: form.dataScope,
      menuIds,
      deptIds,
      remark: form.remark,
    }
    if (!isAdd) {
      payload.id = form.id
    }
    return payload
  },
})

// ─── 依赖数据（菜单树 / 部门树） ──────────────────────────
const menuTreeData = ref<SystemMenuTreeVO[]>([])
const deptTreeData = ref<SystemDeptTreeVO[]>([])
const menuTreeRef = ref<any>(null)
const deptTreeRef = ref<any>(null)

const dataScopeOptions = [
  { label: '1', value: '全部数据' },
  { label: '2', value: '本部门及下级部门' },
  { label: '3', value: '本部门数据' },
  { label: '4', value: '仅本人数据' },
  { label: '5', value: '自定义' },
]

const formRules: FormRules = {
  roleName: [{ required: true, trigger: 'blur', message: '请输入角色名称' }],
  roleCode: [{ required: true, trigger: 'blur', message: '请输入角色编码' }],
}

function getMenuTree() {
  treeList({}).then(({ data }) => { menuTreeData.value = data })
}

function getDeptTree() {
  deptTreeList({}).then(({ data }) => { deptTreeData.value = data })
}

// ─── 编辑时回填菜单/部门选中状态（模块特有逻辑） ──────────
const originalHandleEdit = crud.methods.handleEdit
crud.methods.handleEdit = (row: SystemRoleVO) => {
  originalHandleEdit(row)
  if (!crud.state.formData.value.dataScope) {
    crud.state.formData.value.dataScope = '1'
  }
  nextTick(() => {
    menuTreeRef.value?.setCheckedKeys([])
    deptTreeRef.value?.setCheckedKeys([])
    if (row.id) {
      getRoleMenuIds(row.id).then(({ data }) => {
        data.forEach((id) => {
          menuTreeRef.value?.setChecked(id, true, false)
        })
      })
      if (crud.state.formData.value.dataScope === '5') {
        getRoleDeptIds(row.id).then(({ data }) => {
          data.forEach((id) => {
            deptTreeRef.value?.setChecked(id, true, false)
          })
        })
      }
    }
  })
}

// dataScope 切换为自定义且正在编辑时，加载部门选中状态
watch(
  () => crud.state.formData.value.dataScope,
  (val) => {
    if (val === '5' && crud.state.formData.value.id && crud.state.dialogVisible) {
      nextTick(() => {
        deptTreeRef.value?.setCheckedKeys([])
        getRoleDeptIds(crud.state.formData.value.id).then(({ data }) => {
          data.forEach((id) => {
            deptTreeRef.value?.setChecked(id, true, false)
          })
        })
      })
    }
  },
)

// ─── 弹窗关闭时清除树选中状态（模块特有逻辑） ──────────────
const originalHandleClose = crud.methods.handleClose
crud.methods.handleClose = () => {
  originalHandleClose()
  menuTreeRef.value?.setCheckedKeys([])
  deptTreeRef.value?.setCheckedKeys([])
}

// ─── 自定义单条删除（保留角色名称提示文案） ──────────────────
const originalHandleRemove = crud.methods.handleRemove
crud.methods.handleRemove = (row: SystemRoleVO) => {
  ElMessageBox.confirm(`正在删除角色「${row.roleName}」，确认删除？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    removeRoleByIds(String(row.id)).then((res) => {
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
  ElMessageBox.confirm(`正在删除 ${selectedRows.length} 条角色数据，确认删除？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    removeRoleByIds(ids).then((res) => {
      ElMessage.success(res.msg || '删除成功')
      crud.methods.getTableData()
    })
  })
}

// ─── 初始化依赖数据 ──────────────────────────────────────
getMenuTree()
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

.menu-tree {
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 8px;
  max-height: 300px;
  overflow-y: auto;
}
</style>
