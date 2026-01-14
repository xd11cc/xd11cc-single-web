<template>
  <template v-if="!hasChildren">
    <Link :to="item.path" :isFrame="item.ifFrame"
      ><el-menu-item :index="item.id">
        <component :is="item.icon" class="el-icon" />
        <template v-if="item.menuName" #title>
          <span class="title">{{ item.menuName }}</span>
        </template>
      </el-menu-item>
    </Link>
  </template>
  <el-sub-menu v-else :index="item.id" teleported>
    <template #title>
      <component v-if="item.icon" :is="item.icon" class="el-icon" />
      <span v-if="item.menuName" class="title">{{ item.menuName }}</span>
    </template>
    <template v-if="item.children && item.children?.length > 0">
      <Item v-for="child in item.children" :key="child.id" :item="child" />
    </template>
  </el-sub-menu>
</template>

<script lang="ts" setup>
import { TreeMenuVO } from '@/types'
import { computed } from 'vue'
import Link from './Link.vue'

interface Props {
  item: TreeMenuVO
}
const { item } = defineProps<Props>()

const hasChildren = computed(() => (item.children ?? []).length > 0)
</script>

<style lang="scss" scoped>
@use '@/styles/mixins.scss';

.el-icon {
  width: 1em !important;
  margin-right: 12px !important;
  font-size: 18px;
}

.title {
  @extend %ellipsis;
}
</style>
