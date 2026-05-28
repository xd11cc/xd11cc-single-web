<template>
  <div class="dashboard">
    <!-- 欢迎区 -->
    <section class="greeting" style="--delay: 0">
      <div>
        <h1 class="greeting-title">{{ greetingText }}，{{ username }}</h1>
        <p class="greeting-sub">{{ currentDate }}</p>
      </div>
    </section>

    <!-- 统计卡片 -->
    <section class="stats-grid">
      <div
        v-for="(stat, i) in stats"
        :key="stat.label"
        class="stat-card"
        :style="{ '--delay': i + 1 }"
      >
        <div class="stat-header">
          <span class="stat-label">{{ stat.label }}</span>
          <span class="stat-trend" :class="stat.trendType">{{ stat.trend }}</span>
        </div>
        <div class="stat-value">{{ stat.value }}</div>
        <div class="stat-bar">
          <div class="stat-bar-fill" :style="{ width: stat.percent + '%' }"></div>
        </div>
      </div>
    </section>

    <!-- 图表区 -->
    <section class="charts-grid">
      <div class="chart-card" style="--delay: 5">
        <div class="card-header">
          <h3>访问趋势</h3>
          <div class="card-actions">
            <span
              v-for="p in periods"
              :key="p.value"
              class="period"
              :class="{ active: activePeriod === p.value }"
              @click="activePeriod = p.value"
            >{{ p.label }}</span>
          </div>
        </div>
        <v-chart :option="lineOption" autoresize class="chart" />
      </div>

      <div class="chart-card chart-card-small" style="--delay: 6">
        <div class="card-header">
          <h3>流量来源</h3>
        </div>
        <v-chart :option="pieOption" autoresize class="chart" />
      </div>
    </section>

    <!-- 主内容区 -->
    <section class="main-grid">
      <!-- 周概览柱图 -->
      <div class="chart-card" style="--delay: 7">
        <div class="card-header">
          <h3>本周概览</h3>
        </div>
        <v-chart :option="barOption" autoresize class="chart" />
      </div>

      <!-- 最近活动 -->
      <div class="activity-card" style="--delay: 8">
        <div class="card-header">
          <h3>最近活动</h3>
          <el-link type="primary" underline="never">查看全部</el-link>
        </div>
        <div class="activity-list">
          <div v-for="activity in activities" :key="activity.id" class="activity-item">
            <div class="activity-indicator" :style="{ background: activity.color }"></div>
            <div class="activity-content">
              <p class="activity-text">{{ activity.text }}</p>
              <span class="activity-time">{{ activity.time }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 快捷入口 -->
    <section class="quick-grid" style="--delay: 9">
      <div
        v-for="action in quickActions"
        :key="action.label"
        class="quick-card"
        @click="handleQuickAction(action.path)"
      >
        <Icon :icon="action.icon" class="quick-icon" />
        <span class="quick-label">{{ action.label }}</span>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components'
import { useUserStore } from '@/pinia/stores/user'
import { useTheme } from '@@/composables/useTheme'

use([CanvasRenderer, LineChart, BarChart, PieChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent])

const router = useRouter()
const userStore = useUserStore()
const { isDark } = useTheme()
const username = computed(() => userStore.username || 'Admin')

const now = new Date()
const hour = now.getHours()
const greetingText = computed(() => {
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const currentDate = computed(() => {
  const d = new Date()
  const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`
})

const stats = [
  { label: '用户总数', value: '286', trend: '+8', trendType: 'up', percent: 58 },
  { label: '在线用户', value: '34', trend: '+5', trendType: 'up', percent: 42 },
  { label: '今日登录', value: '67', trend: '+12', trendType: 'up', percent: 35 },
  { label: '待办事项', value: '5', trend: '-2', trendType: 'down', percent: 10 },
]

const periods = [
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
  { label: '年', value: 'year' },
]
const activePeriod = ref('week')

const textColor = computed(() => isDark.value ? '#a1a1aa' : '#71717a')
const borderColor = computed(() => isDark.value ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')

const lineOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: isDark.value ? '#27272a' : '#fff',
    borderColor: borderColor.value,
    textStyle: { color: isDark.value ? '#e4e4e7' : '#18181b' },
  },
  grid: { top: 20, right: 20, bottom: 30, left: 50 },
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    axisLine: { lineStyle: { color: borderColor.value } },
    axisLabel: { color: textColor.value },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: borderColor.value } },
    axisLabel: { color: textColor.value },
  },
  series: [
    {
      name: '访问量',
      type: 'line',
      smooth: true,
      data: [120, 156, 142, 178, 165, 58, 42],
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(124, 58, 237, 0.25)' },
            { offset: 1, color: 'rgba(124, 58, 237, 0)' },
          ],
        },
      },
      lineStyle: { color: '#7c3aed', width: 2 },
      itemStyle: { color: '#7c3aed' },
      symbol: 'circle',
      symbolSize: 6,
    },
    {
      name: '独立访客',
      type: 'line',
      smooth: true,
      data: [85, 102, 98, 130, 112, 36, 28],
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(16, 185, 129, 0.2)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0)' },
          ],
        },
      },
      lineStyle: { color: '#10b981', width: 2 },
      itemStyle: { color: '#10b981' },
      symbol: 'circle',
      symbolSize: 6,
    },
  ],
}))

const pieOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    backgroundColor: isDark.value ? '#27272a' : '#fff',
    borderColor: borderColor.value,
    textStyle: { color: isDark.value ? '#e4e4e7' : '#18181b' },
  },
  legend: {
    orient: 'vertical',
    right: 20,
    top: 'center',
    textStyle: { color: textColor.value },
  },
  series: [
    {
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' },
      },
      data: [
        { value: 148, name: '直接访问', itemStyle: { color: '#7c3aed' } },
        { value: 86, name: '搜索引擎', itemStyle: { color: '#10b981' } },
        { value: 53, name: '外部链接', itemStyle: { color: '#f59e0b' } },
        { value: 42, name: '收藏夹', itemStyle: { color: '#06b6d4' } },
      ],
    },
  ],
}))

const barOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: isDark.value ? '#27272a' : '#fff',
    borderColor: borderColor.value,
    textStyle: { color: isDark.value ? '#e4e4e7' : '#18181b' },
  },
  grid: { top: 20, right: 20, bottom: 30, left: 50 },
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    axisLine: { lineStyle: { color: borderColor.value } },
    axisLabel: { color: textColor.value },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: borderColor.value } },
    axisLabel: { color: textColor.value },
  },
  series: [
    {
      type: 'bar',
      data: [45, 62, 38, 71, 56, 24, 18],
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#7c3aed' },
            { offset: 1, color: 'rgba(124, 58, 237, 0.4)' },
          ],
        },
        borderRadius: [4, 4, 0, 0],
      },
      barWidth: '50%',
    },
  ],
}))

const activities = [
  { id: 1, text: '用户 张三 完成了注册', time: '5 分钟前', color: 'var(--theme-accent)' },
  { id: 2, text: '系统配置已更新', time: '12 分钟前', color: 'var(--theme-warning)' },
  { id: 3, text: '新增菜单「数据分析」', time: '1 小时前', color: 'var(--theme-info)' },
  { id: 4, text: '角色权限已调整', time: '2 小时前', color: 'var(--theme-accent)' },
  { id: 5, text: '数据库备份完成', time: '3 小时前', color: 'var(--theme-success)' },
]

const quickActions = [
  { label: '用户管理', icon: 'lucide:users', path: '/system/user' },
  { label: '角色管理', icon: 'lucide:shield', path: '/system/role' },
  { label: '菜单管理', icon: 'lucide:layout-grid', path: '/system/menu' },
  { label: '系统配置', icon: 'lucide:settings', path: '/system/config' },
]

function handleQuickAction(path: string) {
  router.push(path)
}
</script>

<style lang="scss" scoped>
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.greeting,
.stat-card,
.chart-card,
.activity-card,
.quick-grid {
  animation: fade-up 0.5s var(--p-ease-out) both;
  animation-delay: calc(var(--delay, 0) * 80ms);
}

.dashboard {
  padding: var(--p-space-6);
}

.greeting {
  margin-bottom: var(--p-space-6);

  .greeting-title {
    margin: 0;
    font-family: var(--p-font-display);
    font-size: var(--p-text-2xl);
    font-weight: var(--p-weight-bold);
    color: var(--theme-text-primary);
    letter-spacing: -0.5px;
  }

  .greeting-sub {
    margin: var(--p-space-1) 0 0;
    font-size: var(--p-text-sm);
    color: var(--theme-text-muted);
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--p-space-4);
  margin-bottom: var(--p-space-6);

  @media (max-width: 991px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  padding: var(--card-padding);
  border-radius: var(--card-radius);
  background: var(--theme-bg-surface);
  border: 1px solid var(--theme-border);
  transition: border-color var(--p-duration-fast);

  &:hover {
    border-color: var(--theme-accent);
  }

  .stat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--p-space-2);
  }

  .stat-label {
    font-size: var(--p-text-sm);
    color: var(--theme-text-muted);
    font-weight: var(--p-weight-medium);
  }

  .stat-trend {
    font-size: var(--p-text-xs);
    font-weight: var(--p-weight-medium);

    &.up { color: var(--theme-success); }
    &.down { color: var(--theme-danger); }
    &.stable { color: var(--theme-text-muted); }
  }

  .stat-value {
    font-family: var(--p-font-display);
    font-size: var(--p-text-xl);
    font-weight: var(--p-weight-bold);
    color: var(--theme-text-primary);
    margin-bottom: var(--p-space-3);
  }

  .stat-bar {
    height: 3px;
    border-radius: var(--p-radius-full);
    background: var(--theme-bg-elevated);
    overflow: hidden;

    .stat-bar-fill {
      height: 100%;
      border-radius: var(--p-radius-full);
      background: var(--theme-accent);
      transition: width 0.8s var(--p-ease-out);
    }
  }
}

.charts-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: var(--p-space-4);
  margin-bottom: var(--p-space-6);

  @media (max-width: 991px) {
    grid-template-columns: 1fr;
  }
}

.main-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: var(--p-space-4);
  margin-bottom: var(--p-space-6);

  @media (max-width: 991px) {
    grid-template-columns: 1fr;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--p-space-4);

  h3 {
    margin: 0;
    font-family: var(--p-font-display);
    font-size: var(--p-text-md);
    font-weight: var(--p-weight-semibold);
    color: var(--theme-text-primary);
  }

  .card-actions {
    display: flex;
    gap: 2px;
    background: var(--theme-bg-elevated);
    border-radius: var(--p-radius-md);
    padding: 2px;

    .period {
      padding: 3px 8px;
      font-size: var(--p-text-xs);
      font-weight: var(--p-weight-medium);
      border-radius: var(--p-radius-sm);
      cursor: pointer;
      color: var(--theme-text-muted);
      transition: all var(--p-duration-fast);

      &.active {
        background: var(--theme-accent);
        color: #fff;
      }

      &:hover:not(.active) {
        color: var(--theme-text-primary);
      }
    }
  }
}

.chart-card {
  padding: var(--card-padding);
  border-radius: var(--card-radius);
  background: var(--theme-bg-surface);
  border: 1px solid var(--theme-border);

  .chart {
    width: 100%;
    height: 240px;
  }
}

.activity-card {
  padding: var(--card-padding);
  border-radius: var(--card-radius);
  background: var(--theme-bg-surface);
  border: 1px solid var(--theme-border);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-4);
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: var(--p-space-3);

  .activity-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 7px;
  }

  .activity-content {
    flex: 1;
    min-width: 0;

    .activity-text {
      margin: 0;
      font-size: var(--p-text-base);
      color: var(--theme-text-primary);
      line-height: 1.4;
    }

    .activity-time {
      font-size: var(--p-text-xs);
      color: var(--theme-text-muted);
    }
  }
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--p-space-3);

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.quick-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--p-space-2);
  padding: var(--p-space-5) var(--p-space-4);
  border-radius: var(--card-radius);
  background: var(--theme-bg-surface);
  border: 1px solid var(--theme-border);
  cursor: pointer;
  transition: all var(--p-duration-fast) var(--p-ease-out);

  &:hover {
    border-color: var(--theme-accent);
    background: var(--theme-accent-light);
    transform: translateY(-2px);
  }

  .quick-icon {
    font-size: 20px;
    color: var(--theme-accent);
  }

  .quick-label {
    font-size: var(--p-text-sm);
    font-weight: var(--p-weight-medium);
    color: var(--theme-text-primary);
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: var(--p-space-4);
  }
}
</style>
