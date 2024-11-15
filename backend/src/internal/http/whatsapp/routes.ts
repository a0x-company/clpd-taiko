import { Express, Router } from "express";
import { WhatsappService } from "@internal/whatsapp/service";
import { sendMessageHandler } from "./send-message-handler";
import { healthCheckHandler } from "./health-check-handler";

export function setupWhatsappRoutes(
  app: Express,
  whatsappService: WhatsappService
) {
  const whatsappRouter = Router();

  whatsappRouter.post("/send-message", sendMessageHandler(whatsappService));
  whatsappRouter.get("/health", healthCheckHandler(whatsappService));

  app.use("/ws", whatsappRouter);
  console.log("🛣️ WhatsApp routes set up");
}