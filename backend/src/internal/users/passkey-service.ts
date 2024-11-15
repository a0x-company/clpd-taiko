import { 
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/types';
import { PasskeyManager, UserManager, Passkey } from './types';
import { config } from '@internal';

export const getWebAuthnConfig = (requestOrigin?: string) => {
  if (requestOrigin?.includes('localhost')) {
    return {
      rpID: 'localhost',
      origin: 'http://localhost:3000'
    };
  }

  const url = new URL(config.ORIGIN ?? 'http://localhost:3000');
  return {
    rpID: url.hostname,
    origin: url.origin
  };
};

export class PasskeyService implements PasskeyManager {
  private rpName = 'CLPD';
  private rpID: string;
  private origin: string;

  constructor(private userStorage: UserManager) {
    const config = getWebAuthnConfig();
    this.rpID = config.rpID;
    this.origin = config.origin;
  }

  private setOrigin(requestOrigin?: string) {
    const config = getWebAuthnConfig(requestOrigin);
    this.rpID = config.rpID;
    this.origin = config.origin;
  }

  async generateRegistrationOptions(phoneNumber: string, requestOrigin?: string): Promise<PublicKeyCredentialCreationOptionsJSON> {
    this.setOrigin(requestOrigin);
    const user = await this.userStorage.getUser({ phoneNumber });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpID,
      userID: new Uint8Array(Buffer.from(user.id)),
      userName: user.phoneNumber,
      attestationType: 'none',
      excludeCredentials: user.passkeys.map(passkey => ({
        id: passkey.credentialID,
        type: 'public-key',
        transports: passkey.transports,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      supportedAlgorithmIDs: [-7, -257],
    });

    await this.userStorage.updateUserData(phoneNumber, { registrationOptions: options });

    return options;
  }

  async verifyRegistration(phoneNumber: string, response: RegistrationResponseJSON, requestOrigin?: string) {
    this.setOrigin(requestOrigin);
    const user = await this.userStorage.getUser({ phoneNumber });
    if (!user || !user.registrationOptions) {
      throw new Error('Usuario no encontrado o faltan opciones de registro');
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: user.registrationOptions.challenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

      const newPasskey: Passkey = {
        credentialID: credential.id,
        credentialPublicKey: Buffer.from(credential.publicKey).toString('base64url'),
        counter: credential.counter,
        credentialDeviceType,
        credentialBackedUp,
        transports: credential.transports,
      };

      await this.userStorage.updateUserData(phoneNumber, { 
        passkeys: [...user.passkeys, newPasskey],
        registrationOptions: undefined
      });
    }

    return verification;
  }

  async generateAuthenticationOptions(phoneNumber: string, requestOrigin?: string): Promise<PublicKeyCredentialRequestOptionsJSON> {
    try {
      console.log('Iniciando generateAuthenticationOptions para:', phoneNumber);
      console.log('Request Origin:', requestOrigin);
      
      this.setOrigin(requestOrigin);
      console.log('Config establecido:', { rpID: this.rpID, origin: this.origin });
      
      const user = await this.userStorage.getUser({ phoneNumber });
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      console.log('Usuario encontrado, passkeys:', user.passkeys.length);

      if (!user.passkeys.length) {
        throw new Error('El usuario no tiene passkeys registradas');
      }

      const options = await generateAuthenticationOptions({
        rpID: this.rpID,
        allowCredentials: user.passkeys.map(passkey => ({
          id: passkey.credentialID,
          type: 'public-key' as const,
          transports: passkey.transports,
        })),
        userVerification: 'preferred',
      });

      console.log('Opciones generadas exitosamente');
      
      await this.userStorage.updateUserData(phoneNumber, { currentChallenge: options.challenge });
      console.log('Challenge actualizado en la base de datos');

      return options;
    } catch (error) {
      console.error('Error en generateAuthenticationOptions:', error);
      throw error;
    }
  }

  async verifyAuthentication(phoneNumber: string, response: AuthenticationResponseJSON, requestOrigin?: string) {
    this.setOrigin(requestOrigin);
    const user = await this.userStorage.getUser({ phoneNumber });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const passkey = user.passkeys.find(pk => pk.credentialID === response.id);
    if (!passkey) {
      throw new Error('Passkey no encontrada');
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: user.currentChallenge || '',
      expectedOrigin: this.origin,
      expectedRPID: this.rpID,
      requireUserVerification: true,
      credential: {
        id: passkey.credentialID,
        publicKey: new Uint8Array(Buffer.from(passkey.credentialPublicKey, 'base64')),
        counter: passkey.counter,
        transports: passkey.transports,
      },
    });

    if (verification.verified) {
      const { newCounter } = verification.authenticationInfo;

      const updatedPasskeys = user.passkeys.map(pk => 
        pk.credentialID === passkey.credentialID 
          ? { ...pk, counter: newCounter }
          : pk
      );

      await this.userStorage.updateUserData(phoneNumber, { 
        currentChallenge: undefined,
        passkeys: updatedPasskeys
      });
    }

    return verification;
  }
}