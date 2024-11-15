import {
  BalanceCommand,
  Command,
  HelpCommand,
  InvestCommand,
  PositionsCommand,
  SwapCommand,
  TransferCommand,
} from "../commands";

export class CommandRegistry {
  private readonly commands: Command[] = [];

  constructor() {
    this.registerDefaultCommands();
  }

  private registerDefaultCommands(): void {
    this.commands.push(
      new HelpCommand()
    );
  }

  register(command: Command): void {
    this.commands.push(command);
  }

  findMatchingCommand(message: string): Command | null {
    const normalizedMessage = message.toLowerCase().trim();

    let command = this.commands.find((cmd) => cmd.matches(normalizedMessage));

    if (!command) {
      command = this.commands.find((cmd) => {
        try {
          return cmd.matches(normalizedMessage);
        } catch (error) {
          console.error(`Error matching command: ${error}`);
          return false;
        }
      });
    }

    return command || null;
  }

  getAvailableCommands(): string[] {
    return this.commands.map((command) => command.constructor.name);
  }

  clearCommands(): void {
    this.commands.length = 0;
  }

  removeCommand(commandType: string): void {
    const index = this.commands.findIndex((cmd) => cmd.constructor.name === commandType);
    if (index !== -1) {
      this.commands.splice(index, 1);
    }
  }
}
