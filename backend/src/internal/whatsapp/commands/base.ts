import { Command, CommandResult, MessageContext } from './types';

export abstract class BaseCommand implements Command {
  protected patterns: RegExp[];

  constructor(patterns: RegExp[]) {
    this.patterns = patterns;
  }

  matches(message: string): boolean {
    const normalizedMessage = message.toLowerCase().trim();
    return this.patterns.some(pattern => pattern.test(normalizedMessage));
  }

  protected validateAmount(amount: number): boolean {
    return amount > 0 && !isNaN(amount) && isFinite(amount);
  }

  protected validateAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  protected validateToken(token: string): boolean {
    return ['CLPD', 'USDC'].includes(token.toUpperCase());
  }

  protected formatError(type: 'amount' | 'address' | 'token'): string {
    switch (type) {
      case 'amount':
        return 'El monto debe ser un número válido mayor a 0';
      case 'address':
        return 'La dirección debe ser una dirección ETH válida (0x...)';
      case 'token':
        return 'El token debe ser CLPD o USDC';
      default:
        return 'Error de validación';
    }
  }

  abstract execute(context: MessageContext): Promise<CommandResult>;
}