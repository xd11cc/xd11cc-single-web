<template>
  <div class="notify-list">
    <div v-for="(item, index) in data" :key="index" class="notify-item">
      <el-avatar v-if="item.avatar" :src="item.avatar" :size="32" />
      <el-avatar v-else :size="32">
        <Icon icon="lucide:bell" />
      </el-avatar>
      <div class="notify-item-content">
        <span class="title">{{ item.title }}</span>
        <span v-if="item.description" class="description">{{ item.description }}</span>
        <span v-if="item.datatime" class="time">{{ item.datatime }}</span>
      </div>
      <el-tag v-if="item.extra" :type="item.status" size="small" effect="plain">
        {{ item.extra }}
      </el-tag>
    </div>
    <el-empty v-if="!data.length" description="暂无数据" :image-size="80" />
  </div>
</template>

<script lang="ts" setup>
import type { NotifyItem } from './type'
import { Icon } from '@iconify/vue'

defineProps<{
  data: NotifyItem[]
}>()
</script>

<style lang="scss" scoped>
.notify-list {
  .notify-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:last-child {
      border-bottom: none;
    }
  }

  .notify-item-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;

    .title {
      font-size: 13px;
      color: var(--el-text-color-primary);
      line-height: 1.4;
    }

    .description {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .time {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
    }
  }
}
</style>
