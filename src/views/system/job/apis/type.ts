export interface SystemJobQueryVO {
  jobName?: string
  jobGroup?: string
  status?: string
}

export interface SystemJobVO {
  id?: number
  jobName?: string
  jobGroup?: string
  invokeTarget?: string
  cronExpression?: string
  executionPolicy?: string
  concurrent?: string
  status?: string
  remark?: string
  createTime?: string
}

export interface SystemJobAddVO {
  jobName: string
  jobGroup: string
  invokeTarget: string
  cronExpression: string
  executionPolicy?: string
  concurrent?: string
  status?: string
  remark?: string
}

export interface SystemJobUpdateVO {
  id: number
  jobName: string
  jobGroup: string
  invokeTarget: string
  cronExpression: string
  executionPolicy?: string
  concurrent?: string
  status?: string
  remark?: string
}

export interface SystemJobLogQueryVO {
  jobName?: string
  jobGroup?: string
  status?: string
}

export interface SystemJobLogVO {
  id?: number
  jobId?: number
  jobName?: string
  jobGroup?: string
  invokeTarget?: string
  jobMessage?: string
  status?: string
  remark?: string
  createTime?: string
}
