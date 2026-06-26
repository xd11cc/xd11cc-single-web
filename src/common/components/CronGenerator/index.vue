<template>
  <div class="cron-generator">
    <el-tabs type="border-card" v-model="activeTab">
      <!-- 秒 -->
      <el-tab-pane label="秒" name="second">
        <el-form label-position="left" size="small">
          <el-form-item>
            <el-radio v-model="secondRadio" :value="1" @change="onTabChange('second')">
              每秒，允许的通配符 [, - * /]
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="secondRadio" :value="2" @change="onTabChange('second')">
              周期从
              <el-input-number v-model="secondCycle01" :min="0" :max="58" size="small" /> -
              <el-input-number v-model="secondCycle02" :min="secondCycle01 + 1" :max="59" size="small" /> 秒
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="secondRadio" :value="3" @change="onTabChange('second')">
              从
              <el-input-number v-model="secondAvg01" :min="0" :max="58" size="small" /> 秒开始，每
              <el-input-number v-model="secondAvg02" :min="1" :max="59" size="small" /> 秒执行一次
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="secondRadio" :value="4" @change="onTabChange('second')">
              指定
              <el-select v-model="secondCheckList" multiple clearable placeholder="可多选" style="width: 100%">
                <el-option v-for="i in 60" :key="i - 1" :label="i - 1" :value="i - 1" />
              </el-select>
            </el-radio>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 分钟 -->
      <el-tab-pane label="分钟" name="min">
        <el-form label-position="left" size="small">
          <el-form-item>
            <el-radio v-model="minRadio" :value="1" @change="onTabChange('min')">
              每分钟，允许的通配符 [, - * /]
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="minRadio" :value="2" @change="onTabChange('min')">
              周期从
              <el-input-number v-model="minCycle01" :min="0" :max="58" size="small" /> -
              <el-input-number v-model="minCycle02" :min="minCycle01 + 1" :max="59" size="small" /> 分钟
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="minRadio" :value="3" @change="onTabChange('min')">
              从
              <el-input-number v-model="minAvg01" :min="0" :max="58" size="small" /> 分钟开始，每
              <el-input-number v-model="minAvg02" :min="1" :max="59" size="small" /> 分钟执行一次
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="minRadio" :value="4" @change="onTabChange('min')">
              指定
              <el-select v-model="minCheckList" multiple clearable placeholder="可多选" style="width: 100%">
                <el-option v-for="i in 60" :key="i - 1" :label="i - 1" :value="i - 1" />
              </el-select>
            </el-radio>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 小时 -->
      <el-tab-pane label="小时" name="hour">
        <el-form label-position="left" size="small">
          <el-form-item>
            <el-radio v-model="hourRadio" :value="1" @change="onTabChange('hour')">
              每小时，允许的通配符 [, - * /]
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="hourRadio" :value="2" @change="onTabChange('hour')">
              周期从
              <el-input-number v-model="hourCycle01" :min="0" :max="22" size="small" /> -
              <el-input-number v-model="hourCycle02" :min="hourCycle01 + 1" :max="23" size="small" /> 小时
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="hourRadio" :value="3" @change="onTabChange('hour')">
              从
              <el-input-number v-model="hourAvg01" :min="0" :max="22" size="small" /> 小时开始，每
              <el-input-number v-model="hourAvg02" :min="1" :max="23" size="small" /> 小时执行一次
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="hourRadio" :value="4" @change="onTabChange('hour')">
              指定
              <el-select v-model="hourCheckList" multiple clearable placeholder="可多选" style="width: 100%">
                <el-option v-for="i in 24" :key="i - 1" :label="i - 1" :value="i - 1" />
              </el-select>
            </el-radio>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 日 -->
      <el-tab-pane label="日" name="day">
        <el-form label-position="left" size="small">
          <el-form-item>
            <el-radio v-model="dayRadio" :value="1" @change="onTabChange('day')">
              每日，允许的通配符 [, - * ? / L W]
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="dayRadio" :value="2" @change="onTabChange('day')">
              不指定
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="dayRadio" :value="3" @change="onTabChange('day')">
              周期从
              <el-input-number v-model="dayCycle01" :min="1" :max="30" size="small" /> -
              <el-input-number v-model="dayCycle02" :min="dayCycle01 + 1" :max="31" size="small" /> 日
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="dayRadio" :value="4" @change="onTabChange('day')">
              从
              <el-input-number v-model="dayAvg01" :min="1" :max="30" size="small" /> 号开始，每
              <el-input-number v-model="dayAvg02" :min="1" :max="31" size="small" /> 日执行一次
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="dayRadio" :value="5" @change="onTabChange('day')">
              每月
              <el-input-number v-model="dayWorkday" :min="1" :max="31" size="small" /> 号最近的那个工作日
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="dayRadio" :value="6" @change="onTabChange('day')">
              本月最后一天
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="dayRadio" :value="7" @change="onTabChange('day')">
              指定
              <el-select v-model="dayCheckList" multiple clearable placeholder="可多选" style="width: 100%">
                <el-option v-for="i in 31" :key="i" :label="i" :value="i" />
              </el-select>
            </el-radio>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 月 -->
      <el-tab-pane label="月" name="month">
        <el-form label-position="left" size="small">
          <el-form-item>
            <el-radio v-model="monthRadio" :value="1" @change="onTabChange('month')">
              每月，允许的通配符 [, - * /]
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="monthRadio" :value="2" @change="onTabChange('month')">
              周期从
              <el-input-number v-model="monthCycle01" :min="1" :max="11" size="small" /> -
              <el-input-number v-model="monthCycle02" :min="monthCycle01 + 1" :max="12" size="small" /> 月
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="monthRadio" :value="3" @change="onTabChange('month')">
              从
              <el-input-number v-model="monthAvg01" :min="1" :max="11" size="small" /> 月开始，每
              <el-input-number v-model="monthAvg02" :min="1" :max="12" size="small" /> 月执行一次
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="monthRadio" :value="4" @change="onTabChange('month')">
              指定
              <el-select v-model="monthCheckList" multiple clearable placeholder="可多选" style="width: 100%">
                <el-option v-for="i in 12" :key="i" :label="i" :value="i" />
              </el-select>
            </el-radio>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 周 -->
      <el-tab-pane label="周" name="week">
        <el-form label-position="left" size="small">
          <el-form-item>
            <el-radio v-model="weekRadio" :value="1" @change="onTabChange('week')">
              每周，允许的通配符 [, - * ? / L #]
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="weekRadio" :value="2" @change="onTabChange('week')">
              不指定
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="weekRadio" :value="3" @change="onTabChange('week')">
              周期从
              <el-select v-model="weekCycle01" placeholder="开始" size="small" style="width: 100px">
                <el-option
                  v-for="w in weekList"
                  :key="w.key"
                  :label="w.label"
                  :value="w.key"
                  :disabled="w.key === 1"
                />
              </el-select>
              -
              <el-select v-model="weekCycle02" placeholder="结束" size="small" style="width: 100px">
                <el-option
                  v-for="w in weekList"
                  :key="w.key"
                  :label="w.label"
                  :value="w.key"
                />
              </el-select>
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="weekRadio" :value="4" @change="onTabChange('week')">
              第
              <el-input-number v-model="weekAvg01" :min="1" :max="4" size="small" /> 周的
              <el-select v-model="weekAvg02" placeholder="星期" size="small" style="width: 110px">
                <el-option
                  v-for="w in weekList"
                  :key="w.key"
                  :label="w.label"
                  :value="w.key"
                />
              </el-select>
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="weekRadio" :value="5" @change="onTabChange('week')">
              本月最后一个
              <el-select v-model="weekLastDay" placeholder="星期" size="small" style="width: 110px">
                <el-option
                  v-for="w in weekList"
                  :key="w.key"
                  :label="w.label"
                  :value="w.key"
                />
              </el-select>
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="weekRadio" :value="6" @change="onTabChange('week')">
              指定
              <el-select v-model="weekCheckList" multiple clearable placeholder="可多选" style="width: 100%">
                <el-option
                  v-for="w in weekList"
                  :key="w.key"
                  :label="w.label"
                  :value="w.key"
                />
              </el-select>
            </el-radio>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 年 -->
      <el-tab-pane label="年" name="year">
        <el-form label-position="left" size="small">
          <el-form-item>
            <el-radio v-model="yearRadio" :value="1" @change="onTabChange('year')">
              不填，允许的通配符 [, - * /]
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="yearRadio" :value="2" @change="onTabChange('year')">
              每年
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="yearRadio" :value="3" @change="onTabChange('year')">
              周期从
              <el-input-number v-model="yearCycle01" :min="currentYear" :max="2098" size="small" /> -
              <el-input-number v-model="yearCycle02" :min="yearCycle01 + 1" :max="2099" size="small" />
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="yearRadio" :value="4" @change="onTabChange('year')">
              从
              <el-input-number v-model="yearAvg01" :min="currentYear" :max="2098" size="small" /> 年开始，每
              <el-input-number v-model="yearAvg02" :min="1" :max="100" size="small" /> 年执行一次
            </el-radio>
          </el-form-item>
          <el-form-item>
            <el-radio v-model="yearRadio" :value="5" @change="onTabChange('year')">
              指定
              <el-select v-model="yearCheckList" multiple clearable placeholder="可多选" style="width: 100%">
                <el-option
                  v-for="i in 9"
                  :key="i - 1 + currentYear"
                  :label="i - 1 + currentYear"
                  :value="i - 1 + currentYear"
                />
              </el-select>
            </el-radio>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <!-- 表达式预览 -->
    <div class="cron-expr-panel">
      <div class="cron-expr-header">
        <span class="cron-expr-label">Cron 表达式</span>
      </div>
      <div class="cron-expr-body">
        <div class="cron-fields">
          <div class="cron-field" v-for="f in cronFieldLabels" :key="f.key">
            <span class="cron-field-label">{{ f.label }}</span>
            <span class="cron-field-value">{{ cronParts[f.key] }}</span>
          </div>
        </div>
        <div class="cron-expr-divider" />
        <div class="cron-expr-output">
          <code class="cron-expr-code">{{ cronExpression }}</code>
        </div>
      </div>
    </div>

    <!-- 最近运行时间 -->
    <div class="cron-run-panel">
      <div class="cron-run-header">最近 5 次运行时间</div>
      <ul class="cron-run-list">
        <li v-for="(time, idx) in runTimes" :key="idx" class="cron-run-item">
          <span class="cron-run-index">{{ idx + 1 }}</span>
          <code class="cron-run-time">{{ time || '—' }}</code>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'

// ==================== Props & Emits ====================

const props = withDefaults(defineProps<{
  modelValue?: string
}>(), {
  modelValue: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// ==================== Constants ====================

const currentYear = new Date().getFullYear()
const activeTab = ref('second')

const cronFieldLabels = [
  { key: 'second', label: '秒' },
  { key: 'min', label: '分' },
  { key: 'hour', label: '时' },
  { key: 'day', label: '日' },
  { key: 'month', label: '月' },
  { key: 'week', label: '周' },
  { key: 'year', label: '年' },
] as const

const weekList = [
  { key: 2, label: '星期一' },
  { key: 3, label: '星期二' },
  { key: 4, label: '星期三' },
  { key: 5, label: '星期四' },
  { key: 6, label: '星期五' },
  { key: 7, label: '星期六' },
  { key: 1, label: '星期日' },
]

// ==================== 秒 ====================
const secondRadio = ref(1)
const secondCycle01 = ref(1)
const secondCycle02 = ref(2)
const secondAvg01 = ref(0)
const secondAvg02 = ref(1)
const secondCheckList = ref<number[]>([])

const secondValue = computed(() => {
  switch (secondRadio.value) {
    case 1: return '*'
    case 2: return `${checkNum(secondCycle01.value, 0, 58)}-${checkNum(secondCycle02.value, secondCycle01.value + 1, 59)}`
    case 3: return `${checkNum(secondAvg01.value, 0, 58)}/${checkNum(secondAvg02.value, 1, 59)}`
    case 4: return secondCheckList.value.length ? secondCheckList.value.sort((a, b) => a - b).join(',') : '*'
    default: return '*'
  }
})

// ==================== 分钟 ====================
const minRadio = ref(1)
const minCycle01 = ref(1)
const minCycle02 = ref(2)
const minAvg01 = ref(0)
const minAvg02 = ref(1)
const minCheckList = ref<number[]>([])

const minValue = computed(() => {
  switch (minRadio.value) {
    case 1: return '*'
    case 2: return `${checkNum(minCycle01.value, 0, 58)}-${checkNum(minCycle02.value, minCycle01.value + 1, 59)}`
    case 3: return `${checkNum(minAvg01.value, 0, 58)}/${checkNum(minAvg02.value, 1, 59)}`
    case 4: return minCheckList.value.length ? minCheckList.value.sort((a, b) => a - b).join(',') : '*'
    default: return '*'
  }
})

// ==================== 小时 ====================
const hourRadio = ref(1)
const hourCycle01 = ref(0)
const hourCycle02 = ref(1)
const hourAvg01 = ref(0)
const hourAvg02 = ref(1)
const hourCheckList = ref<number[]>([])

const hourValue = computed(() => {
  switch (hourRadio.value) {
    case 1: return '*'
    case 2: return `${checkNum(hourCycle01.value, 0, 22)}-${checkNum(hourCycle02.value, hourCycle01.value + 1, 23)}`
    case 3: return `${checkNum(hourAvg01.value, 0, 22)}/${checkNum(hourAvg02.value, 1, 23)}`
    case 4: return hourCheckList.value.length ? hourCheckList.value.sort((a, b) => a - b).join(',') : '*'
    default: return '*'
  }
})

// ==================== 日 ====================
const dayRadio = ref(1)
const dayCycle01 = ref(1)
const dayCycle02 = ref(2)
const dayAvg01 = ref(1)
const dayAvg02 = ref(1)
const dayWorkday = ref(1)
const dayCheckList = ref<number[]>([])

const dayValue = computed(() => {
  switch (dayRadio.value) {
    case 1: return '*'
    case 2: return '?'
    case 3: return `${checkNum(dayCycle01.value, 1, 30)}-${checkNum(dayCycle02.value, dayCycle01.value + 1, 31)}`
    case 4: return `${checkNum(dayAvg01.value, 1, 30)}/${checkNum(dayAvg02.value, 1, 31)}`
    case 5: return `${checkNum(dayWorkday.value, 1, 31)}W`
    case 6: return 'L'
    case 7: return dayCheckList.value.length ? dayCheckList.value.sort((a, b) => a - b).join(',') : '*'
    default: return '*'
  }
})

// ==================== 月 ====================
const monthRadio = ref(1)
const monthCycle01 = ref(1)
const monthCycle02 = ref(2)
const monthAvg01 = ref(1)
const monthAvg02 = ref(1)
const monthCheckList = ref<number[]>([])

const monthValue = computed(() => {
  switch (monthRadio.value) {
    case 1: return '*'
    case 2: return `${checkNum(monthCycle01.value, 1, 11)}-${checkNum(monthCycle02.value, monthCycle01.value + 1, 12)}`
    case 3: return `${checkNum(monthAvg01.value, 1, 11)}/${checkNum(monthAvg02.value, 1, 12)}`
    case 4: return monthCheckList.value.length ? monthCheckList.value.sort((a, b) => a - b).join(',') : '*'
    default: return '*'
  }
})

// ==================== 周 ====================
const weekRadio = ref(2)
const weekCycle01 = ref(2)
const weekCycle02 = ref(3)
const weekAvg01 = ref(1)
const weekAvg02 = ref(2)
const weekLastDay = ref(2)
const weekCheckList = ref<number[]>([])

const weekValue = computed(() => {
  switch (weekRadio.value) {
    case 1: return '*'
    case 2: return '?'
    case 3: {
      const c1 = checkNum(weekCycle01.value, 1, 7)
      const c2 = checkNum(weekCycle02.value, 1, 7)
      return `${c1}-${c2}`
    }
    case 4: return `${checkNum(weekAvg02.value, 1, 7)}#${checkNum(weekAvg01.value, 1, 4)}`
    case 5: return `${checkNum(weekLastDay.value, 1, 7)}L`
    case 6: return weekCheckList.value.length ? weekCheckList.value.sort((a, b) => a - b).join(',') : '*'
    default: return '?'
  }
})

// ==================== 年 ====================
const yearRadio = ref(1)
const yearCycle01 = ref(currentYear)
const yearCycle02 = ref(currentYear + 1)
const yearAvg01 = ref(currentYear)
const yearAvg02 = ref(1)
const yearCheckList = ref<number[]>([])

const yearValue = computed(() => {
  switch (yearRadio.value) {
    case 1: return ''
    case 2: return '*'
    case 3: return `${checkNum(yearCycle01.value, currentYear, 2098)}-${checkNum(yearCycle02.value, yearCycle01.value + 1, 2099)}`
    case 4: return `${checkNum(yearAvg01.value, currentYear, 2098)}/${checkNum(yearAvg02.value, 1, 100)}`
    case 5: return yearCheckList.value.length ? yearCheckList.value.sort((a, b) => a - b).join(',') : ''
    default: return ''
  }
})

// ==================== 组装表达式 ====================

const cronExpression = computed(() => {
  const parts = [
    secondValue.value,
    minValue.value,
    hourValue.value,
    dayValue.value,
    monthValue.value,
    weekValue.value,
  ]
  if (yearValue.value) {
    parts.push(yearValue.value)
  }
  return parts.join(' ')
})

const cronParts = computed(() => ({
  second: secondValue.value,
  min: minValue.value,
  hour: hourValue.value,
  day: dayValue.value,
  month: monthValue.value,
  week: weekValue.value,
  year: yearValue.value || '-',
}))

// ==================== v-model 同步 ====================

watch(cronExpression, (val) => {
  emit('update:modelValue', val)
}, { immediate: true })

// ==================== 交叉校验：日/周互斥 ====================

function onTabChange(from: string) {
  if (from === 'day' && dayRadio.value !== 2 && weekRadio.value !== 2) {
    weekRadio.value = 2
  }
  if (from === 'week' && weekRadio.value !== 2 && dayRadio.value !== 2) {
    dayRadio.value = 2
  }
  // 非每小时/每天模式时，把分和秒重置为0，避免意外的高频执行
  if (from === 'hour' && hourRadio.value !== 1) {
    if (minRadio.value === 1) minRadio.value = 4
    if (secondRadio.value === 1) secondRadio.value = 4
  }
}

// ==================== 数字校验 ====================

function checkNum(value: number, min: number, max: number): number {
  const v = Math.floor(value)
  if (v < min) return min
  if (v > max) return max
  return v
}

// ==================== 解析表达式 ====================

function resolveExp(exp: string) {
  if (!exp) return
  const parts = exp.trim().split(/\s+/)
  if (parts.length < 6) return

  const expObj: Record<string, string> = {
    second: parts[0],
    min: parts[1],
    hour: parts[2],
    day: parts[3],
    month: parts[4],
    week: parts[5],
    year: parts[6] || '',
  }

  setTabValue('second', expObj.second)
  setTabValue('min', expObj.min)
  setTabValue('hour', expObj.hour)
  setTabValue('day', expObj.day)
  setTabValue('month', expObj.month)
  setTabValue('week', expObj.week)
  setTabValue('year', expObj.year)
}

function setTabValue(tab: string, value: string) {
  const simpleUnits = ['second', 'min', 'hour', 'month']
  if (simpleUnits.includes(tab)) {
    if (value === '*') {
      setRadio(tab, 1)
    } else if (value.includes('-')) {
      const [a, b] = value.split('-').map(Number)
      setRange(tab, a, b)
      setRadio(tab, 2)
    } else if (value.includes('/')) {
      const [a, b] = value.split('/').map(Number)
      setAvg(tab, a, b)
      setRadio(tab, 3)
    } else {
      setCheckList(tab, value.split(',').map(Number))
      setRadio(tab, 4)
    }
  } else if (tab === 'day') {
    if (value === '*') setRadio(tab, 1)
    else if (value === '?') setRadio(tab, 2)
    else if (value.includes('-')) { const [a, b] = value.split('-').map(Number); setRange(tab, a, b); setRadio(tab, 3) }
    else if (value.includes('/')) { const [a, b] = value.split('/').map(Number); setAvg(tab, a, b); setRadio(tab, 4) }
    else if (value.includes('W')) { dayWorkday.value = parseInt(value); setRadio(tab, 5) }
    else if (value === 'L') setRadio(tab, 6)
    else { setCheckList(tab, value.split(',').map(Number)); setRadio(tab, 7) }
  } else if (tab === 'week') {
    if (value === '*') setRadio(tab, 1)
    else if (value === '?') setRadio(tab, 2)
    else if (value.includes('-')) { const [a, b] = value.split('-').map(Number); weekCycle01.value = a; weekCycle02.value = b; setRadio(tab, 3) }
    else if (value.includes('#')) { const [b, a] = value.split('#').map(Number); weekAvg01.value = a; weekAvg02.value = b; setRadio(tab, 4) }
    else if (value.includes('L')) { weekLastDay.value = parseInt(value); setRadio(tab, 5) }
    else { setCheckList(tab, value.split(',').map(Number)); setRadio(tab, 6) }
  } else if (tab === 'year') {
    if (value === '') setRadio(tab, 1)
    else if (value === '*') setRadio(tab, 2)
    else if (value.includes('-')) { const [a, b] = value.split('-').map(Number); yearCycle01.value = a; yearCycle02.value = b; setRadio(tab, 3) }
    else if (value.includes('/')) { const [a, b] = value.split('/').map(Number); yearAvg01.value = a; yearAvg02.value = b; setRadio(tab, 4) }
    else { yearCheckList.value = value.split(',').map(Number); setRadio(tab, 5) }
  }
}

function setRadio(tab: string, val: number) {
  const map: Record<string, Ref<number>> = {
    second: secondRadio, min: minRadio, hour: hourRadio,
    day: dayRadio, month: monthRadio, week: weekRadio, year: yearRadio,
  }
  if (map[tab]) map[tab].value = val
}

function setRange(tab: string, a: number, b: number) {
  if (tab === 'second') { secondCycle01.value = a; secondCycle02.value = b }
  if (tab === 'min') { minCycle01.value = a; minCycle02.value = b }
  if (tab === 'hour') { hourCycle01.value = a; hourCycle02.value = b }
  if (tab === 'day') { dayCycle01.value = a; dayCycle02.value = b }
  if (tab === 'month') { monthCycle01.value = a; monthCycle02.value = b }
}

function setAvg(tab: string, a: number, b: number) {
  if (tab === 'second') { secondAvg01.value = a; secondAvg02.value = b }
  if (tab === 'min') { minAvg01.value = a; minAvg02.value = b }
  if (tab === 'hour') { hourAvg01.value = a; hourAvg02.value = b }
  if (tab === 'day') { dayAvg01.value = a; dayAvg02.value = b }
  if (tab === 'month') { monthAvg01.value = a; monthAvg02.value = b }
}

function setCheckList(tab: string, arr: number[]) {
  if (tab === 'second') secondCheckList.value = arr
  if (tab === 'min') minCheckList.value = arr
  if (tab === 'hour') hourCheckList.value = arr
  if (tab === 'day') dayCheckList.value = arr
  if (tab === 'month') monthCheckList.value = arr
  if (tab === 'week') weekCheckList.value = arr
  if (tab === 'year') yearCheckList.value = arr
}

// ==================== 初始解析 ====================

let initialized = false
watch(() => props.modelValue, (val) => {
  if (val && !initialized) {
    resolveExp(val)
    initialized = true
  }
}, { immediate: true })

// ==================== 最近 5 次运行时间 ====================

const runTimes = ref<string[]>([])

function calcRunTimes() {
  const cron = cronExpression.value
  if (!cron) { runTimes.value = []; return }

  runTimes.value = [] // "计算中..."
  try {
    const parts = cron.trim().split(/\s+/)
    const rules = {
      second: parts[0] || '*',
      min: parts[1] || '*',
      hour: parts[2] || '*',
      day: parts[3] || '*',
      month: parts[4] || '*',
      week: parts[5] || '?',
      year: parts[6] || '',
    }
    runTimes.value = computeNextRuns(rules, 5)
  } catch {
    runTimes.value = ['无法解析表达式']
  }
}

function computeNextRuns(rules: Record<string, string>, count: number): string[] {
  const results: string[] = []
  const now = new Date()
  let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds())

  const secs = expandField(rules.second, 0, 59)
  const mins = expandField(rules.min, 0, 59)
  const hours = expandField(rules.hour, 0, 23)
  const days = expandField(rules.day, 1, 31)
  const months = expandField(rules.month, 1, 12)
  const weeks = expandField(rules.week, 1, 7)
  const years = rules.year && rules.year !== '' && rules.year !== '*'
    ? expandField(rules.year, currentYear, currentYear + 100)
    : null

  const hasDaySpecified = rules.day !== '?'
  const hasWeekSpecified = rules.week !== '?'

  let safety = 0
  const maxIterations = 366 * 100 // safe limit

  while (results.length < count && safety < maxIterations) {
    safety++
    cursor = new Date(cursor.getTime() + 1000)

    const y = cursor.getFullYear()
    const mo = cursor.getMonth() + 1
    const d = cursor.getDate()
    const h = cursor.getHours()
    const mi = cursor.getMinutes()
    const s = cursor.getSeconds()
    const dow = cursor.getDay() === 0 ? 7 : cursor.getDay()

    if (years && !years.includes(y)) continue
    if (!months.includes(mo)) continue

    const dayMatch = hasDaySpecified ? days.includes(d) : false
    const weekMatch = hasWeekSpecified ? weeks.includes(dow) : false

    let dayOk = false
    if (hasDaySpecified && hasWeekSpecified) {
      dayOk = dayMatch || weekMatch
    } else if (hasDaySpecified) {
      dayOk = dayMatch
    } else if (hasWeekSpecified) {
      dayOk = weekMatch
    } else {
      dayOk = true
    }

    if (!dayOk) continue
    if (!hours.includes(h)) continue
    if (!mins.includes(mi)) continue
    if (!secs.includes(s)) continue

    results.push(formatDate(cursor))
  }

  if (results.length === 0) {
    results.push('最近100年内没有达到条件的结果')
  }

  return results
}

function expandField(field: string, min: number, max: number): number[] {
  if (!field || field === '*' || field === '?') {
    const arr: number[] = []
    for (let i = min; i <= max; i++) arr.push(i)
    return arr
  }

  const result = new Set<number>()

  const parts = field.split(',')
  for (const part of parts) {
    if (part === '*') {
      for (let i = min; i <= max; i++) result.add(i)
    } else if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number)
      for (let i = start; i <= end; i++) {
        if (i >= min && i <= max) result.add(i)
      }
    } else if (part.includes('/')) {
      const [base, step] = part.split('/')
      const stepNum = Number(step)
      if (base === '*') {
        for (let i = min; i <= max; i += stepNum) result.add(i)
      } else {
        const baseNum = Number(base)
        for (let i = baseNum; i <= max; i += stepNum) result.add(i)
      }
    } else if (part.includes('W')) {
      // Workday — simplified: just include the raw number
      const num = parseInt(part)
      if (num >= min && num <= max) result.add(num)
    } else if (part.endsWith('L')) {
      const num = parseInt(part)
      if (num >= min && num <= max) result.add(num)
    } else if (part.includes('#')) {
      const [weekDay] = part.split('#').map(Number)
      if (weekDay >= min && weekDay <= max) result.add(weekDay)
    } else {
      const num = Number(part)
      if (!isNaN(num) && num >= min && num <= max) result.add(num)
    }
  }

  return Array.from(result).sort((a, b) => a - b)
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${mo}-${d} ${h}:${mi}:${s}`
}

watch(cronExpression, calcRunTimes, { immediate: true })
</script>

<style lang="scss" scoped>
.cron-generator {
  :deep(.el-tabs__content) {
    padding: 12px 16px;
  }

  :deep(.el-radio) {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  :deep(.el-input-number),
  :deep(.el-select) {
    width: auto;
  }

  :deep(.el-input-number .el-input__wrapper) {
    width: 110px;
  }
}

// 表达式预览
.cron-expr-panel {
  margin-top: 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
}

.cron-expr-header {
  padding: 6px 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color);
}

.cron-expr-body {
  display: flex;
  align-items: stretch;
}

.cron-fields {
  flex: 1;
  display: flex;
  min-width: 0;
}

.cron-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  border-right: 1px solid var(--el-border-color-lighter);

  &:last-child {
    border-right: 0;
  }
}

.cron-field-label {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-bottom: 2px;
}

.cron-field-value {
  font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.cron-expr-divider {
  width: 1px;
  background: var(--el-border-color);
}

.cron-expr-output {
  flex: 0 0 auto;
  width: 25%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  background: var(--el-fill-color-lighter);
}

.cron-expr-code {
  font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// 最近运行时间
.cron-run-panel {
  margin-top: 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
}

.cron-run-header {
  padding: 6px 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color);
}

.cron-run-list {
  margin: 0;
  padding: 8px 12px;
  list-style: none;
}

.cron-run-item {
  display: flex;
  align-items: center;
  gap: 10px;
  line-height: 2;
}

.cron-run-index {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  border-radius: 4px;
}

.cron-run-time {
  font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
</style>
