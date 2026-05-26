<template>
  <div>
    <el-tooltip effect="dark" content="搜索 ⌘K" placement="bottom">
      <Icon icon="lucide:search" class="action-icon" @click="open" />
    </el-tooltip>
    <Teleport to="body">
      <Transition name="cmd">
        <div v-if="visible" class="cmd-overlay" @click.self="close">
          <div class="cmd-palette">
            <div class="cmd-input-wrapper">
              <Icon icon="lucide:search" class="cmd-input-icon" />
              <input
                ref="inputRef"
                v-model="query"
                class="cmd-input"
                placeholder="搜索页面、操作..."
                @keydown.esc="close"
                @keydown.up.prevent="moveUp"
                @keydown.down.prevent="moveDown"
                @keydown.enter.prevent="handleSelect"
              />
              <kbd class="cmd-kbd">ESC</kbd>
            </div>
            <div v-if="filteredItems.length" class="cmd-list">
              <div
                v-for="(group, gi) in groupedItems"
                :key="group.label"
                class="cmd-group"
              >
                <div class="cmd-group-label">{{ group.label }}</div>
                <div
                  v-for="(item, ii) in group.items"
                  :key="item.path"
                  class="cmd-item"
                  :class="{ active: isActive(gi, ii) }"
                  @click="executeItem(item)"
                  @mouseenter="setActive(gi, ii)"
                >
                  <Icon :icon="item.icon || 'lucide:file'" class="cmd-item-icon" />
                  <div class="cmd-item-content">
                    <span class="cmd-item-title">{{ item.title }}</span>
                    <span v-if="item.breadcrumb" class="cmd-item-breadcrumb">{{ item.breadcrumb }}</span>
                  </div>
                  <Icon icon="lucide:corner-down-left" class="cmd-item-enter" />
                </div>
              </div>
            </div>
            <div v-else class="cmd-empty">
              <Icon icon="lucide:search-x" class="cmd-empty-icon" />
              <p>未找到匹配结果</p>
            </div>
            <div class="cmd-footer">
              <span><kbd>↑↓</kbd> 导航</span>
              <span><kbd>↵</kbd> 选择</span>
              <span><kbd>ESC</kbd> 关闭</span>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { usePermissionStore } from '@/pinia/stores/permission'
import type { RouteRecordRaw } from 'vue-router'

interface CommandItem {
  title: string
  path: string
  icon: string
  breadcrumb?: string
}

const router = useRouter()
const permissionStore = usePermissionStore()
const visible = ref(false)
const query = ref('')
const inputRef = ref<HTMLInputElement>()
const activeGroupIndex = ref(0)
const activeItemIndex = ref(0)

const allItems = computed<CommandItem[]>(() => {
  const items: CommandItem[] = []
  const routes = permissionStore.routes

  function traverse(routes: RouteRecordRaw[], breadcrumb: string[] = [], parentPath = '') {
    for (const route of routes) {
      if (route.meta?.hidden) continue
      const title = (route.meta?.title as string) || ''
      const currentBreadcrumb = title ? [...breadcrumb, title] : breadcrumb

      const fullPath = route.path.startsWith('/')
        ? route.path
        : `${parentPath}/${route.path}`.replace(/\/+/g, '/')

      if (route.children?.length) {
        traverse(route.children, currentBreadcrumb, fullPath)
      } else if (title && fullPath) {
        items.push({
          title,
          path: fullPath,
          icon: (route.meta?.icon as string) || 'lucide:file',
          breadcrumb: currentBreadcrumb.length > 1 ? currentBreadcrumb.slice(0, -1).join(' / ') : undefined,
        })
      }
    }
  }

  traverse(routes)

  return items
})

const filteredItems = computed(() => {
  if (!query.value) return allItems.value
  const q = query.value.toLowerCase()
  return allItems.value.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.path.toLowerCase().includes(q) ||
      item.breadcrumb?.toLowerCase().includes(q),
  )
})

const groupedItems = computed(() => {
  const items = filteredItems.value
  if (!items.length) return []
  return [{ label: '页面', items }]
})

function isActive(gi: number, ii: number) {
  return activeGroupIndex.value === gi && activeItemIndex.value === ii
}

function setActive(gi: number, ii: number) {
  activeGroupIndex.value = gi
  activeItemIndex.value = ii
}

function moveDown() {
  const group = groupedItems.value[activeGroupIndex.value]
  if (!group) return
  if (activeItemIndex.value < group.items.length - 1) {
    activeItemIndex.value++
  } else if (activeGroupIndex.value < groupedItems.value.length - 1) {
    activeGroupIndex.value++
    activeItemIndex.value = 0
  }
}

