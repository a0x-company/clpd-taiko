import { UserService } from "@internal/users";
import { Request, Response } from "express";

export function initiatePasskeyRegistrationHandler(userService: UserService) {
  return async (req: Request, res: Response) => {
    try {
      const { phoneNumber } = req.body;
      const requestOrigin = req.headers.origin;
      console.log("requestOrigin", requestOrigin);

      if (!phoneNumber) {
        return res.status(400).json({ error: "Número de teléfono es requerido" });
      }

      const options = await userService.initiatePasskeyRegistration(phoneNumber, requestOrigin);
      
      return res.status(200).json(options);
    } catch (error) {
      console.error("Error iniciando registro de passkey:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  };
}