import { Request, Response } from "express";
import { WhatsappService, WhatsappNotificationType } from "@internal/whatsapp/service";

interface SendMessageRequest {
  phoneNumber: string;
  type: keyof typeof WhatsappNotificationType;
  data: any;
  imageUrl?: string;  // Nueva propiedad opcional
}

function validateSendMessageRequest(req: Request): SendMessageRequest | { error: string } {
  const { phoneNumber, type, data, imageUrl } = req.body;

  if (!phoneNumber || !type || !data) {
    return { error: "phoneNumber, type, and data are required" };
  }

  if (!Object.keys(WhatsappNotificationType).includes(type)) {
    return { error: `Invalid notification type: ${type}` };
  }

  // Si es BURN_COMPLETED, validamos que tenga imageUrl
  if (type === 'BURN_COMPLETED' && !imageUrl) {
    return { error: "imageUrl is required for BURN_COMPLETED notifications" };
  }

  return { phoneNumber, type, data, imageUrl };
}

export function sendMessageHandler(whatsappService: WhatsappService) {
  return async (req: Request, res: Response) => {
    try {
      const validationResult = validateSendMessageRequest(req);

      if ('error' in validationResult) {
        return res.status(400).json({ error: validationResult.error });
      }

      const { phoneNumber, type, data, imageUrl } = validationResult;
      const notificationType = WhatsappNotificationType[type];

      // Si hay imageUrl, la agregamos a data
      if (imageUrl) {
        data.depositProof = imageUrl;
      }

      await whatsappService.sendNotification(phoneNumber, notificationType, data);
      console.log(`📤 Message sent successfully to ${phoneNumber}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      res.status(500).json({ error: error.message });
    }
  };
}