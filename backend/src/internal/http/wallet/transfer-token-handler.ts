import { Request, Response } from "express";
import { WalletContext } from "./routes";
import { Contact } from "@internal/users/types";

interface TransferRequest {
  address?: string;
  contactName?: string;
  tokenSymbol: string;
  withdrawAmount: string;
}

async function resolveDestinationAddress(
  ctx: WalletContext,
  userId: string,
  request: TransferRequest
): Promise<{ address: string; recipientName?: string } | { error: string }> {
  const { address, contactName } = request;

  if (contactName) {
    const contacts = await ctx.userService.getContacts(userId);
    const contact = contacts.find((c: Contact) => 
      c.name.toLowerCase() === contactName.toLowerCase()
    );

    if (!contact) {
      return { error: `Contact not found with name "${contactName}"` };
    }
    console.log("contact", contact);
    const destinationUser = await ctx.userService.getUser({ phoneNumber: contact.phoneNumber });
    console.log("destinationUser", destinationUser);
    if (!destinationUser?.address) {
      return { error: "Destination user not found or has no wallet address" };
    }

    return { address: destinationUser.address, recipientName: contact.name };
  }

  if (!address) {
    return { error: "An address or contact name is required for transfer" };
  }

  return { address };
}

export function transferTokenHandler(ctx: WalletContext) {
  return async (req: Request, res: Response) => {
    try {
      const user = res.locals.user;
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { tokenSymbol, withdrawAmount } = req.body;
      if (!tokenSymbol || !withdrawAmount) {
        return res.status(400).json({ 
          error: "tokenSymbol and withdrawAmount are required" 
        });
      }

      const destinationResult = await resolveDestinationAddress(ctx, user.id, req.body);
      if ('error' in destinationResult) {
        return res.status(400).json({ error: destinationResult.error });
      }

      const transactionHash = await ctx.walletService.transferToken(
        user,
        destinationResult.address,
        tokenSymbol,
        withdrawAmount
      );

      return res.status(200).json({ 
        message: destinationResult.recipientName 
          ? `Token successfully transferred to ${destinationResult.recipientName}`
          : "Token successfully transferred",
        transactionHash 
      });
    } catch (error) {
      console.error("Error transferring token:", error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : "Internal server error" 
      });
    }
  };
}