import { Request, Response } from "express";
import { WalletContext } from "./routes";

export function swapTokenHandler(ctx: WalletContext) {
  return async (req: Request, res: Response) => {
    try {
      const user = res.locals.user;
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { tokenInSymbol, amountIn } = req.body;

      if (!tokenInSymbol || !amountIn) {
        return res.status(400).json({ 
          error: "tokenInSymbol and amountIn are required" 
        });
      }

      const transactionHash = await ctx.walletService.swapToken(
        user,
        tokenInSymbol,
        amountIn
      );

      return res.status(200).json({ 
        message: "Token swapped successfully",
        transactionHash 
      });
    } catch (error) {
      console.error("Error swapping token:", error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : "Internal server error" 
      });
    }
  };
}