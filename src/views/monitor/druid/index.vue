<template>
  <div>
    <IFrame :src="url" />
  </div>
</template>

<script lang="ts" setup>
defineOptions({ name: 'Druid' })
import IFrame from '@@/components/IFrame/index.vue'

const url = ref<string>(
  import.meta.env.VITE_BASE_URL + import.meta.env.VITE_API_PREFIX + '/druid/login.html',
)
</script>
