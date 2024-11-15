import { UserService } from "@internal/users";
import { Request, Response } from "express";

export function completePasskeyRegistrationHandler(userService: UserService) {
  return async (req: Request, res: Response) => {
    try {
      const { phoneNumber, response } = req.body;
      const temporaryToken = req.headers.authorization?.split(' ')[1];
      const requestOrigin = req.headers.origin;
      
      console.log("requestOrigin", requestOrigin);

      if (!phoneNumber || !response || !temporaryToken) {
        return res.status(400).json({ error: "Número de teléfono, respuesta y token temporal son requeridos" });
      }

      const result = await userService.completePasskeyRegistration(
        phoneNumber, 
        response, 
        temporaryToken,
        requestOrigin
      );
      
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error completando registro de passkey:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  };
}