import { UserService } from "@internal/users";
import { Request, Response } from "express";

export function verifySixCharactersHandler(userService: UserService) {
  return async (req: Request, res: Response) => {
    try {
      const { phoneNumber, sixCharacters } = req.body;
      
      if (!phoneNumber || !sixCharacters) {
        return res.status(400).json({ error: "Número de teléfono y código de seis caracteres son requeridos" });
      }

      const token = await userService.verifySixCharacters(phoneNumber, sixCharacters);
      
      return res.status(200).json({ token });
    } catch (error) {
      console.error("Error verificando código de seis caracteres:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  };
}