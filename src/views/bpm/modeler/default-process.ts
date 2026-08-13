type DefaultProcessLabels = {
  processName: string
  startName: string
  approvalName: string
  endName: string
}

export function createDefaultProcessXml(labels: DefaultProcessLabels) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  xmlns:flowable="http://flowable.org/bpmn"
  id="Definitions_leave_approval"
  targetNamespace="http://xd11cc.cn/bpmn">
  <bpmn2:process id="leaveApproval" name="${labels.processName}" isExecutable="true">
    <bpmn2:startEvent id="StartEvent_apply" name="${labels.startName}">
      <bpmn2:outgoing>Flow_apply_to_approve</bpmn2:outgoing>
    </bpmn2:startEvent>
    <bpmn2:userTask id="Activity_managerApprove" name="${labels.approvalName}" flowable:candidateGroups="dept_manager">
      <bpmn2:incoming>Flow_apply_to_approve</bpmn2:incoming>
      <bpmn2:outgoing>Flow_approve_to_end</bpmn2:outgoing>
    </bpmn2:userTask>
    <bpmn2:endEvent id="EndEvent_done" name="${labels.endName}">
      <bpmn2:incoming>Flow_approve_to_end</bpmn2:incoming>
    </bpmn2:endEvent>
    <bpmn2:sequenceFlow id="Flow_apply_to_approve" sourceRef="StartEvent_apply" targetRef="Activity_managerApprove" />
    <bpmn2:sequenceFlow id="Flow_approve_to_end" sourceRef="Activity_managerApprove" targetRef="EndEvent_done" />
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_leaveApproval">
    <bpmndi:BPMNPlane id="BPMNPlane_leaveApproval" bpmnElement="leaveApproval">
      <bpmndi:BPMNShape id="Shape_StartEvent_apply" bpmnElement="StartEvent_apply">
        <dc:Bounds x="180" y="222" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="166" y="265" width="64" height="20" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_Activity_managerApprove" bpmnElement="Activity_managerApprove">
        <dc:Bounds x="310" y="200" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_EndEvent_done" bpmnElement="EndEvent_done">
        <dc:Bounds x="524" y="222" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="510" y="265" width="64" height="20" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Edge_Flow_apply_to_approve" bpmnElement="Flow_apply_to_approve">
        <di:waypoint x="216" y="240" /><di:waypoint x="310" y="240" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_Flow_approve_to_end" bpmnElement="Flow_approve_to_end">
        <di:waypoint x="430" y="240" /><di:waypoint x="524" y="240" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`
}
