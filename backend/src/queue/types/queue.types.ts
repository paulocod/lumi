import { JobId } from 'bull';

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

export interface JobStatus {
  id: JobId;
  state: string;
  progress: number;
  data: any;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
}
