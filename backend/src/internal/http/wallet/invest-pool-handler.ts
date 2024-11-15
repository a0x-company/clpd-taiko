import { Request, Response } from "express";
import { WalletContext } from "./routes";

export function investPoolHandler(ctx: WalletContext) {
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

      let transactionHash;
      if (tokenInSymbol === "USDC") {
        transactionHash = await ctx.walletService.investUSDC(user, amountIn);
      } else if (tokenInSymbol === "CLPD") {
        transactionHash = await ctx.walletService.investCLPD(user, amountIn);
      } else {
        return res.status(400).json({ 
          error: "Invalid token symbol. Must be USDC or CLPD" 
        });
      }

      return res.status(200).json({ 
        message: `${tokenInSymbol} invested successfully`,
        transactionHash 
      });
    } catch (error) {
      console.error("Error investing:", error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : "Internal server error" 
      });
    }
  };
}