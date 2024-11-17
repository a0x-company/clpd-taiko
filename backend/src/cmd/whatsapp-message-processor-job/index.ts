import 'module-alias/register';
import { Firestore } from '@google-cloud/firestore';
import { MessageQueue } from '@internal/whatsapp/queue';
import { MessageProcessor } from '@internal/whatsapp/processor/messages';
import { WhatsappService } from '@internal/whatsapp/service';
import { WalletService } from '@internal/wallet/service';
import { UserService, UserDataStorage } from '@internal/users';
import { config } from '@internal';
import axios from 'axios';
import { CHAIN_CONFIGS } from '@internal/wallet/config';

if (!config.PROJECT_ID || !config.RPC_URL) {
  throw new Error("❌ Required environment variables are missing");
}
const WHATSAPP_API_URL = "https://whatsapp-whatsapp-client-claucondor-61523929174.us-central1.run.app";

const firestore = new Firestore({
  projectId: config.PROJECT_ID,
  databaseId: config.DATABASE_ENV
});

const walletService = new WalletService(CHAIN_CONFIGS);
const whatsappService = new WhatsappService(false);
const userService = new UserService(new UserDataStorage(firestore));
const messageQueue = new MessageQueue(firestore);
const messageProcessor = new MessageProcessor(
  walletService,
  whatsappService,
  userService
);

async function checkWhatsAppHealth(): Promise<boolean> {
  try {
    console.log('🔍 Verificando estado de WhatsApp...');
    const response = await axios.get(`${WHATSAPP_API_URL}/ws/health`);
    return response.data.status === 'connected';
  } catch (error) {
    console.error('❌ Error verificando estado de WhatsApp:', error);
    return false;
  }
}

async function main(): Promise<void> {
  console.log("🚀 Starting message processing job...");
  console.log("📋 Initializing services and checking queue...");

  try {
    const isWhatsAppReady = await checkWhatsAppHealth();
    if (!isWhatsAppReady) {
      throw new Error("❌ WhatsApp service no está disponible");
    }
    console.log("✅ WhatsApp service está listo");
  } catch (error) {
    console.error("❌ Error al verificar el estado de WhatsApp:", error);
    process.exit(1);
  }

  try {
    let processedCount = 0;
    const startTime = Date.now();

    while (true) {
      // Verificar tiempo máximo de ejecución (4 minutos)
      if (Date.now() - startTime > 4 * 60 * 1000) {
        console.log('⏱️ Maximum execution time reached (4 minutes)');
        console.log('💤 Stopping gracefully to prevent timeout');
        break;
      }

      console.log('🔍 Checking for pending messages...');
      const message = await messageQueue.getNextPendingMessage();
      
      if (!message) {
        console.log('📭 Queue is empty - No messages pending to process');
        console.log('🌟 Job completed successfully with no pending messages');
        break;
      }

      try {
        console.log(`📨 Processing message ${message.id} from ${message.phoneNumber}`);
        console.log(`⚙️ Updating message status to PROCESSING`);
        await messageQueue.updateMessageStatus(message.id, 'PROCESSING');

        console.log(`🔄 Processing message content...`);
        await messageProcessor.processMessage(
          message.message,
          message.phoneNumber
        );

        console.log(`✅ Message ${message.id} processed successfully`);
        await messageQueue.updateMessageStatus(message.id, 'COMPLETED');
        processedCount++;
        console.log(`📊 Total messages processed so far: ${processedCount}`);

      } catch (error: any) {
        console.error(`❌ Error processing message ${message.id}:`, error);
        console.log(`⚠️ Marking message as FAILED`);
        await messageQueue.updateMessageStatus(
          message.id, 
          'FAILED',
          error.message
        );
      }
    }

    console.log(`🧹 Starting cleanup of old messages...`);
    await messageQueue.cleanupOldMessages();
    console.log(`🎉 Job finished successfully! Total processed: ${processedCount} messages`);

  } catch (error) {
    console.error("❌ Fatal error in message processing job:", error);
    console.log("🚨 Terminating process due to unrecoverable error");
    process.exit(1);
  }
}

main();