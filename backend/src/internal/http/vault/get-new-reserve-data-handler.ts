import { Request, Response } from "express";
import { VaultContext } from "./routes";
import { MultichainService } from '@internal/reserves/multichain';

export function getNewReserveDataHandler(ctx: VaultContext) {
  return async (req: Request, res: Response) => {
    try {
      const multichainService = new MultichainService();
      
      const data = await multichainService.getAllRecentData();

      res.status(200).json({ data });
      console.log("📊 Datos de reservas enviados exitosamente.");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`❌ Error en el nuevo endpoint: ${error.message}`);
        res.status(500).json({ error: error.message });
      } else {
        console.error("❌ Error desconocido en el nuevo endpoint.");
        res.status(500).json({ error: "Ocurrió un error desconocido." });
      }
    }
  };
}