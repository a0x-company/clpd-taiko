// src/internal/whatsapp/queue/MessageQueue.ts
import { Firestore, FieldValue } from "@google-cloud/firestore";
import { v4 as uuidv4 } from 'uuid';
import { QueueMessage } from "./types";

export class MessageQueue {
  private readonly collection: FirebaseFirestore.CollectionReference;
  private readonly RETENTION_PERIOD = 7 * 24 * 60 * 60 * 1000;
  private readonly MAX_ATTEMPTS = 3;

  constructor(private readonly firestore: Firestore) {
    this.collection = firestore.collection('whatsapp_messages');
  }

  async enqueueMessage(phoneNumber: string, message: string): Promise<void> {
    try {
      const messageData: QueueMessage = {
        id: uuidv4(), 
        phoneNumber,
        message,
        status: 'PENDING',
        timestamp: Date.now(),
        attempts: 0
      };
  
      await this.collection.doc(messageData.id).set(messageData);
      console.log(`📥 Message enqueued for ${phoneNumber}`);
    } catch (error) {
      console.error('Error enqueueing message:', error);
      throw error;
    }
  }

  async getNextPendingMessage(): Promise<QueueMessage | null> {
    try {
      let query = this.collection
        .where('status', '==', 'PENDING')
        .where('attempts', '<', this.MAX_ATTEMPTS)
        .orderBy('attempts')
        .orderBy('timestamp')
        .limit(1);

      let snapshot = await query.get();

      if (snapshot.empty) {
        query = this.collection
          .where('status', '==', 'FAILED')
          .where('attempts', '<', this.MAX_ATTEMPTS)
          .orderBy('attempts')
          .orderBy('timestamp')
          .limit(1);

        snapshot = await query.get();
      }

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return { ...doc.data() as QueueMessage, docId: doc.id };
    } catch (error) {
      console.error('Error getting next message:', error);
      throw error;
    }
  }

  async updateMessageStatus(
    messageId: string,
    status: QueueMessage['status'],
    error?: string
  ): Promise<void> {
    try {
      const doc = await this.collection.doc(messageId).get();
      if (!doc.exists) {
        throw new Error(`Message with ID ${messageId} not found`);
      }
  
      const updateData: Partial<QueueMessage> = {
        status,
        attempts: FieldValue.increment(1) as any,
      };

      // Solo agregar processedAt si el status es COMPLETED o FAILED
      if (status === 'COMPLETED' || status === 'FAILED') {
        updateData.processedAt = Date.now();
      }

      // Agregar scheduledForDeletion si es COMPLETED
      if (status === 'COMPLETED') {
        updateData.scheduledForDeletion = Date.now() + this.RETENTION_PERIOD;
      }

      // Agregar error si es FAILED
      if (status === 'FAILED' && error) {
        updateData.error = error;
      }
  
      await this.collection.doc(messageId).update(updateData);
      console.log(`📝 Message ${messageId} status updated to ${status}${error ? ` with error: ${error}` : ''}`);
    } catch (error) {
      console.error('Error updating message status:', error);
      throw error;
    }
  }

  async cleanupOldMessages(): Promise<void> {
    try {
      const now = Date.now();
      const snapshot = await this.collection
        .where('scheduledForDeletion', '<=', now)
        .limit(100)
        .get();

      if (snapshot.empty) return;

      const batch = this.firestore.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`🧹 Cleaned up ${snapshot.size} old messages`);

      if (snapshot.size === 100) {
        await this.cleanupOldMessages();
      }
    } catch (error) {
      console.error('Error cleaning up old messages:', error);
    }
  }

  async getMessageById(messageId: string): Promise<QueueMessage | null> {
    try {
      const doc = await this.collection.doc(messageId).get();
      if (!doc.exists) return null;
      return { ...doc.data() as QueueMessage, docId: doc.id };
    } catch (error) {
      console.error('Error getting message by ID:', error);
      throw error;
    }
  }

  async getMessagesByStatus(status: QueueMessage['status']): Promise<QueueMessage[]> {
    try {
      const snapshot = await this.collection
        .where('status', '==', status)
        .orderBy('timestamp', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        ...doc.data() as QueueMessage,
        docId: doc.id
      }));
    } catch (error) {
      console.error('Error getting messages by status:', error);
      throw error;
    }
  }

  async getMessagesByPhoneNumber(phoneNumber: string): Promise<QueueMessage[]> {
    try {
      const snapshot = await this.collection
        .where('phoneNumber', '==', phoneNumber)
        .orderBy('timestamp', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        ...doc.data() as QueueMessage,
        docId: doc.id
      }));
    } catch (error) {
      console.error('Error getting messages by phone number:', error);
      throw error;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await this.collection.doc(messageId).delete();
      console.log(`🗑️ Message ${messageId} deleted`);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    try {
      const stats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
      };

      const promises = Object.keys(stats).map(async (status) => {
        const snapshot = await this.collection
          .where('status', '==', status.toUpperCase())
          .count()
          .get();
        stats[status as keyof typeof stats] = snapshot.data().count;
      });

      await Promise.all(promises);
      return stats;
    } catch (error) {
      console.error('Error getting queue stats:', error);
      throw error;
    }
  }
}