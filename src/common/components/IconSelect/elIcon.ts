import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import type { Component } from 'vue'

const iconEntries = Object.entries(ElementPlusIconsVue)
const iconMap: Record<string, Component> = {}
const iconNames: string[] = []

iconEntries.forEach(([name, comp]) => {
  iconMap[name] = comp
  iconNames.push(name)
})

export type ElIconName = (typeof iconNames)[number] // "Search" | "UserFilled" | ...
export const iconComponentMap = iconMap
export const icons = iconNames as ElIconName[]
export default icons
