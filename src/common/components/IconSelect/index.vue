<template>
  <!-- 可编辑模式：仅输入框，无弹窗 -->
  <div v-if="allowEdit">
    <el-input v-model="inputValue" :placeholder="placeholder" clearable @clear="handleClear">
      <template #prefix>
        <el-icon v-if="inputValue && iconComponentMap[inputValue]">
          <component :is="iconComponentMap[inputValue]" />
        </el-icon>
        <el-icon v-else>
          <Search />
        </el-icon>
      </template>
    </el-input>
  </div>

  <!-- 选择模式：弹窗图标选择器，输入框只读 -->
  <div v-else>
    <el-popover
      placement="bottom-start"
      :width="'auto'"
      v-model:visible="popoverVisible"
      trigger="click"
    >
      <template #reference>
        <el-input
          v-model="inputValue"
          :placeholder="placeholder"
          readonly
          clearable
          @clear="handleClear"
        >
          <template #prefix>
            <el-icon v-if="inputValue && iconComponentMap[inputValue]">
              <component :is="iconComponentMap[inputValue]" />
            </el-icon>
            <el-icon v-else>
              <Search />
            </el-icon>
          </template>
        </el-input>
      </template>

      <!-- 弹窗内容：搜索框 + 图标网格 -->
      <div class="icon-selector-popup">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索图标（如 search）"
          clearable
          size="small"
          @input="handleSearch"
        >
          <template #suffix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <div class="icon-grid">
          <div
            v-for="name in filteredIcons"
            :key="name"
            class="icon-item"
            :class="{ active: modelValue === name }"
            @click="handleSelect(name)"
          >
            <el-icon size="18"><component :is="iconComponentMap[name]" /></el-icon>
            <span>{{ name }}</span>
          </div>

          <!-- 优化点：自定义空状态，移除 ElEmpty，样式更紧凑 -->
          <div v-if="filteredIcons.length === 0" class="empty-state">暂无匹配图标</div>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ElIcon, ElPopover, ElInput } from 'element-plus' // 已移除 ElEmpty
import { Search } from '@element-plus/icons-vue'
import { iconComponentMap, icons, type ElIconName } from './elIcon'
import { ref, computed } from 'vue'

interface Props {
  modelValue?: ElIconName
  placeholder?: string
  allowEdit?: boolean // true：手动输入；false：弹窗选择
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请选择图标',
  allowEdit: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: ElIconName): void
  (e: 'change', value: ElIconName): void
}>()

// ----- 双向绑定值（两种模式共用） -----
const inputValue = computed({
  get: () => props.modelValue,
  set: (val) => {
    if (props.allowEdit) {
      // 仅编辑模式允许手动输入时更新
      emit('update:modelValue', val as ElIconName)
      emit('change', val as ElIconName)
    }
  },
})

// 清空输入
const handleClear = () => {
  emit('update:modelValue', '' as ElIconName)
  emit('change', '' as ElIconName)
}

// ----- 选择模式专属状态（allowEdit = false）-----
const popoverVisible = ref(false)
const searchKeyword = ref('')

// 过滤图标列表
const filteredIcons = computed(() => {
  if (!searchKeyword.value.trim()) return icons
  const kw = searchKeyword.value.trim().toLowerCase()
  return icons.filter((name) => name.toLowerCase().includes(kw))
})

// 选中图标
const handleSelect = (name: ElIconName) => {
  emit('update:modelValue', name)
  emit('change', name)
  popoverVisible.value = false // 关闭弹窗
  searchKeyword.value = '' // 清空搜索词
}

// 搜索输入占位方法（计算属性自动响应）
const handleSearch = () => {}
</script>

<style scoped>
.icon-selector-popup {
  padding: 8px 4px;
}
.icon-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  max-height: 260px;
  overflow-y: auto;
  margin-top: 8px;
}
.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}
.icon-item:hover {
  background-color: #f5f7fa;
}
.icon-item.active {
  background-color: #ecf5ff;
  color: #409eff;
}
.icon-item span {
  font-size: 12px;
  margin-top: 4px;
  word-break: break-word;
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 优化点：自定义空状态样式，占据整行，文字居中，颜色柔和 */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 20px 0;
  color: #909399;
  font-size: 14px;
}
</style>
