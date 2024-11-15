import { WalletOperationType } from "@internal/wallet";
import { BaseCommand } from "./base";
import { CommandResult, MessageContext } from "./types";

export class InvestCommand extends BaseCommand {
    constructor() {
      super([
        /(?:invertir?|invest|add)\s+(\d+(?:\.\d+)?)\s+(CLPD|USDC)(?:\s+(?:en|to|in)\s+pool)?/i,
        /(?:aportar?|deposit)\s+(\d+(?:\.\d+)?)\s+(CLPD|USDC)(?:\s+(?:en|al)\s+pool)?/i,
        /^i\s+(\d+(?:\.\d+)?)\s+(CLPD|USDC)$/i
      ]);
    }
  
    async execute(context: MessageContext): Promise<CommandResult> {
      const match = this.patterns.find(p => p.test(context.message))?.exec(context.message);
      if (!match) {
        return {
          success: false,
          message: "Formato inválido para inversión. Ejemplo: 'invertir 100 CLPD' o 'aportar 50 USDC'"
        };
      }
  
      const amount = parseFloat(match[1]);
      const token = match[2].toUpperCase();
  
      if (!this.validateAmount(amount)) {
        return {
          success: false,
          message: this.formatError('amount')
        };
      }
  
      if (!this.validateToken(token)) {
        return {
          success: false,
          message: this.formatError('token')
        };
      }
  
      return {
        success: true,
        message: `Inversión iniciada: ${amount} ${token} en el pool`,
        operation: {
          type: WalletOperationType.INVEST,
          params: {
            amount,
            tokenSymbol: token
          }
        }
      };
    }
}
