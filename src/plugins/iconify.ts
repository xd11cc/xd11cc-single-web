import { addCollection } from '@iconify/vue'
import epIcons from '@iconify-json/ep/icons.json'
import lucideIcons from '@iconify-json/lucide/icons.json'

export function installIconify() {
  addCollection(epIcons)
  addCollection(lucideIcons)
}
