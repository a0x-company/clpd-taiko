import { UserService } from "@internal/users";
import { Request, Response } from "express";

export function registerHandler(userService: UserService) {
  return async (req: Request, res: Response) => {
    try {
      const { phoneNumber, name } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ error: "Número de teléfono es requerido" });
      }

      if (!name) {
        return res.status(400).json({ error: "Nombre es requerido" });
      }

      const result = await userService.register({ phoneNumber, name });
      
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error registrando usuario:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  };
}