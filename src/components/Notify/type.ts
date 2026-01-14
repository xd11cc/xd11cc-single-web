export interface NotifyItem {
  avatar?: string
  title: string
  datatime?: string
  description?: string
  status?: 'primary' | 'success' | 'info' | 'warning' | 'danger'
  extra?: string
}
