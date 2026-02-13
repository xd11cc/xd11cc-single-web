<template>
  {{ url }}
  <div>
    <IFrame :src="url" />
  </div>
</template>

<script lang="ts" setup>
import IFrame from '@@/components/IFrame/index.vue'

const url = ref<string>(
  import.meta.env.VITE_BASE_URL + import.meta.env.VITE_PUBLIC_PATH + '/druid/login.html',
)
</script>
