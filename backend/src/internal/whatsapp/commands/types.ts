import { WalletOperationType } from "@internal/wallet";

export interface CommandResult {
    success: boolean;
    message: string;
    operation?: {
      type: WalletOperationType;
      params: Record<string, any>;
    };
  }
  
  export interface MessageContext {
    message: string;
    phoneNumber: string;
    originalMessage: string;
  }
  
  export interface Command {
    execute(context: MessageContext): Promise<CommandResult>;
    matches(message: string): boolean;
  }