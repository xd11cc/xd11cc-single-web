<template>
  <!-- 可编辑模式：仅输入框 -->
  <div v-if="allowEdit">
    <el-input v-model="inputValue" :placeholder="placeholder" clearable @clear="handleClear">
      <template #prefix>
        <Icon v-if="inputValue" :icon="inputValue" />
        <Icon v-else icon="ep:search" />
      </template>
    </el-input>
  </div>

  <!-- 选择模式：弹窗图标选择器 -->
  <div v-else>
    <el-popover
      placement="bottom-start"
      :width="420"
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
            <Icon v-if="inputValue" :icon="inputValue" />
            <Icon v-else icon="ep:search" />
          </template>
        </el-input>
      </template>

      <div class="icon-selector-popup">
        <div class="search-row">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索图标"
            clearable
            size="small"
            @input="handleLocalFilter"
          >
            <template #suffix>
              <Icon icon="ep:search" class="search-btn" />
            </template>
          </el-input>
          <el-button size="small" @click="handleOnlineSearch" :loading="onlineLoading">
            在线搜索
          </el-button>
        </div>

        <div class="tab-row">
          <span :class="{ active: activeTab === 'local' }" @click="activeTab = 'local'">
            EP 图标
          </span>
          <span
            v-if="onlineResults.length > 0"
            :class="{ active: activeTab === 'online' }"
            @click="activeTab = 'online'"
          >
            在线结果
          </span>
        </div>

        <div class="icon-grid">
          <template v-if="activeTab === 'local'">
            <div
              v-for="icon in displayIcons"
              :key="icon"
              class="icon-item"
              :class="{ active: modelValue === icon }"
              @click="handleSelect(icon)"
            >
              <Icon :icon="icon" width="20" height="20" />
              <span>{{ icon.replace('ep:', '') }}</span>
            </div>
            <div v-if="displayIcons.length === 0" class="empty-state">无匹配图标</div>
          </template>
          <template v-else>
            <div
              v-for="icon in onlineResults"
              :key="icon"
              class="icon-item"
              :class="{ active: modelValue === icon }"
              @click="handleSelect(icon)"
            >
              <Icon :icon="icon" width="20" height="20" />
              <span>{{ icon }}</span>
            </div>
            <div v-if="onlineLoading" class="empty-state">搜索中...</div>
            <div v-else-if="onlineResults.length === 0" class="empty-state">暂无结果</div>
          </template>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref, computed } from 'vue'
import epIcons from '@iconify-json/ep/icons.json'

const epIconNames = Object.keys(epIcons.icons).map((name) => `ep:${name}`)

interface Props {
  modelValue?: string
  placeholder?: string
  allowEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请选择图标',
  allowEdit: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}>()

const inputValue = computed({
  get: () => props.modelValue,
  set: (val) => {
    if (props.allowEdit) {
      emit('update:modelValue', val)
      emit('change', val)
    }
  },
})

const handleClear = () => {
  emit('update:modelValue', '')
  emit('change', '')
}

const popoverVisible = ref(false)
const searchKeyword = ref('')
const activeTab = ref<'local' | 'online'>('local')
const filteredIcons = ref<string[]>([])
const onlineResults = ref<string[]>([])
const onlineLoading = ref(false)
const hasFiltered = ref(false)

const displayIcons = computed(() => {
  if (hasFiltered.value) return filteredIcons.value
  return epIconNames.slice(0, 48)
})

function handleLocalFilter() {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) {
    hasFiltered.value = false
    return
  }
  hasFiltered.value = true
  filteredIcons.value = epIconNames.filter((name) => name.includes(keyword)).slice(0, 48)
}

async function handleOnlineSearch() {
  const keyword = searchKeyword.value.trim()
  if (!keyword) return

  onlineLoading.value = true
  activeTab.value = 'online'
  try {
    const res = await fetch(
      `https://api.iconify.design/search?query=${encodeURIComponent(keyword)}&limit=48`,
    )
    const data = await res.json()
    onlineResults.value = data.icons || []
  } catch {
    onlineResults.value = []
  } finally {
    onlineLoading.value = false
  }
}

const handleSelect = (name: string) => {
  emit('update:modelValue', name)
  emit('change', name)
  popoverVisible.value = false
  searchKeyword.value = ''
  hasFiltered.value = false
  onlineResults.value = []
  activeTab.value = 'local'
}
</script>

<style scoped>
.icon-selector-popup {
  padding: 4px;
}

.search-row {
  display: flex;
  gap: 8px;
}

.tab-row {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #ebeef5;
  font-size: 13px;
}

.tab-row span {
  cursor: pointer;
  padding-bottom: 4px;
  color: #909399;
  transition: color 0.2s;
}

.tab-row span.active {
  color: #409eff;
  font-weight: 500;
  border-bottom: 2px solid #409eff;
}

.tab-row span:hover:not(.active) {
  color: #606266;
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
  font-size: 11px;
  margin-top: 4px;
  word-break: break-word;
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 20px 0;
  color: #909399;
  font-size: 14px;
}

.search-btn {
  cursor: pointer;
}
</style>
