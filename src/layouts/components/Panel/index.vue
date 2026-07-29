<template>
  <div>
    <el-tooltip effect="dark" :content="t('layout.settings.title')" placement="bottom">
      <Icon icon="lucide:settings" @click="show = true" class="panel-icon" />
    </el-tooltip>
    <el-drawer v-model="show" size="300px" :with-header="false">
      <slot />
    </el-drawer>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'

const show = ref<boolean>(false)
const { t } = useI18n()
</script>

<style lang="scss" scoped>
.panel-icon {
  font-size: 18px;
  cursor: pointer;
  color: var(--theme-text-secondary);
  transition: color var(--p-duration-fast);
  &:focus {
    outline: none;
  }
}
</style>
