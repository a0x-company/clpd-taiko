import {
  User,
  RegisterUserInputDto,
  GetUserInputDto,
  UserManager,
  UserResponseDto,
  LoginResponseDto,
  Contact,
} from "./types";
import { PasskeyService } from "./passkey-service";
import { CryptoService } from "./crypto-service";
import { v4 as uuidv4 } from "uuid";
import { ethers } from "ethers";
import { JwtTokenManager } from "./token-manager";
import axios from "axios";
import { isValidName, isValidPhoneNumber } from "./utils";

export class UserService {
  private passkeyService: PasskeyService;

  private cryptoService: CryptoService;

  private tokenManager: JwtTokenManager;

  constructor(private userStorage: UserManager) {
    this.passkeyService = new PasskeyService(userStorage);
    this.cryptoService = new CryptoService();
    this.tokenManager = new JwtTokenManager();
  }

  public async getUser(input: GetUserInputDto): Promise<User | null> {
    return await this.userStorage.getUser(input);
  }

  public async register(input: RegisterUserInputDto): Promise<any> {
    const { phoneNumber, name } = input;
    const user = await this.userStorage.getUser({ phoneNumber });

    if (user) {
      throw new Error("Usuario ya existe");
    }

    const sixCharacters = this.generateSixCharactersCode();
    const newUser: User = {
      id: uuidv4(),
      phoneNumber,
      name,
      sixCharacters,
      createdAt: new Date(),
      updatedAt: new Date(),
      passkeys: [],
    };
    await this.userStorage.addNewUser(newUser);

    await this.sendSixCharactersCode(phoneNumber, sixCharacters);

    return { message: "Código de seis caracteres enviado" };
  }

  public async verifySixCharacters(phoneNumber: string, sixCharacters: string): Promise<string> {
    const user = await this.userStorage.getUser({ phoneNumber });
    if (!user || user.sixCharacters !== sixCharacters) {
      throw new Error("Código inválido");
    }

    const temporaryToken = this.tokenManager.generateTemporaryToken(phoneNumber);

    if (!user.address) {
      const { address, privateKey } = this.cryptoService.generateEvmWallet();
      const encryptedPrivateKey = this.cryptoService.encrypt(privateKey);

      await this.userStorage.updateUserData(phoneNumber, {
        temporaryToken,
        address,
        internalPrivateKeys: { evmPrivateKey: encryptedPrivateKey },
      });
    } else {
      await this.userStorage.updateUserData(phoneNumber, { temporaryToken });
    }

    return temporaryToken;
  }

  public async createWallet(phoneNumber: string): Promise<string> {
    const user = await this.userStorage.getUser({ phoneNumber });
    if (!user) throw new Error("Usuario no encontrado");

    const { address, privateKey } = this.cryptoService.generateEvmWallet();
    const encryptedPrivateKey = this.cryptoService.encrypt(privateKey);

    await this.userStorage.updateUserData(phoneNumber, {
      address,
      internalPrivateKeys: { evmPrivateKey: encryptedPrivateKey },
    });

    return address;
  }

  public async initiatePasskeyRegistration(
    phoneNumber: string,
    requestOrigin?: string
  ): Promise<any> {
    const options = await this.passkeyService.generateRegistrationOptions(
      phoneNumber,
      requestOrigin
    );
    await this.userStorage.updateUserData(phoneNumber, { registrationOptions: options });
    return options;
  }

  public async completePasskeyRegistration(
    phoneNumber: string,
    response: any,
    temporaryToken: string,
    requestOrigin?: string
  ): Promise<{ user: User; token: string }> {
    const user = await this.userStorage.getUser({ phoneNumber });
    if (!user || user.temporaryToken !== temporaryToken) {
      throw new Error("Token temporal inválido");
    }

    const verification = await this.passkeyService.verifyRegistration(
      phoneNumber,
      response,
      requestOrigin
    );
    if (!verification.verified) {
      throw new Error("Verificación fallida");
    }

    const permanentToken = this.tokenManager.generatePermanentToken(
      phoneNumber,
      user.address || ""
    );

    await this.userStorage.updateUserData(phoneNumber, {
      sixCharacters: null,
      temporaryToken: null,
      permanentToken,
    });

    return { user: { ...user, permanentToken }, token: permanentToken };
  }

