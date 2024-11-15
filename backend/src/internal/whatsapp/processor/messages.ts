import { CommandRegistry } from "./registry";
import { WalletService } from "@internal/wallet/service";
import { WhatsappService, WhatsappNotificationType } from "../service";
import { UserService } from "@internal/users";
import { WalletOperationType } from "@internal/wallet/types";
import {
  TransferCommand,
  SwapCommand,
  InvestCommand,
  BalanceCommand,
  PositionsCommand,
} from "../commands";
import { ContactsCommand } from "../commands/contacts";

export class MessageProcessor {
  private readonly commandRegistry: CommandRegistry;
  private readonly CONCURRENT_MESSAGES = 5;

  constructor(
    private readonly walletService: WalletService,
    private readonly whatsappService: WhatsappService,
    private readonly userService: UserService
  ) {
    this.commandRegistry = new CommandRegistry();
    this.registerCommands();
  }

  private registerCommands(): void {
    this.commandRegistry.register(new TransferCommand(this.userService));
    this.commandRegistry.register(new SwapCommand());
    this.commandRegistry.register(new InvestCommand());
    this.commandRegistry.register(new BalanceCommand());
    this.commandRegistry.register(new PositionsCommand());
    this.commandRegistry.register(new ContactsCommand(this.userService));

    console.log("📝 Commands registered:", this.commandRegistry.getAvailableCommands());
  }

  async processMessage(message: string, phoneNumber: string): Promise<void> {
    try {
      const user = await this.userService.getUser({ phoneNumber });
      if (!user) {
        await this.whatsappService.sendNotification(phoneNumber, WhatsappNotificationType.ERROR, {
          message: "Usuario no registrado. Por favor regístrate primero.",
        });
        return;
      }

      const command = this.commandRegistry.findMatchingCommand(message);

      if (!command) {
        await this.whatsappService.sendNotification(
          phoneNumber,
          WhatsappNotificationType.HELP_MESSAGE,
          { 
            message: "❌ Comando no reconocido.\n\nEscribe 'ayuda' para ver la lista de comandos disponibles." 
          }
        );
        return;
      }

      console.log(`📝 Executing command: ${command.constructor.name}`);

      const result = await command.execute({
        message,
        phoneNumber,
        originalMessage: message,
      });

      if (result.success && result.operation) {
        // Enviar mensaje inicial para operaciones blockchain
        await this.whatsappService.sendNotification(
          phoneNumber,
          WhatsappNotificationType.MESSAGE_RECEIVED,
          { message: result.message }
        );

        try {
          switch (result.operation.type) {
            case WalletOperationType.TRANSFER:
              const transferResult = await this.walletService.transferToken(
                user,
                result.operation.params.to,
                result.operation.params.tokenSymbol,
                result.operation.params.amount
              );
              if (transferResult) {
                await this.whatsappService.sendNotification(
                  phoneNumber,
                  WhatsappNotificationType.OPERATION_SUCCESS,
                  {
                    message: `✅ Transferencia completada\nVer transacción: https://basescan.org/tx/${transferResult}`,
                  }
                );
              }
              break;

            case WalletOperationType.SWAP:
              const swapResult = await this.walletService.swapToken(
                user,
                result.operation.params.tokenInSymbol,
                result.operation.params.amount
              );
              if (swapResult) {
                await this.whatsappService.sendNotification(
                  phoneNumber,
                  WhatsappNotificationType.OPERATION_SUCCESS,
                  {
                    message: `✅ Swap completado\nVer transacción: https://basescan.org/tx/${swapResult}`,
                  }
                );
              }
              break;

            case WalletOperationType.INVEST:
              let investResult;
              if (result.operation.params.tokenSymbol === "CLPD") {
                investResult = await this.walletService.investCLPD(
                  user,
                  result.operation.params.amount
                );
              } else {
                investResult = await this.walletService.investUSDC(
                  user,
                  result.operation.params.amount
                );
              }
              if (investResult) {
                await this.whatsappService.sendNotification(
                  phoneNumber,
                  WhatsappNotificationType.OPERATION_SUCCESS,
                  {
                    message: `✅ Inversión completada\nVer transacción: https://basescan.org/tx/${investResult}`,
                  }
                );
              }
              break;

            case WalletOperationType.CHECK_POSITIONS:
              const positions = await this.walletService.getPositions(user);
              await this.whatsappService.sendNotification(
                phoneNumber,
                WhatsappNotificationType.POSITIONS_INFO,
                {
                  message:
                    `📊 Tus posiciones:\n` +
                    `CLPD: ${positions.amountCLPD}\n` +
                    `USDC: ${positions.amountUSDC}`,
                }
              );
              break;

            case WalletOperationType.CHECK_BALANCE:
              const balanceCLPD = await this.walletService.getTokenBalance(user, "CLPD");
              const balanceUSDC = await this.walletService.getTokenBalance(user, "USDC");
              await this.whatsappService.sendNotification(
                phoneNumber,
                WhatsappNotificationType.BALANCE_INFO,
                {
                  message: `💰 Tu balance:\n` + `CLPD: ${balanceCLPD}\n` + `USDC: ${balanceUSDC}`,
                }
              );
              break;

            default:
              throw new Error(`Operación no soportada: ${result.operation.type}`);
          }
        } catch (operationError: any) {
          console.error("Error executing operation:", operationError);
          await this.whatsappService.sendNotification(
            phoneNumber,
            WhatsappNotificationType.OPERATION_ERROR,
            {
              message: this.whatsappService.humanizeError(operationError.message),
            }
          );
          return;
        }
      } else if (result.success) {
        // Para comandos sin operación blockchain (ej: contactos)
        await this.whatsappService.sendNotification(
          phoneNumber,
          WhatsappNotificationType.OPERATION_SUCCESS,
          { message: result.message }
        );
      } else if (!result.success) {
        await this.whatsappService.sendNotification(
          phoneNumber,
          WhatsappNotificationType.OPERATION_ERROR,
          { message: result.message }
        );
      }
    } catch (error) {
      console.error("Error processing message:", error);
      await this.whatsappService.sendNotification(phoneNumber, WhatsappNotificationType.ERROR, {
        message: "Error interno del servidor. Por favor intenta más tarde.",
      });
    }
  }

  
}
