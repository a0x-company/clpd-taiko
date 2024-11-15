import { Request, Response } from "express";
import { VaultContext } from "./routes";

export function getVaultTestDataHandler(ctx: VaultContext) {
  return async (req: Request, res: Response) => {
    try {
      const bank_balance = await ctx.storageService.getCurrentBalance();
      if (!bank_balance) {
        throw new Error("No balance found");
      }
      const balances = [
        {
          chain_id: 84532, // Base Sepolia
          total_supply: "1000000000000000000000"
        },
        {
          chain_id: 23295, // Testnet Sapphire
          total_supply: "1000000000000000000000"
        }
      ];

      res.status(200).json({
        bank_balance,
        balances
      });
      
      console.log(`📊 Test data enviado - Bank Balance: ${bank_balance}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`❌ Error en test endpoint: ${error.message}`);
        res.status(500).json({ error: error.message });
      } else {
        console.error("❌ Error desconocido en test endpoint");
        res.status(500).json({ error: "Un error desconocido ha ocurrido" });
      }
    }
  };
}