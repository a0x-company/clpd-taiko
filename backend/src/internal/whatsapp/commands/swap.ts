import { WalletOperationType } from "@internal/wallet";
import { BaseCommand } from "./base";
import { CommandResult, MessageContext } from "./types";

export class SwapCommand extends BaseCommand {
    constructor() {
      super([
        /(?:cambiar?|swap|exchange)\s+(\d+(?:\.\d+)?)\s+(CLPD|USDC)(?:\s+(?:a|por|to|for)\s+(CLPD|USDC))?/i,
        /(?:convertir)\s+(\d+(?:\.\d+)?)\s+(CLPD|USDC)(?:\s+(?:a|en)\s+(CLPD|USDC))?/i,
        /^s\s+(\d+(?:\.\d+)?)\s+(CLPD|USDC)$/i 
      ]);
    }
  
    async execute(context: MessageContext): Promise<CommandResult> {
      const match = this.patterns.find(p => p.test(context.message))?.exec(context.message);
      if (!match) {
        return {
          success: false,
          message: "Formato inválido para swap. Ejemplo: 'swap 100 CLPD' o 'cambiar 50 USDC'"
        };
      }
  
      const amount = parseFloat(match[1]);
      const tokenIn = match[2].toUpperCase();
      const tokenOut = match[3]?.toUpperCase() || (tokenIn === 'CLPD' ? 'USDC' : 'CLPD');
  
      if (!this.validateAmount(amount)) {
        return {
          success: false,
          message: this.formatError('amount')
        };
      }
  
      if (!this.validateToken(tokenIn) || !this.validateToken(tokenOut)) {
        return {
          success: false,
          message: this.formatError('token')
        };
      }
  
      return {
        success: true,
        message: `Swap iniciado: ${amount} ${tokenIn} por ${tokenOut}`,
        operation: {
          type: WalletOperationType.SWAP,
          params: {
            amount,
            tokenInSymbol: tokenIn
          }
        }
      };
    }
  }