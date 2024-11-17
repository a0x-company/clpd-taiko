import { Request, Response } from "express";
import { WalletContext } from "./routes";

export function bridgeTokenHandler(ctx: WalletContext) {
  return async (req: Request, res: Response) => {
    console.log("🚀 Bridge token request received.");

    try {
      const { amount, sourceChain, targetChain } = req.body;

      if (!amount || !sourceChain || !targetChain) {
        console.error("❌ Missing required parameters: amount, sourceChain, targetChain.");
        return res.status(400).json({ error: "Missing required parameters: amount, sourceChain, targetChain." });
      }

      const user = res.locals.user;

      if (!user) {
        console.error("❌ User information is missing.");
        return res.status(400).json({ error: "User information is missing." });
      }

      console.log(`🌉 Initiating bridge of ${amount} CLPD from ${sourceChain} to ${targetChain} for user ${user.address}.`);

      const txHash = await ctx.walletService.bridgeToken(user, amount, sourceChain, targetChain);
      console.log(`✅ Bridge executed successfully with hash: ${txHash}`);

      res.status(200).json({ success: true, hash: txHash });
    } catch (error: any) {
      console.error("❌ Error processing bridge token request:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  };
}