import * as jose from "jose";
import crypto from "crypto";
import { getPublicCompressed } from "@toruslabs/eccrypto";
import { BridgeRequest, ValidatedBridgeRequest } from "../types";
import { getSessionToken } from "@/lib/auth";

export class AuthService {
  static async validateAndDecryptRequest(request: Request): Promise<ValidatedBridgeRequest> {
    const { userAddress, networkIn, networkOut, amount } = (await request.json()) as BridgeRequest;

    const idToken = await getSessionToken();

    if (!userAddress || !networkIn || !networkOut || !amount || !idToken) {
      throw new Error("Missing required fields");
    }

    return {
      userAddress,
      networkIn,
      networkOut,
      amount,
      decryptedKey: "", // TODO: Decrypt private key
    };
  }
}
