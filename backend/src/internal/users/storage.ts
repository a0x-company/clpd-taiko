import { Firestore, CollectionReference, Query } from "@google-cloud/firestore";
import { Contact, GetUserInputDto, User, UserManager } from "./types";

export class UserDataStorage implements UserManager {
  private firestore: Firestore;

  private userCollectionName: string = "users";

  constructor(firestore: Firestore) {
    this.firestore = firestore;
  }

  private get userCollection(): CollectionReference {
    return this.firestore.collection(this.userCollectionName);
  }

  public async addNewUser(user: User): Promise<User> {
    try {
      const existingUser = await this.getUser({ phoneNumber: user.phoneNumber });
      if (existingUser) {
        throw new Error("Usuario ya existe");
      }

      const cleanedUser = {
        ...user,
        email: user.email || null,
        name: user.name || null,
        sixCharacters: user.sixCharacters || null,
        address: user.address || null,
        internalPrivateKeys: user.internalPrivateKeys || null,
        temporaryToken: user.temporaryToken || null,
        permanentToken: user.permanentToken || null,
        registrationOptions: user.registrationOptions || null,
        currentChallenge: user.currentChallenge || null,
      };

      await this.userCollection.doc(user.id).set(cleanedUser);
      console.log(`✅ Nuevo usuario con ID ${user.id} añadido exitosamente`);
      return user;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`❌ Error al añadir nuevo usuario: ${err.message}`);
      } else {
        throw new Error("❌ Error al añadir nuevo usuario: Error desconocido");
      }
    }
  }

  public async getUser(input: GetUserInputDto): Promise<User | null> {
    try {
      let query: Query = this.userCollection;

      if (input.id) {
        const doc = await this.userCollection.doc(input.id).get();
        return doc.exists ? (doc.data() as User) : null;
      } else if (input.phoneNumber) {
        query = query.where("phoneNumber", "==", input.phoneNumber);
      } else if (input.sixCharacters) {
        query = query.where("sixCharacters", "==", input.sixCharacters);
      } else if (input.email) {
        query = query.where("email", "==", input.email);
      } else {
        throw new Error("Se debe proporcionar al menos un parámetro de búsqueda");
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].data() as User;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`Error al obtener datos del usuario: ${err.message}`);
      } else {
        throw new Error("Error al obtener datos del usuario: Error desconocido");
      }
    }
  }

  public async updateUserData(phoneNumber: string, updateData: Partial<User>): Promise<void> {
    try {
      const user = await this.getUser({ phoneNumber });
      if (!user) {
        throw new Error("Usuario no encontrado");
      }

      const cleanedData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );

      await this.userCollection.doc(user.id).set(cleanedData, { merge: true });
      console.log(`✅ Datos del usuario actualizados para el número de teléfono ${phoneNumber}`);
    } catch (error) {
      console.error(
        `❌ Error al actualizar datos del usuario para el número de teléfono ${phoneNumber}:`,
        error
      );
      throw error;
    }
  }

  public async addContact(userId: string, contact: Contact): Promise<void> {
    try {
      const userDoc = await this.userCollection.doc(userId).get();
      if (!userDoc.exists) {
        throw new Error("Usuario no encontrado");
      }

      const userData = userDoc.data() as User;
      const contacts = userData.contacts || [];

      const exists = contacts.some(c => c.phoneNumber === contact.phoneNumber);
      if (exists) {
        throw new Error("El contacto ya existe");
      }

      contacts.push(contact);
      await this.userCollection.doc(userId).update({ contacts });
      console.log(`✅ Contacto con ID ${contact.id} añadido exitosamente para el usuario ${userId}`);
    } catch (error) {
      console.error(`❌ Error al añadir contacto para el usuario ${userId}:`, error);
      throw error;
    }
  }

  public async getContacts(userId: string): Promise<Contact[]> {
    try {
      const userDoc = await this.userCollection.doc(userId).get();
      if (!userDoc.exists) {
        throw new Error("Usuario no encontrado");
      }
      const userData = userDoc.data() as User;
      return userData.contacts || [];
    } catch (error) {
      console.error(`❌ Error al obtener contactos para el usuario ${userId}:`, error);
      throw error;
    }
  }

  public async updateContact(userId: string, contactId: string, updateData: Partial<Contact>): Promise<void> {
    try {
      const userDoc = await this.userCollection.doc(userId).get();
      if (!userDoc.exists) {
        throw new Error("Usuario no encontrado");
      }

      const userData = userDoc.data() as User;
      const contacts = userData.contacts || [];

      const contactIndex = contacts.findIndex(c => c.id === contactId);
      if (contactIndex === -1) {
        throw new Error("Contacto no encontrado");
      }

      contacts[contactIndex] = {
        ...contacts[contactIndex],
        ...updateData,
        updatedAt: new Date(),
      };

      await this.userCollection.doc(userId).update({ contacts });
      console.log(`✅ Contacto con ID ${contactId} actualizado exitosamente para el usuario ${userId}`);
    } catch (error) {
      console.error(`❌ Error al actualizar el contacto ${contactId} para el usuario ${userId}:`, error);
      throw error;
    }
  }

  public async removeContact(userId: string, contactId: string): Promise<void> {
    try {
      const userDoc = await this.userCollection.doc(userId).get();
      if (!userDoc.exists) {
        throw new Error("Usuario no encontrado");
      }

      const userData = userDoc.data() as User;
      const contacts = userData.contacts || [];

      const updatedContacts = contacts.filter(contact => contact.id !== contactId);
      if (contacts.length === updatedContacts.length) {
        throw new Error("Contacto no encontrado");
      }

      await this.userCollection.doc(userId).update({ contacts: updatedContacts });
      console.log(`✅ Contacto con ID ${contactId} eliminado exitosamente para el usuario ${userId}`);
    } catch (error) {
      console.error(`❌ Error al eliminar el contacto ${contactId} para el usuario ${userId}:`, error);
      throw error;
    }
  }

  public async getAllUsers(): Promise<User[]> {
    try {
      const snapshot = await this.userCollection.get();
      const users: User[] = [];
      snapshot.forEach(doc => users.push(doc.data() as User));
      return users;
    } catch (error) {
      console.error("❌ Error al obtener todos los usuarios:", error);
      throw error;
    }
  }

  public async searchUsersByName(name: string): Promise<User[]> {
    try {
      const snapshot = await this.userCollection.where("name", "==", name).get();
      const users: User[] = [];
      snapshot.forEach(doc => users.push(doc.data() as User));
      return users;
    } catch (error) {
      console.error(`❌ Error al buscar usuarios por nombre "${name}":`, error);
      throw error;
    }
  }
}
