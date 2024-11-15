import { ethers } from "ethers";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { ENCRYPTION_KEY } from "@internal/config";
import { CryptoManager } from "./types";

export class CryptoService implements CryptoManager {
  private encryptionKey: string;

  constructor() {
    if (!ENCRYPTION_KEY) {
      throw new Error("ENCRYPTION_KEY env value is not defined");
    }
    this.encryptionKey = this.generateEncryptionKey(ENCRYPTION_KEY);
  }

  public encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv("aes-256-cbc", this.encryptionKey, iv);

    let encrypted = cipher.update(text, "utf-8", "hex");
    encrypted += cipher.final("hex");

    const ivHex = iv.toString("hex");
    return `${encrypted}-${ivHex}`;
  }

  public decrypt(encryptedText: string): string {
    const [encrypted, ivHex] = encryptedText.split("-");
    const iv = Buffer.from(ivHex, "hex");

    const decipher = createDecipheriv("aes-256-cbc", this.encryptionKey, iv);

    let decrypted = decipher.update(encrypted, "hex", "utf-8");
    decrypted += decipher.final("utf-8");

    return decrypted;
  }

  public generateEvmWallet(): { address: string; privateKey: string } {
    const newWallet = ethers.Wallet.createRandom();
    return {
      address: newWallet.address,
      privateKey: newWallet.privateKey,
    };
  }

  private generateEncryptionKey(originalKey: string): string {
    return originalKey.split('').filter((_, i) => i % 2 === 0).join('');
  }
}