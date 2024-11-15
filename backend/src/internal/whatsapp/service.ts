import axios from "axios";

export enum WhatsappNotificationType {
  NEW_DEPOSIT,
  DEPOSIT_APPROVED,
  DEPOSIT_REJECTED,
  TOKENS_MINTED,
  NEW_BURN_REQUEST,
  BURN_REQUEST_APPROVED,
  BURN_REQUEST_REJECTED,
  BURN_COMPLETED,
  CONFIRMATION,
  MESSAGE_RECEIVED,
  OPERATION_SUCCESS,
  OPERATION_ERROR,
  BALANCE_INFO,
  POSITIONS_INFO,
  HELP_MESSAGE,
  ERROR,
}

interface WhatsappNotificationConfig {
  emoji: string;
  title: string;
  requiresImage?: boolean;
}

export class WhatsappService {
  public sock: any;
  private readonly WHATSAPP_API_URL = "https://whatsapp-whatsapp-client-claucondor-61523929174.us-central1.run.app/ws/send-message";
  private readonly useDirectSocket: boolean;
  private notificationConfigs: Record<WhatsappNotificationType, WhatsappNotificationConfig> = {
    [WhatsappNotificationType.NEW_DEPOSIT]: { emoji: "💼", title: "Nuevo Depósito" },
    [WhatsappNotificationType.DEPOSIT_APPROVED]: { emoji: "✅", title: "Depósito Aprobado" },
    [WhatsappNotificationType.DEPOSIT_REJECTED]: { emoji: "❌", title: "Depósito Rechazado" },
    [WhatsappNotificationType.TOKENS_MINTED]: { emoji: "🪙", title: "Tokens Minteados" },
    [WhatsappNotificationType.NEW_BURN_REQUEST]: { emoji: "🔥", title: "Nueva Solicitud de Quema" },
    [WhatsappNotificationType.BURN_REQUEST_APPROVED]: { emoji: "✅", title: "Quema Aprobada" },
    [WhatsappNotificationType.BURN_REQUEST_REJECTED]: { emoji: "❌", title: "Quema Rechazada" },
    [WhatsappNotificationType.BURN_COMPLETED]: { emoji: "💸", title: "Quema Completada" },
    [WhatsappNotificationType.CONFIRMATION]: { emoji: "🔑", title: "Confirmación" },
    [WhatsappNotificationType.MESSAGE_RECEIVED]: { emoji: "✅", title: "Mensaje Recibido" },    
    [WhatsappNotificationType.OPERATION_SUCCESS]: { emoji: "✅", title: "Operación Exitosa" },
    [WhatsappNotificationType.OPERATION_ERROR]: { emoji: "❌", title: "Error en Operación" },
    [WhatsappNotificationType.BALANCE_INFO]: { emoji: "💰", title: "Balance" },
    [WhatsappNotificationType.POSITIONS_INFO]: { emoji: "📊", title: "Posiciones" },
    [WhatsappNotificationType.HELP_MESSAGE]: { emoji: "ℹ️", title: "Ayuda" },
    [WhatsappNotificationType.ERROR]: { emoji: "⚠️", title: "Error" }
  };
  constructor(useDirectSocket: boolean = true) {
    this.useDirectSocket = useDirectSocket;
  }

  setSock(sock: any) {
    this.sock = sock;
  }

