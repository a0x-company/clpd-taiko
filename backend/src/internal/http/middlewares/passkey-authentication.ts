import { Request, Response, NextFunction } from "express";
import { UserService } from "@internal/users/users";

export const PasskeyAuthMiddleware = (userService: UserService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { passkeyResponse } = req.body;
    const user = res.locals.user;
    const phoneNumber = user.phoneNumber;
    if (!passkeyResponse) {
      try {
        console.log('Intentando generar opciones de passkey para:', phoneNumber);
        const { options } = await userService.login(phoneNumber);
        
        if (!options) {
          console.error('Opciones de passkey es undefined');
          return res.status(401).json({
            error: "Opciones de passkey no generadas correctamente"
          });
        }

        return res.status(401).json({
          error: "Se requiere autenticación con passkey",
          passkeyOptions: options
        });
      } catch (error: any) {
        // Logging detallado del error
        console.error('Error completo:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
        
        return res.status(401).json({
          error: "Error al generar opciones de passkey",
          details: error instanceof Error ? error.message : 'Error desconocido',
          type: error.constructor.name
        });
      }
    }

    try {
      const token = await userService.completeLogin(phoneNumber, passkeyResponse);
      req.headers.authorization = `Bearer ${token}`;
      next();
    } catch (error) {
      return res.status(500).send({
        error: "Autenticación con passkey fallida",
      });
    }
  };
};