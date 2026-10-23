type EmptyProcessOptions = {
  processName: string
  processId?: string
}

/**
 * 为新建流程生成一个不易重复的默认流程标识。
 * 流程标识会同时写入 BPMN XML 和草稿接口，必须在页面初始化时只生成一次。
 */
export function createDefaultProcessKey() {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replaceAll('-', '').slice(0, 12)
      : Math.random().toString(36).slice(2, 14)
  return `process_${random}`
}

export function createDefaultProcessXml({
  processName,
  processId = createDefaultProcessKey(),
}: EmptyProcessOptions) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  xmlns:flowable="http://flowable.org/bpmn"
  id="Definitions_1"
  targetNamespace="http://xd11cc.cn/bpmn">
  <bpmn2:process id="${processId}" name="${processName}" isExecutable="true" />
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${processId}" />
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`
}
