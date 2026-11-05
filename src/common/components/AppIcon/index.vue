<!--
  动态图标（名字来自后端菜单、图标选择器等）的统一入口。

  Iconify 的 <Icon> 在图标数据缺失时会去在线 API 取，离线环境永远取不到；
  这里先确保本地图标集里有这个名字（必要时懒加载完整集合），再渲染 <Icon>。
  静态图标继续直接用 <Icon>，不必经过这层异步判断。
-->
<template>
  <Icon v-if="icon && ready" v-bind="$attrs" :icon="icon" />
</template>

<script lang="ts" setup>
import { Icon, iconLoaded } from '@iconify/vue'
import { ref, watch } from 'vue'
import { ensureIconCollection } from '@/plugins/iconify'

defineOptions({ name: 'AppIcon', inheritAttrs: false })

const props = defineProps<{
  /** 图标名，如 `lucide:user`；为空时不渲染 */
  icon?: string
}>()

const ready = ref(false)

function prefixOf(name: string) {
  return name.split(':')[0]
}

watch(
  () => props.icon,
  async (name) => {
    if (!name) {
      ready.value = false
      return
    }
    if (iconLoaded(name)) {
      ready.value = true
      return
    }
    // 名字不在随包子集里：加载完整集合（一次），加载期间先不渲染，避免空白框闪烁
    ready.value = false
    await ensureIconCollection(prefixOf(name))
    ready.value = true
  },
  { immediate: true },
)
</script>
