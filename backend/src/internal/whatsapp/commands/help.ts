import { BaseCommand } from "./base";
import { CommandResult, MessageContext } from "./types";

export class HelpCommand extends BaseCommand {
  private readonly helpMessage =
    "📚 *Comandos disponibles:*\n\n" +
    "🔄 *Transferencias:*\n" +
    "- transferir 100 CLPD a 0x123...\n" +
    "- enviar 50 USDC a 0x456...\n\n" +
    "💱 *Swaps:*\n" +
    "- cambiar 100 CLPD\n" +
    "- swap 50 USDC\n" +
    "- s 100 CLPD (comando corto)\n\n" +
    "💰 *Inversiones:*\n" +
    "- invertir 200 CLPD\n" +
    "- aportar 100 USDC\n" +
    "- i 50 USDC (comando corto)\n\n" +
    "📊 *Consultas:*\n" +
    "- ver balance (o 'bal')\n" +
    "- ver posiciones (o 'pos')\n\n" +
    "👥 *Contactos:*\n" +
    "- ver contactos\n" +
    "- agregar contacto @nombre +123456789\n" +
    "- eliminar contacto @nombre\n" +
    "- transferir 100 CLPD a @nombre\n\n" +
    "❓ Escribe 'ayuda' en cualquier momento para ver este mensaje.";

  constructor() {
    super([
      /^(?:ayuda|help|commands|comandos|help me|info|\?)$/i,
      /(?:como|what|how).+(?:usar|use|funciona|works)/i,
    ]);
  }

  async execute(context: MessageContext): Promise<CommandResult> {
    return {
      success: true,
      message: this.helpMessage,
    };
  }
}
