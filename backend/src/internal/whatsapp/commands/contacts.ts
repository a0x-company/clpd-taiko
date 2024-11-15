import { BaseCommand } from "./base";
import { CommandResult, MessageContext } from "./types";
import { UserService } from "@internal/users";

export class ContactsCommand extends BaseCommand {
    constructor(private readonly userService: UserService) {
      super([
        /^contactos$/i,
        /^contacts$/i,
        /^(?:agregar|add)\s+contacto\s+@(\w+)\s*\+?(\d+)$/i,
        /^(?:eliminar|remove)\s+contacto\s+@(\w+)$/i,
        /^(?:ver|list)\s+contactos$/i
      ]);
    }
  
    async execute(context: MessageContext): Promise<CommandResult> {
      const message = context.message.toLowerCase().trim();

      // Listar contactos
      if (/^(?:contactos|contacts|ver\s+contactos|list\s+contacts)$/i.test(message)) {
        return this.listContacts(context);
      }

      // Agregar contacto
      const addMatch = /^(?:agregar|add)\s+contacto\s+@(\w+)\s*\+?(\d+)$/i.exec(message);
      if (addMatch) {
        const name = addMatch[1];
        const phoneNumber = addMatch[2];
        return this.addContact(context, name, phoneNumber);
      }

      // Eliminar contacto
      const removeMatch = /^(?:eliminar|remove)\s+contacto\s+@(\w+)$/i.exec(message);
      if (removeMatch) {
        return this.removeContact(context, removeMatch[1]);
      }

      return {
        success: false,
        message: "Comando de contactos inválido. Opciones disponibles:\n" +
                "- ver contactos\n" +
                "- agregar contacto @nombre +123456789\n" +
                "- eliminar contacto @nombre"
      };
    }

    private async listContacts(context: MessageContext): Promise<CommandResult> {
      try {
        const user = await this.userService.getUser({ phoneNumber: context.phoneNumber });
        if (!user) {
          return { success: false, message: "Usuario no encontrado" };
        }

        const contacts = await this.userService.getContacts(user.id);
        if (contacts.length === 0) {
          return { success: true, message: "No tienes contactos guardados" };
        }

        const contactsList = contacts
          .map(c => `- @${c.name}: ${c.phoneNumber}`)
          .join('\n');

        return {
          success: true,
          message: "📋 Tus contactos:\n" + contactsList
        };
      } catch (error) {
        return { success: false, message: "Error al listar contactos" };
      }
    }

    private async addContact(context: MessageContext, name: string, phoneNumber: string): Promise<CommandResult> {
      try {
        const user = await this.userService.getUser({ phoneNumber: context.phoneNumber });
        if (!user) {
          return { success: false, message: "Usuario no encontrado" };
        }

        await this.userService.createContact(user, phoneNumber, name);
        return {
          success: true,
          message: `✅ Contacto @${name} agregado exitosamente`
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "Error al agregar contacto"
        };
      }
    }

    private async removeContact(context: MessageContext, name: string): Promise<CommandResult> {
      try {
        const user = await this.userService.getUser({ phoneNumber: context.phoneNumber });
        if (!user) {
          return { success: false, message: "Usuario no encontrado" };
        }

        const contacts = await this.userService.getContacts(user.id);
        const contact = contacts.find(c => c.name.toLowerCase() === name.toLowerCase());
        
        if (!contact) {
          return { success: false, message: `No se encontró el contacto @${name}` };
        }

        await this.userService.removeContact(user.id, contact.id);
        return {
          success: true,
          message: `❌ Contacto @${name} eliminado exitosamente`
        };
      } catch (error) {
        return {
          success: false,
          message: "Error al eliminar contacto"
        };
      }
    }
}