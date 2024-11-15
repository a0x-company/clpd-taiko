export interface QueueMessage {
  id: string;
  docId?: string;
  phoneNumber: string;
  message: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  timestamp: number;
  attempts: number;
  processedAt?: number;
  scheduledForDeletion?: number;
  error?: string;
}