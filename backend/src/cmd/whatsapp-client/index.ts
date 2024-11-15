import "module-alias/register";
import express from "express";
import { WhatsappStorage } from "@internal/whatsapp/storage";
import { MessageQueue } from "@internal/whatsapp/queue";
import { WhatsappService, WhatsappNotificationType } from "@internal/whatsapp/service";
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import { DiscordNotificationService, NotificationType } from "@internal/notifications/discord";
import { Storage } from "@google-cloud/storage";
import { Firestore } from "@google-cloud/firestore";
import { UserDataStorage, UserService } from "@internal/users";
import { http } from "@internal";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

const port = process.env.PORT || 8080;
const sessionBucketName = "whatsapp-session-mistokens";
const qrBucketName = "whatsapp-qr-codes";

const whatsappStorage = new WhatsappStorage(sessionBucketName, process.env.PROJECT_ID || "");
const whatsappService = new WhatsappService();
const discordNotificationService = new DiscordNotificationService();

const storage = new Storage({
  projectId: process.env.PROJECT_ID,
});

const firestore = new Firestore({
  projectId: process.env.PROJECT_ID,
  databaseId: process.env.DATABASE_ENV
});

const userService = new UserService(new UserDataStorage(firestore));
const messageQueue = new MessageQueue(firestore);

let sock: WASocket;
let isReconnecting = false;
let isFullyConnected = false;

const init = async () => {
  try {
    await whatsappStorage.initialize();
    sock = await startWhatsAppService();

    const server = app.listen(port, () => {
      console.log(`🚀 Servidor de API de WhatsApp escuchando en el puerto ${port}`);
    });

    setupGracefulShutdown(server);
  } catch (error) {
    console.error("❌ Error en la inicialización:", error);
    process.exit(1);
  }
};

const startWhatsAppService = async (): Promise<WASocket> => {
  if (isReconnecting) {
    console.log("🔄 Ya hay un intento de reconexión en curso");
    throw new Error("Reconnecting in progress");
  }

  try {
    isReconnecting = true;
    isFullyConnected = false;
    const { state, saveCreds } = await whatsappStorage.useMultiFileAuthState();

    console.log("🔄 Estado cargado");
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`📱 Usando WA v${version.join(".")}, ¿Es la última versión?: ${isLatest}`);

    const socket = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      qrTimeout: 40000,
      browser: ['MisTokens', 'Chrome', '1.0.0'],
      connectTimeoutMs: 60_000,
      keepAliveIntervalMs: 25_000,
      markOnlineOnConnect: true,
      retryRequestDelayMs: 2000,
      defaultQueryTimeoutMs: 60_000,
      emitOwnEvents: true,
    });

    socket.ev.on("creds.update", async () => {
      console.log("🔐 Actualizando credenciales");
      await saveCreds();
    });

    socket.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const qrBuffer = await QRCode.toBuffer(qr);
          const fileName = `whatsapp_qr_${Date.now()}.png`;
          const file = storage.bucket(qrBucketName).file(fileName);
          await file.save(qrBuffer, {
            metadata: { contentType: "image/png" },
          });
          const publicUrl = `https://storage.googleapis.com/${qrBucketName}/${fileName}`;
          await discordNotificationService.sendNotification(
            "Scan this QR code to log in to WhatsApp",
            NotificationType.INFO,
            "New WhatsApp QR Code",
            publicUrl
          );
        } catch (error) {
          console.error("❌ Error con código QR:", error);
        }
      }

      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        
        if (statusCode === DisconnectReason.loggedOut) {
          console.log("🔄 Sesión cerrada, limpiando datos...");
          await whatsappStorage.clearSession();
          await discordNotificationService.sendNotification(
            "WhatsApp session has been logged out. Please scan new QR code.",
            NotificationType.WARNING,
            "WhatsApp Session Ended"
          );
        }

        if (shouldReconnect) {
          console.log("🔄 Intentando reconectar...");
          setTimeout(() => {
            isReconnecting = false;
            startWhatsAppService().catch(err => console.error("❌ Error al reconectar:", err));
          }, 5000);
        }
      } else if (connection === "open") {
        console.log("🟢 Conexión abierta");
        isReconnecting = false;
        
        // Esperar 15 segundos adicionales para la sincronización
        console.log("⏳ Esperando sincronización de claves (15s)...");
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        // Configurar el socket y marcar como listo
        whatsappService.setSock(socket);
        isFullyConnected = true;
        console.log("✅ Cliente WhatsApp listo para procesar mensajes");
        
        await discordNotificationService.sendNotification(
          "WhatsApp connection established and ready for messages.",
          NotificationType.SUCCESS,
          "WhatsApp Connected"
        );
      }
    });

    socket.ev.on("messages.upsert", async (m) => {
      if (!isFullyConnected) {
        console.log("⏳ Mensaje recibido pero el cliente aún no está listo");
        return;
      }

      if (m.type === 'notify') {
        for (const msg of m.messages) {
          if (!msg.key.fromMe && msg.message) {
            const phoneNumber = msg.key.remoteJid?.replace('@s.whatsapp.net', '');
            const messageText = msg.message.conversation || 
                              msg.message.extendedTextMessage?.text || '';

            if (phoneNumber && messageText) {
              try {
                const user = await userService.getUser({ phoneNumber });
                
                if (user) {
                  await messageQueue.enqueueMessage(phoneNumber, messageText);
                } else {
                  await whatsappService.sendNotification(
                    phoneNumber,
                    WhatsappNotificationType.ERROR,
                    { message: 'Necesitas registrarte para usar este servicio.' }
                  );
                }
              } catch (error) {
                console.error('Error procesando mensaje:', error);
                await whatsappService.sendNotification(
                  phoneNumber,
                  WhatsappNotificationType.ERROR,
                  { message: 'Error procesando mensaje. Intenta nuevamente.' }
                );
              }
            }
          }
        }
      }
    });

    return socket;

  } catch (error) {
    console.error("❌ Error iniciando el servicio de WhatsApp:", error);
    isReconnecting = false;
    setTimeout(() => {
      startWhatsAppService().catch(err => console.error("❌ Error al reconectar:", err));
    }, 10000);
    throw error;
  }
};

const setupGracefulShutdown = (serverInstance: any) => {
  const gracefulShutdown = async () => {
    console.log('📥 Iniciando proceso de cierre...');
    
    if (sock) {
      try {
        await sock.logout();
        console.log('🔒 Logout exitoso.');
      } catch (logoutError) {
        console.error('❌ Error durante el logout:', logoutError);
      }

      try {
        await sock.end(new Error('Server shutdown'));
        console.log('🛑 Conexión cerrada.');
      } catch (endError) {
        console.error('❌ Error al cerrar la conexión:', endError);
      }
    }

    try {
      await whatsappStorage.saveState();
      console.log('💾 Estado final guardado correctamente.');
    } catch (saveError) {
      console.error('❌ Error al guardar el estado final:', saveError);
    }
    
    serverInstance.close(() => {
      console.log('👋 Servidor cerrado correctamente');
      process.exit(0);
    });
  };

  ['SIGTERM', 'SIGINT'].forEach(signal => {
    process.on(signal, () => {
      console.log(`🛑 Recibida señal ${signal}`);
      gracefulShutdown();
    });
  });
};

http.setupWhatsappRoutes(app, whatsappService);

init();