<template>
  <div class="notify">
    <el-popover placement="bottom" :width="popoverWidth" trigger="click">
      <template #reference>
        <el-badge :value="badgeValue" :max="badgeMax" :hidden="badgeValue === 0">
          <el-tooltip effect="dark" content="消息通知" placement="bottom">
            <Icon icon="ep:bell" width="20" height="20" />
          </el-tooltip>
        </el-badge>
      </template>
      <template #default>
        <el-tabs v-model="activeName" class="demo-tabs" stretch>
          <el-tab-pane v-for="(item, index) in data" :key="index" :name="item.name">
            <template #label>
              {{ item.name }}
              <el-badge :value="item.list.length" :max="badgeMax" :type="item.type" />
            </template>
            <el-scrollbar height="400px">
              <List :data="item.list" />
            </el-scrollbar>
          </el-tab-pane>
        </el-tabs>
        <div class="notify-history">
          <el-button link @click="handleHistory"> 查看{{ activeName }}历史 </el-button>
        </div>
      </template>
    </el-popover>
  </div>
</template>

<script lang="ts" setup>
import type { NotifyItem } from './type'
import { Icon } from '@iconify/vue'
import { notifyData, messageData, todoData } from './data'

type TabName = '通知' | '消息' | '待办'

interface DataItem {
  name: TabName
  type: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  list: NotifyItem[]
}

// 角标当前值
const badgeValue = computed(() => data.value.reduce((sum, item) => sum + item.list.length, 0))

// 角标最大值
const badgeMax = 99

// 面板宽度
const popoverWidth = 350

// 当前 Tab
const activeName = ref<TabName>('通知')

const data = ref<DataItem[]>([
  // 通知数据
  {
    name: '通知',
    type: 'primary',
    list: notifyData,
  },
  // 消息数据
  {
    name: '消息',
    type: 'danger',
    list: messageData,
  },
  // 待办数据
  {
    name: '待办',
    type: 'warning',
    list: todoData,
  },
])

function handleHistory() {
  ElMessage.success(`跳转到${activeName.value}历史页面`)
}
</script>

<style lang="scss" scoped>
.notify {
  :deep(svg) {
    outline: none;
  }
}

.notify-history {
  text-align: center;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color);
}
</style>
