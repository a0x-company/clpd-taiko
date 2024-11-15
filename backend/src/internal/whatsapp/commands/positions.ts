import { WalletOperationType } from "@internal/wallet";
import { BaseCommand } from "./base";
import { CommandResult, MessageContext } from "./types";

export class PositionsCommand extends BaseCommand {
    constructor() {
      super([
        /(?:posiciones|positions|pool positions|liquidity)/i,
        /(?:ver|show|display)\s+(?:mis|my)?\s*(?:posiciones|positions)/i,
        /(?:pool|lp)\s+(?:balance|status)/i,
        /^pos$/i
      ]);
    }
  
    async execute(context: MessageContext): Promise<CommandResult> {
      return {
        success: true,
        message: "Consultando tus posiciones en el pool...",
        operation: {
          type: WalletOperationType.CHECK_POSITIONS,
          params: {}
        }
      };
    }
  }