function moveUp() {
  if (activeItemIndex.value > 0) {
    activeItemIndex.value--
  } else if (activeGroupIndex.value > 0) {
    activeGroupIndex.value--
    activeItemIndex.value = groupedItems.value[activeGroupIndex.value].items.length - 1
  }
}

function handleSelect() {
  const group = groupedItems.value[activeGroupIndex.value]
  if (!group) return
  const item = group.items[activeItemIndex.value]
  if (item) executeItem(item)
}

function executeItem(item: CommandItem) {
  close()
  router.push(item.path)
}

function open() {
  visible.value = true
  query.value = ''
  activeGroupIndex.value = 0
  activeItemIndex.value = 0
  nextTick(() => inputRef.value?.focus())
}

function close() {
  visible.value = false
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    visible.value ? close() : open()
  }
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', handleKeydown))

watch(query, () => {
  activeGroupIndex.value = 0
  activeItemIndex.value = 0
})
</script>

<style lang="scss" scoped>
.action-icon {
  font-size: 18px;
  outline: none;
  cursor: pointer;
  color: var(--theme-text-secondary);
  transition: color var(--p-duration-fast);
}

.cmd-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 20vh;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.cmd-palette {
  width: 560px;
  max-width: 90vw;
  max-height: 460px;
  display: flex;
  flex-direction: column;
  border-radius: var(--p-radius-lg);
  background: var(--theme-bg-surface);
  border: 1px solid var(--theme-border);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.cmd-input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--theme-border);

  .cmd-input-icon {
    font-size: 18px;
    color: var(--theme-text-muted);
    flex-shrink: 0;
  }

  .cmd-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 15px;
    color: var(--theme-text-primary);
    font-family: var(--p-font-body);

    &::placeholder {
      color: var(--theme-text-muted);
    }
  }

  .cmd-kbd {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    font-family: var(--p-font-body);
    background: var(--theme-bg-elevated);
    color: var(--theme-text-muted);
    border: 1px solid var(--theme-border);
  }
}

.cmd-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.cmd-group {
  &:not(:first-child) {
    margin-top: 8px;
  }
}

.cmd-group-label {
  padding: 4px 8px;
  font-size: 11px;
  font-weight: var(--p-weight-semibold);
  color: var(--theme-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cmd-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--p-radius-md);
  cursor: pointer;
  transition: background var(--p-duration-fast);

  &.active {
    background: var(--theme-bg-elevated);

    .cmd-item-enter {
      opacity: 1;
    }
  }

  .cmd-item-icon {
    font-size: 16px;
    color: var(--theme-text-muted);
    flex-shrink: 0;
  }

  .cmd-item-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .cmd-item-title {
    font-size: 14px;
    color: var(--theme-text-primary);
    font-weight: var(--p-weight-medium);
  }

  .cmd-item-breadcrumb {
    font-size: 12px;
    color: var(--theme-text-muted);
  }

  .cmd-item-enter {
    font-size: 14px;
    color: var(--theme-text-muted);
    opacity: 0;
    transition: opacity var(--p-duration-fast);
  }
}

.cmd-empty {
  padding: 40px 20px;
  text-align: center;
  color: var(--theme-text-muted);

  .cmd-empty-icon {
    font-size: 32px;
    margin-bottom: 8px;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.cmd-footer {
  display: flex;
  gap: 16px;
  padding: 10px 16px;
  border-top: 1px solid var(--theme-border);
  font-size: 12px;
  color: var(--theme-text-muted);

  kbd {
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 11px;
    background: var(--theme-bg-elevated);
    border: 1px solid var(--theme-border);
    margin-right: 2px;
  }
}

// Transition
.cmd-enter-active {
  transition: opacity 0.15s ease;
  .cmd-palette {
    transition: transform 0.15s ease, opacity 0.15s ease;
  }
}

.cmd-leave-active {
  transition: opacity 0.1s ease;
  .cmd-palette {
    transition: transform 0.1s ease, opacity 0.1s ease;
  }
}

.cmd-enter-from {
  opacity: 0;
  .cmd-palette {
    transform: scale(0.96) translateY(-8px);
    opacity: 0;
  }
}

.cmd-leave-to {
  opacity: 0;
  .cmd-palette {
    transform: scale(0.96) translateY(-4px);
    opacity: 0;
  }
}
</style>
