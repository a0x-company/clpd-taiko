import { Request, Response } from "express";
import { DepositService } from "@internal/deposits/deposits";
import { User } from "@internal/users/types";

type RequestWithUser = Request & {
  user?: User;
};

interface DepositRequest {
  amount: number;
  user: NonNullable<RequestWithUser['user']>;
}

function validateDepositRequest(req: RequestWithUser): DepositRequest | { error: string } {
  const { amount } = req.body;
  const user = req.user;

  if (!user) {
    return { error: "Usuario no autenticado" };
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    return { error: "Monto inválido" };
  }

  return { amount, user };
}

export function registerDepositHandler(depositService: DepositService) {
  return async (req: RequestWithUser, res: Response) => {
    try {
      req.user = res.locals.user;
      const validationResult = validateDepositRequest(req);

      if ('error' in validationResult) {
        return res.status(400).json({ error: validationResult.error });
      }

      const { amount, user } = validationResult;

      const deposit = await depositService.registerDeposit(
        user,
        amount
      );

      const responseData = {
        id: deposit.id,
        email: deposit.email,
        address: deposit.address,
        amount: deposit.amount,
        status: deposit.status,
        createdAt: deposit.createdAt,
      };

      return res.status(201).json({
        message: "Depósito registrado exitosamente",
        deposit: responseData
      });
    } catch (error) {
      console.error("Error al registrar depósito:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  };
}