  async sendNotification(to: string, type: WhatsappNotificationType, data: Record<string, any>): Promise<void> {
    try {
      const config = this.notificationConfigs[type];
      const formattedMessage = `${config.emoji} *${config.title}*\n\n${this.formatMessage(type, data)}`;

      console.log(`Configuración del mensaje:`, config);
      console.log(`Mensaje formateado:`, formattedMessage);

      if (this.useDirectSocket) {
        if (!this.sock) {
          throw new Error('WhatsApp socket no inicializado');
        }
        const jid = to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`;
        console.log(`JID utilizado:`, jid);
        
        // Enviar mensaje y loguear la respuesta
        const response = await this.sock.sendMessage(jid, { text: formattedMessage });
        console.log(`Respuesta del socket:`, response);
        
      } else {
        const payload = {
          phoneNumber: to,
          type: WhatsappNotificationType[type],
          data: {
            ...data,
            formattedMessage
          }
        };
        console.log(`Payload enviado por HTTP:`, payload);
        const response = await axios.post(this.WHATSAPP_API_URL, payload);
        console.log(`Respuesta del HTTP:`, response.data);
      }

      console.log(`📱 WhatsApp notification sent to ${to} using ${this.useDirectSocket ? 'socket' : 'HTTP'}`);
    } catch (error: any) {
      console.error('Error sending WhatsApp notification:', error);
      throw new Error(`Failed to send WhatsApp notification: ${error.message}`);
    }
  }

  private formatMessage(type: WhatsappNotificationType, data: Record<string, any>): string {
    switch (type) {
      case WhatsappNotificationType.NEW_DEPOSIT:
        return `Solicitud de deposito recibida por $${data.amount} CLP\nID: ${data.depositId}\nEsperando comprobante...`;
      case WhatsappNotificationType.DEPOSIT_APPROVED:
        return `Depósito aprobado: $${data.amount}\nID: ${data.depositId}\nTokens a mintear: ${data.amount}`;
      case WhatsappNotificationType.DEPOSIT_REJECTED:
        return `Depósito rechazado: $${data.amount}\nID: ${data.depositId}\nMotivo: ${data.reason}`;
      case WhatsappNotificationType.TOKENS_MINTED:
        return `${data.amount} tokens minteados\nID Depósito: ${data.depositId}\nTx: ${data.transactionHash}`;
      case WhatsappNotificationType.NEW_BURN_REQUEST:
        return `Solicitud de quema: ${data.amount} tokens\nID: ${data.burnRequestId}\nEn proceso...`;
      case WhatsappNotificationType.BURN_REQUEST_APPROVED:
        return `Quema aprobada: ${data.amount} tokens\nID: ${data.burnRequestId}\nProcesando...`;
      case WhatsappNotificationType.BURN_REQUEST_REJECTED:
        return `Quema rechazada: ${data.amount} tokens\nID: ${data.burnRequestId}\nMotivo: ${data.reason}`;
      case WhatsappNotificationType.BURN_COMPLETED:
        return `Quema completada: ${data.amount} tokens\nID: ${data.burnRequestId}\nComprobante: ${data.depositProof}`;
      case WhatsappNotificationType.CONFIRMATION:
        return `Tu código de confirmación es: ${data.code}`;
      case WhatsappNotificationType.MESSAGE_RECEIVED:
        return data.message;
      case WhatsappNotificationType.OPERATION_ERROR:
        return this.humanizeError(data.message);
      case WhatsappNotificationType.OPERATION_SUCCESS:
        return data.message;
      case WhatsappNotificationType.BALANCE_INFO:
        return data.message;
      case WhatsappNotificationType.POSITIONS_INFO:
        return data.message;
      case WhatsappNotificationType.HELP_MESSAGE:
        return data.message;
      case WhatsappNotificationType.ERROR:
        return data.message;
      default:
        return "Mensaje no configurado";
    }
  }

  public humanizeError(error: string): string {
    const errorMap: Record<string, string> = {
      'Insufficient USDC balance': 'No tienes suficiente saldo en USDC.\n\nPuedes consultar tu balance actual usando el comando "balance"',
      'Insufficient CLPD balance': 'No tienes suficiente saldo en CLPD.\n\nPuedes consultar tu balance actual usando el comando "balance"',
      'execution reverted': 'La operación no pudo ser procesada.\n\nPor favor intenta con un monto diferente',
      'gas required exceeds allowance': 'No hay suficiente gas para procesar la operación.\n\nPor favor intenta más tarde',
      'nonce too low': 'Error de sincronización con la blockchain.\n\nPor favor intenta nuevamente',
      'slippage': 'El precio ha cambiado significativamente.\n\nPor favor intenta con un monto diferente',
      'price impact too high': 'El impacto en el precio es demasiado alto.\n\nPrueba con un monto menor'
    };

    // Buscar coincidencias parciales en el mapa de errores
    for (const [technical, friendly] of Object.entries(errorMap)) {
      if (error.toLowerCase().includes(technical.toLowerCase())) {
        return friendly;
      }
    }

    // Si no hay coincidencia, devolver un mensaje genérico
    return 'Ocurrió un error inesperado.\n\nPor favor intenta más tarde o escribe "ayuda" para ver los comandos disponibles';
  }
}