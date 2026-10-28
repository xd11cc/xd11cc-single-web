<template>
  <div>
    <el-tooltip effect="dark" :content="t('layout.settings.title')" placement="bottom">
      <button
        type="button"
        class="panel-trigger"
        :aria-label="t('layout.settings.title')"
        @click="show = true"
      >
        <Icon icon="lucide:settings" class="panel-icon" aria-hidden="true" />
      </button>
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
.panel-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: none;
  font-family: inherit;
  cursor: pointer;
}

.panel-icon {
  font-size: var(--p-text-xl);
  cursor: pointer;
  color: var(--theme-text-secondary);
  transition: color var(--p-duration-fast);
}
</style>
