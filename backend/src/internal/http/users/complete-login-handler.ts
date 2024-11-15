import { UserService } from "@internal/users";
import { Request, Response } from "express";


export function completeLoginHandler(userService: UserService) {
  return async (req: Request, res: Response) => {
    try {
      const { phoneNumber, passkeyResponse } = req.body;
      const requestOrigin = req.headers.origin;
      console.log("requestOrigin", requestOrigin);

      if (!phoneNumber || !passkeyResponse) {
        return res.status(400).json({ error: "Número de teléfono y respuesta de passkey son requeridos" });
      }

      const token = await userService.completeLogin(
        phoneNumber, 
        passkeyResponse,
        requestOrigin
      );
      
      return res.status(200).json({ token });
    } catch (error) {
      console.error("Error completando inicio de sesión:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  };
}