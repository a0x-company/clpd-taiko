import {
  VerifiedRegistrationResponse,
  VerifiedAuthenticationResponse,
} from "@simplewebauthn/server";
import {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/types";

export interface User {
  id: string;
  phoneNumber: string;
  email?: string;
  name?: string;
  sixCharacters?: string | null;
  address?: string;
  internalPrivateKeys?: {
    evmPrivateKey: string;
  };
  passkeys: Passkey[];
  registrationOptions?: PublicKeyCredentialCreationOptionsJSON;
  currentChallenge?: string;
  temporaryToken?: string | null;
  permanentToken?: string | null;
  contacts?: Contact[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GetUserInputDto {
  id?: string;
  phoneNumber?: string;
  email?: string;
  sixCharacters?: string;
}

export interface RegisterUserInputDto {
  phoneNumber: string;
  name?: string;
}

export interface Passkey {
  credentialID: string;
  credentialPublicKey: string;
  counter: number;
  credentialDeviceType: string;
  credentialBackedUp: boolean;
  transports?: AuthenticatorTransportFuture[];
}

export interface StoredUserData {
  address: string;
  email: string;
  name: string;
  profileImage: string;
  token: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserResponseDto {
  id: string;
  phoneNumber: string;
  email?: string;
  name?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginResponseDto {
  requiresPasskey: boolean;
  options?: any;
  message: string;
  user?: UserResponseDto; // Solo se incluye cuando no requiere passkey
  token?: string | null; // Solo se incluye cuando no requiere passkey
}

export interface UserManager {
  getUser(input: GetUserInputDto): Promise<User | null>;
  addNewUser(user: User): Promise<User>;
  updateUserData(phoneNumber: string, updateData: Partial<User>): Promise<void>;
  addContact(userId: string, contact: Contact): Promise<void>;
  getContacts(userId: string): Promise<Contact[]>;
  updateContact(userId: string, contactId: string, updateData: Partial<Contact>): Promise<void>;
  removeContact(userId: string, contactId: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  searchUsersByName(name: string): Promise<User[]>;
}

export interface PasskeyManager {
  generateRegistrationOptions(
    phoneNumber: string,
    requestOrigin?: string
  ): Promise<PublicKeyCredentialCreationOptionsJSON>;

  verifyRegistration(
    phoneNumber: string,
    response: RegistrationResponseJSON,
    requestOrigin?: string
  ): Promise<VerifiedRegistrationResponse>;

  generateAuthenticationOptions(
    phoneNumber: string,
    requestOrigin?: string
  ): Promise<PublicKeyCredentialRequestOptionsJSON>;

  verifyAuthentication(
    phoneNumber: string,
    response: AuthenticationResponseJSON,
    requestOrigin?: string
  ): Promise<VerifiedAuthenticationResponse>;
}

export interface CryptoManager {
  encrypt(text: string): string;
  decrypt(encryptedText: string): string;
  generateEvmWallet(): { address: string; privateKey: string };
}

export interface Contact {
  id: string;
  phoneNumber: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
