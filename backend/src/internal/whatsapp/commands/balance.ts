import { WalletOperationType } from "@internal/wallet";
import { BaseCommand } from "./base";
import { CommandResult, MessageContext } from "./types";

export class BalanceCommand extends BaseCommand {
    constructor() {
      super([
        /(?:balance|saldo|cuanto tengo|how much|check)/i,
        /(?:ver|show|display)\s+(?:mi|my)?\s*(?:balance|saldo)/i,
        /^(?:bal|b)$/i
      ]);
    }
  
    async execute(context: MessageContext): Promise<CommandResult> {
      return {
        success: true,
        message: "Consultando tu balance...",
        operation: {
          type: WalletOperationType.CHECK_BALANCE,
          params: {}
        }
      };
    }
  }