<template>
  <component
    :is="menuItem.children && menuItem.children.length > 0 ? 'el-sub-menu' : 'el-menu-item'"
    :index="menuItem.id"
  >
    <template #title>
      <el-icon v-if="menuItem.icon">
        <component :is="menuItem.icon" />
      </el-icon>
      <span>{{ menuItem.menuName }}</span>
    </template>

    <!-- 子菜单内容 -->
    <RecursiveMenu
      v-if="menuItem.children?.length > 0"
      v-for="child in menuItem.children"
      :key="child.id"
      :menu-item="child"
    />
  </component>
</template>

<script setup>
defineProps({
  menuItem: {
    type: Object,
    required: true,
  },
})
</script>

<style lang="scss" scoped></style>
