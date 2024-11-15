import { Request, Response } from "express";
import { WalletContext } from "./routes";

export function getPositionsHandler(ctx: WalletContext) {
  return async (req: Request, res: Response) => {
    try {
      const user = res.locals.user;
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const positions = await ctx.walletService.getPositions(user);

      return res.status(200).json({ positions });
    } catch (error) {
      console.error("Error getting positions:", error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : "Internal server error" 
      });
    }
  };
}