/**
 * bpmn-js 没有类型定义（也未提供 @types），这里只声明本项目实际用到的表面，
 * 避免各处写 any。成员是按现有调用点反推的，未覆盖 bpmn-js 的全部能力。
 */

/** 带扩展属性读取能力的 moddle 片段（loopCharacteristics 等） */
export interface ModdleExtension {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get?: (property: string) => any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

/** moddle 业务对象：$type / $parent 固定，其余属性随扩展（flowable:*）动态变化 */
export interface ModdleElement {
  $type: string
  $parent?: ModdleElement
  id?: string
  name?: string
  documentation?: Array<{ text?: string }>
  /** 多实例（会签/或签）配置，本身也是 moddle 对象（带 get） */
  loopCharacteristics?: ModdleExtension & {
    completionCondition?: { body?: string }
  }
  /** 扩展元素容器（监听器、流程变量等都挂在这里） */
  extensionElements?: { values?: ModdleElement[] }
  /**
   * moddle 的扩展属性读取入口，如 get('flowable:approvalMode')。
   * 扩展属性的类型由后端/流程定义决定，这里无法枚举，故为 any。
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get?: (property: string) => any
  /** 由扩展（flowable:* 等）动态挂载的属性，无法枚举 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

/** bpmn-js 画布上的图形元素 */
export interface BpmnElement {
  id: string
  type: string
  businessObject: ModdleElement
}

export interface Moddle {
  create(type: string, attrs?: Record<string, unknown>): ModdleElement
}

export interface Canvas {
  /** 不传参数时返回当前缩放级别；传 'fit-viewport' 则适配视口 */
  zoom(scale?: number | 'fit-viewport', center?: 'auto' | Record<string, number>): number
  getRootElement(): BpmnElement
  scrollToElement(element: BpmnElement): void
}

export interface Modeling {
  updateProperties(element: BpmnElement | ModdleElement, properties: Record<string, unknown>): void
}

export interface Selection {
  get(): BpmnElement[]
  select(element: BpmnElement | null): void
}

export interface CommandStack {
  undo(): void
  redo(): void
}

export interface SelectionChangedEvent {
  newSelection: BpmnElement[]
  oldSelection: BpmnElement[]
}

export interface ElementChangedEvent {
  element: BpmnElement
}

export interface EventBus {
  on(event: 'selection.changed', callback: (event: SelectionChangedEvent) => void): void
  on(event: 'element.changed', callback: (event: ElementChangedEvent) => void): void
  on(event: string, callback: (event: unknown) => void): void
}

/** 可以按名字从 modeler 上取到的服务 */
export interface ServiceMap {
  canvas: Canvas
  modeling: Modeling
  selection: Selection
  commandStack: CommandStack
  eventBus: EventBus
  moddle: Moddle
}
