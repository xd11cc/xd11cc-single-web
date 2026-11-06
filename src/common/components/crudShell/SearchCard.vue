<!-- 搜索区：列表壳与树形壳共用 -->
<template>
  <el-card shadow="never" class="search-wrapper">
    <el-form :inline="true" :model="slotProps.searchData">
      <slot v-bind="slotProps" />
      <el-form-item>
        <el-button type="primary" @click="slotProps.handleSearch">
          <template #icon><Icon icon="lucide:search" /></template>{{ $t('common.search') }}
        </el-button>
        <el-button @click="slotProps.resetSearch">
          <template #icon><Icon icon="lucide:rotate-ccw" /></template>{{ $t('common.reset') }}
        </el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script lang="ts" setup generic="T extends CrudSearchSlotProps">
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import type { CrudSearchSlotProps } from '@@/composables/crud-types'

/**
 * 搜索卡片。
 *
 * 重置走 `resetSearch()` 按 key 清空再回填 defaultQuery，没有用 el-form 的
 * resetFields——后者只处理声明了 prop 的字段，未声明 prop 的查询条件会残留。
 */

defineProps<{ slotProps: T }>()

const { t } = useI18n()
const $t = t
</script>
