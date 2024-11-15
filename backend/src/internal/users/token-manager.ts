import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@internal/config";

export class JwtTokenManager {
  public generateTemporaryToken(phoneNumber: string): string {
    const payload = {
      phoneNumber,
      type: "temporary",
      iat: Math.floor(Date.now() / 1000),
      jti: Math.random().toString(36).substring(2),
    };
    return jwt.sign(payload, JWT_SECRET);
  }

  public generatePermanentToken(phoneNumber: string, address: string): string {
    const payload = {
      phoneNumber,
      address,
      type: "permanent",
      iat: Math.floor(Date.now() / 1000),
      jti: Math.random().toString(36).substring(2),
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "2d" });
  }

  public decodeToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Token expirado");
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Token inválido");
      } else {
        throw new Error("Error al verificar el token");
      }
    }
  }

  public isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (decoded.type === "temporary") return false;
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  public getTokenAge(token: string): number {
    const decoded = this.decodeToken(token);
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime - decoded.iat;
  }
}
