import { Request, Response } from "express";
import { WhatsappService } from "@internal/whatsapp/service";

async function waitForConnection(
  whatsappService: WhatsappService, 
  maxRetries = 3,
  timeout = 5000
): Promise<boolean> {
  const startTime = Date.now();
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      if (whatsappService.sock) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
      }
      
      if (Date.now() - startTime > timeout) {
        console.log('⏱️ Timeout alcanzado, reintentando...');
        retries++;
        continue;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Error en intento ${retries + 1}:`, error);
      retries++;
    }
  }
  
  return false;
}

export function healthCheckHandler(whatsappService: WhatsappService) {
  return async (req: Request, res: Response) => {
    try {
      const isConnected = await waitForConnection(whatsappService);
      return res.json({ 
        status: isConnected ? 'connected' : 'timeout',
        retries: isConnected ? undefined : 3
      });
    } catch (error: any) {
      console.error('❌ Error en health check:', error);
      res.status(500).json({ error: error.message });
    }
  };
}