<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="menuName" label="菜单名称">
          <el-input v-model="searchData.menuName" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item prop="status" label="状态">
          <el-select
            v-model="searchData.status"
            placeholder="菜单状态"
            clearable
            style="width: 200px"
          >
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
            <template #icon><Icon icon="ep:search" /></template>查询</el-button
          >
          <el-button @click="resetSearch">
            <template #icon><Icon icon="ep:refresh" /></template>重置</el-button
          >
        </el-form-item>
      </el-form>
    </el-card>
    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" @click="dialogVisible = true">
            <template #icon><Icon icon="ep:circle-plus" /></template>新增菜单</el-button
          >
          <el-button @click="toggleExpand">
            <template #icon><Icon icon="ep:sort" /></template
            >{{ isExpanded ? '收起全部' : '展开全部' }}</el-button
          >
        </div>
      </div>
      <div class="table-wrapper">
        <el-table
          ref="tableRef"
          :data="tableData"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
          row-key="id"
          @row-click="handleRowClick"
        >
          <el-table-column
            prop="menuName"
            label="菜单名称"
            align="center"
            min-width="140"
            show-overflow-tooltip
          />
          <el-table-column prop="icon" label="图标" align="center" width="60">
            <template #default="scope">
              <MenuIcon v-if="scope.row.icon" :name="scope.row.icon" class="el-icon" />
            </template>
          </el-table-column>
          <el-table-column prop="menuType" label="类型" align="center" width="80">
            <template #default="scope">
              <el-tag
                :type="menuTypeTag(scope.row.menuType)"
                effect="plain"
                size="small"
                disable-transitions
              >
                {{
                  getDictItem('system_menu_type', scope.row.menuType)?.value || scope.row.menuType
                }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sort" label="排序" align="center" width="70" />
          <el-table-column
            prop="permission"
            label="权限标识"
            align="center"
            show-overflow-tooltip
          />
          <el-table-column prop="component" label="组件路径" align="center" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" align="center">
            <template #default="scope">
              <el-tag
                :type="getDictItem('system_status', scope.row.status)?.listClass || 'info'"
                effect="plain"
                disable-transitions
              >
                {{ getDictItem('system_status', scope.row.status)?.value }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="createTime"
            label="创建时间"
            align="center"
            min-width="160"
            show-overflow-tooltip
          />
          <el-table-column fixed="right" label="操作" width="200" align="center">
            <template #default="scope">
              <el-button
                v-if="scope.row.menuType !== 'B'"
                type="success"
                text
                bg
                size="small"
                @click="handleAddChild(scope.row)"
                >新增</el-button
              >
              <el-button type="primary" text bg size="small" @click="handleModify(scope.row)"
                >修改</el-button
              >
              <el-button type="danger" text bg size="small" @click="handleRemove(scope.row)"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id === undefined ? '新增菜单' : '修改菜单'"
      width="40%"
      @close="handleClose"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="24" v-show="formData.menuType != 'M'">
            <el-form-item prop="parentId" label="上级菜单">
              <el-tree-select
                v-model="formData.parentId"
                :data="tableData"
                :props="{ label: 'menuName', children: 'children' }"
                value-key="id"
                placeholder="请选择上级菜单"
                check-strictly
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item prop="menuType" label="菜单类型">
              <el-radio-group v-model="formData.menuType">
                <el-radio
                  v-for="item in getDictList('system_menu_type')"
                  :key="item.id"
                  :value="item.label"
                >
                  {{ item.value }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-show="formData.menuType != 'B'">
            <el-form-item prop="icon" label="菜单图标">
              <icon-select v-model="formData.icon" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="sort" label="显示排序">
              <el-input-number
                v-model="formData.sort"
                :min="0"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="menuName" label="菜单名称">
              <el-input v-model="formData.menuName" placeholder="请输入菜单名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-show="formData.menuType != 'B'">
            <el-form-item prop="component">
              <template #label>
                <span>
                  <el-tooltip
                    content="访问的组件路径，如：`system/user/index`，默认在`views`目录下"
                    placement="top"
                  >
                    <Icon icon="ep:question-filled" />
                  </el-tooltip>
                  组件路径
                </span>
              </template>
              <el-input v-model="formData.component" placeholder="请输入组件路径" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-show="formData.menuType != 'B'">
            <el-form-item prop="routeName" label="路由名称">
              <el-input v-model="formData.routeName" placeholder="请输入路由名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-show="formData.menuType != 'B'">
            <el-form-item prop="path">
              <template #label>
                <span>
                  <el-tooltip
                    content="访问的路由地址，如：`user`，如外网地址需内链访问则以`http(s)://`开头"
                    placement="top"
                  >
                    <Icon icon="ep:question-filled" />
                  </el-tooltip>
                  路由地址
                </span>
              </template>
              <el-input v-model="formData.path" placeholder="请输入路由地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-show="formData.menuType != 'M'">
            <el-form-item prop="permission">
              <template #label>
                <span>
                  <el-tooltip
                    content="控制器中定义的权限字符，如：@PreAuthorize(`@ss.hasPermi('system:user:list')`)"
                    placement="top"
                  >
                    <Icon icon="ep:question-filled" />
                  </el-tooltip>
                  权限字符
                </span>
              </template>
              <el-input v-model="formData.permission" placeholder="请输入权限字符" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-show="formData.menuType == 'C'">
            <el-form-item prop="query">
              <template #label>
                <span>
                  <el-tooltip
                    content='访问路由的默认传递参数，如：`{"id": 1, "name": "ry"}`'
                    placement="top"
                  >
                    <Icon icon="ep:question-filled" />
                  </el-tooltip>
                  路由参数
                </span>
              </template>
              <el-input v-model="formData.query" placeholder="请输入路由参数" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="visible" label="显示状态">
              <el-radio-group v-model="formData.visible">
                <el-radio
                  v-for="item in getDictList('system_visible')"
                  :key="item.id"
                  :value="item.label"
                >
                  {{ item.value }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="status" label="菜单状态">
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
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleCreateOrUpdate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { useDict } from '@/common/composables/useDict'
import { Icon } from '@iconify/vue'
import type { FormRules } from 'element-plus'
import { addMenu, modifyById, removeById, treeList } from './apis'
import type { SystemMenuVO, SystemMenuQueryVO, SystemMenuTreeVO } from './apis/type'
import { cloneDeep } from 'lodash-es'
import IconSelect from '@@/components/IconSelect/index.vue'
import MenuIcon from '@@/components/MenuIcon/index.vue'

const { loading, getDictList, getDictItem } = useDict([
  'system_status',
  'system_menu_type',
  'system_visible',
])

const searchFormRef = useTemplateRef('searchFormRef')

const tableRef = useTemplateRef('tableRef')

const formRef = useTemplateRef('formRef')

const searchData: SystemMenuQueryVO = reactive({})

const tableData = ref<SystemMenuTreeVO[]>([])

const menuTypeTagMap: Record<string, 'info' | 'primary' | 'warning'> = {
  M: 'info',
  C: 'primary',
  B: 'warning',
}

function menuTypeTag(type?: string) {
  return menuTypeTagMap[type || ''] || 'info'
}

const formData = ref<SystemMenuVO>({
  menuType: 'M',
  visible: '0',
  status: '0',
  icon: '',
})

const formRules: FormRules<SystemMenuVO> = {
  sort: [{ required: true, trigger: 'blur', message: '请选择显示排序' }],
  menuName: [{ required: true, trigger: 'blur', message: '请输入菜单名称' }],
  component: [{ required: true, trigger: 'blur', message: '请输入组件路径' }],
  routeName: [{ required: true, trigger: 'blur', message: '请输入路由名称' }],
  path: [{ required: true, trigger: 'blur', message: '请输入路由地址' }],
}

const dialogVisible = ref<boolean>(false)

function handleSearch() {
  getTableData()
}

function resetSearch() {
  searchFormRef.value?.resetFields()
  getTableData()
}

function handleRowClick(row: SystemMenuTreeVO) {
  if (row.children?.length) {
    tableRef.value?.toggleRowExpansion(row)
  }
}

function handleModify(row: SystemMenuVO) {
  dialogVisible.value = true
  formData.value = cloneDeep(row)
}

function handleRemove(row: SystemMenuVO) {
  ElMessageBox.confirm(`正在删除${row.menuName}菜单数据，确认删除？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    if (row.id) {
      removeById(row.id).then((data) => {
        ElMessage.success(data.msg || '删除成功')
        getTableData()
      })
    }
  })
}

function handleClose() {
  formData.value = { menuType: 'M', visible: '0', status: '0' }
  formRef.value?.clearValidate()
}

function handleCreateOrUpdate() {
  formRef.value?.validate((valid) => {
    if (!valid) {
      ElMessage.error('表单校验不通过')
      return
    }
    loading.value = true
    const api = formData.value.id === undefined ? addMenu : modifyById
    api(formData.value)
      .then((data) => {
        ElMessage.success(data.msg || '操作成功')
        dialogVisible.value = false
        getTableData()
      })
      .finally(() => {
        loading.value = false
      })
  })
}

function getTableData() {
  loading.value = true
  const requestParam = {
    ...searchData,
  }
  treeList(requestParam)
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

const isExpanded = ref(false)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
  const table = tableRef.value
  if (!table) return
  const toggleRows = (rows: SystemMenuTreeVO[]) => {
    rows.forEach((row) => {
      table.toggleRowExpansion(row, isExpanded.value)
      if (row.children?.length) {
        toggleRows(row.children)
      }
    })
  }
  toggleRows(tableData.value)
}

function handleAddChild(row: SystemMenuVO) {
  dialogVisible.value = true
  formData.value = {
    menuType: row.menuType === 'M' ? 'C' : 'B',
    visible: '0',
    status: '0',
    parentId: row.id,
    icon: '',
  }
}
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
</style>
