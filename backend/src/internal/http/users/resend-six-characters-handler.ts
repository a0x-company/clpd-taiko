import { UserService } from "@internal/users";
import { Request, Response } from "express";

export function resendSixCharactersHandler(userService: UserService) {
  return async (req: Request, res: Response) => {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ error: "Número de teléfono es requerido" });
      }

      const result = await userService.resendSixCharacters(phoneNumber);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error reenviando código:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  };
}