  public async login(
    phoneNumber: string,
    isCurrentlyAuthenticated: boolean = false,
    requestOrigin?: string
  ): Promise<LoginResponseDto> {
    const user = await this.userStorage.getUser({ phoneNumber });
    if (!user) throw new Error("Usuario no encontrado");

    if (!isCurrentlyAuthenticated) {
      const options = await this.passkeyService.generateAuthenticationOptions(
        phoneNumber,
        requestOrigin
      );
      return {
        requiresPasskey: true,
        options,
        message: "Se requiere autenticación con passkey",
      };
    }

    const userResponse: UserResponseDto = {
      id: user.id,
      phoneNumber: user.phoneNumber,
      email: user.email,
      name: user.name,
      address: user.address,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      requiresPasskey: false,
      message: "Token válido",
      user: userResponse,
      token: user.permanentToken,
    };
  }

  public async completeLogin(
    phoneNumber: string,
    response: any,
    requestOrigin?: string
  ): Promise<string> {
    const user = await this.userStorage.getUser({ phoneNumber });
    if (!user) throw new Error("Usuario no encontrado");

    const verification = await this.passkeyService.verifyAuthentication(
      phoneNumber,
      response,
      requestOrigin
    );
    if (!verification.verified) {
      throw new Error("Autenticación fallida");
    }

    const newToken = this.tokenManager.generatePermanentToken(phoneNumber, user.address || "");
    await this.userStorage.updateUserData(phoneNumber, { permanentToken: newToken });

    return newToken;
  }

  public async getPrivateKey(userId: string): Promise<string> {
    const user = await this.userStorage.getUser({ id: userId });
    if (!user || !user.internalPrivateKeys?.evmPrivateKey) {
      throw new Error("User not found or private key not set");
    }
    return this.cryptoService.decrypt(user.internalPrivateKeys.evmPrivateKey);
  }

  public async signTransaction(userId: string, transaction: any): Promise<string> {
    const privateKey = await this.getPrivateKey(userId);
    const wallet = new ethers.Wallet(privateKey);
    return wallet.signTransaction(transaction);
  }

  private generateSixCharactersCode(): string {
    return Array(6)
      .fill(0)
      .map(() => Math.floor(Math.random() * 10).toString())
      .join("");
  }

  private async sendSixCharactersCode(phoneNumber: string, code: string): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await axios.post(
          "https://whatsapp-whatsapp-client-claucondor-61523929174.us-central1.run.app/ws/send-message",
          {
            phoneNumber,
            type: "CONFIRMATION",
            data: {
              code,
            },
          }
        );
        console.log(`📱 Código de confirmación enviado por WhatsApp a ${phoneNumber}`);
        return;
      } catch (error) {
        attempt++;
        console.error(`Intento ${attempt}/${maxRetries} fallido:`, error);

        if (attempt === maxRetries) {
          throw new Error("No se pudo enviar el código de verificación después de 3 intentos");
        }

        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  public async resendSixCharacters(phoneNumber: string): Promise<any> {
    const user = await this.userStorage.getUser({ phoneNumber });

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    const sixCharacters = this.generateSixCharactersCode();
    await this.userStorage.updateUserData(phoneNumber, { sixCharacters });

    await this.sendSixCharactersCode(phoneNumber, sixCharacters);

    return { message: "Código de seis caracteres reenviado" };
  }

  public async createContact(user: User, phoneNumber: string, name: string): Promise<any> {
    if (!isValidPhoneNumber(phoneNumber)) {
      throw new Error("Número de teléfono inválido");
    }
  
    if (!isValidName(name)) {
      throw new Error("Nombre inválido");
    }
  
    const contact: Contact = {
      id: uuidv4(),
      phoneNumber,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  
    await this.userStorage.addContact(user.id, contact);
  
    return { message: "Contacto creado exitosamente" };
  }

  public async getAllUsers(): Promise<User[]> {
    return await this.userStorage.getAllUsers();
  }

  public async searchUsersByName(name: string): Promise<User[]> {
    return await this.userStorage.searchUsersByName(name);
  }

  public async getContacts(userId: string): Promise<Contact[]> {
    return await this.userStorage.getContacts(userId);
  }

  public async updateContact(userId: string, contactId: string, updateData: Partial<Contact>): Promise<any> {
    if (updateData.phoneNumber && !isValidPhoneNumber(updateData.phoneNumber)) {
      throw new Error("Número de teléfono inválido");
    }
  
    if (updateData.name && !isValidName(updateData.name)) {
      throw new Error("Nombre inválido");
    }
  
    await this.userStorage.updateContact(userId, contactId, updateData);
    return { message: "Contacto actualizado exitosamente" };
  }

  public async removeContact(userId: string, contactId: string): Promise<any> {
    await this.userStorage.removeContact(userId, contactId);
    return { message: "Contacto eliminado exitosamente" };
  }
}
