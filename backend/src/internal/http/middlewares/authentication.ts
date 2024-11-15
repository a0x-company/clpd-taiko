import { Request, Response, NextFunction } from "express";
import { UserService } from "@internal/users/users";
import { JwtTokenManager } from "@internal/users/token-manager";

export const AuthMiddleware = (userService: UserService, tokenManager: JwtTokenManager) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.locals.authenticated = false;
      return next();
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = tokenManager.decodeToken(token);
      const user = await userService.getUser({ phoneNumber: decoded.phoneNumber });

      if (!user) {
        res.locals.authenticated = false;
        return next();
      }

      res.locals.authenticated = !tokenManager.isTokenExpired(token);
      res.locals.user = user;
      next();
    } catch (error) {
      res.locals.authenticated = false;
      next();
    }
  };
};
