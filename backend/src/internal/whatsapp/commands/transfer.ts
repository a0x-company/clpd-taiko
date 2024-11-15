import { WalletOperationType } from "@internal/wallet";
import { BaseCommand } from "./base";
import { CommandResult, MessageContext } from "./types";
import { UserService } from "@internal/users";

export class TransferCommand extends BaseCommand {
    constructor(private readonly userService: UserService) {
      super([
        /(?:enviar?|transferir?|mandar?)\s+(\d+(?:\.\d+)?)\s+(CLPD|USDC)\s+(?:a|para|->)?\s*([0-9a-fA-F]{42})/i,
        /(?:send|transfer)\s+(\d+(?:\.\d+)?)\s+(CLPD|USDC)\s+(?:to)?\s*([0-9a-fA-F]{42})/i,
        /(?:enviar?|transferir?|mandar?)\s+(\d+(?:\.\d+)?)\s+(CLPD|USDC)\s+(?:a|para|->)?\s*@(.+)/i,
        /(?:send|transfer)\s+(\d+(?:\.\d+)?)\s+(CLPD|USDC)\s+(?:to)?\s*@(.+)/i,
      ]);
    }
  
    async execute(context: MessageContext): Promise<CommandResult> {
      const match = this.patterns.find(p => p.test(context.message))?.exec(context.message);
      if (!match) {
        return {
          success: false,
          message: "Formato inválido para transferencia. Ejemplos:\n" +
                  "- transferir 100 CLPD a 0x123...\n" +
                  "- transferir 100 CLPD a @juan"
        };
      }
  
      const amount = parseFloat(match[1]);
      const token = match[2].toUpperCase();
      const recipient = match[3];

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

      // Si es una dirección directa
      if (this.validateAddress(recipient)) {
        return {
          success: true,
          message: `Transferencia iniciada: ${amount} ${token} a ${recipient}`,
          operation: {
            type: WalletOperationType.TRANSFER,
            params: {
              amount,
              tokenSymbol: token,
              to: recipient
            }
          }
        };
      }

      try {
        const user = await this.userService.getUser({ phoneNumber: context.phoneNumber });
        if (!user) {
          return {
            success: false,
            message: "Usuario no encontrado"
          };
        }

        const contacts = await this.userService.getContacts(user.id);
        const contactName = recipient.replace('@', '').trim().toLowerCase();
        const contact = contacts.find(c => c.name.toLowerCase() === contactName);

        if (!contact) {
          return {
            success: false,
            message: `No se encontró el contacto "${recipient}"`
          };
        }

        const contactUser = await this.userService.getUser({ phoneNumber: contact.phoneNumber });
        if (!contactUser || !contactUser.address) {
          return {
            success: false,
            message: "El contacto no tiene una dirección de wallet configurada"
          };
        }

        return {
          success: true,
          message: `Transferencia iniciada: ${amount} ${token} a ${contact.name} (${contactUser.address})`,
          operation: {
            type: WalletOperationType.TRANSFER,
            params: {
              amount,
              tokenSymbol: token,
              to: contactUser.address
            }
          }
        };

      } catch (error) {
        return {
          success: false,
          message: "Error al procesar la transferencia al contacto"
        };
      }
    }
}