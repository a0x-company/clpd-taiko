import { Express, Router } from "express";
import { JwtTokenManager } from "@internal/users/token-manager";

// services
import { WalletService } from "@internal/wallet/service";
import { UserService } from "@internal/users";

// handlers
import { transferTokenHandler } from "./transfer-token-handler";
import { swapTokenHandler } from "./swap-token-handler";
import { investPoolHandler } from "./invest-pool-handler";
import { getPositionsHandler } from "./get-positionts-handler";

// middleware
import { AuthMiddleware } from "@internal/http/middlewares/authentication";
import { bridgeTokenHandler } from "./bridge-token-handler";
// import { PasskeyAuthMiddleware } from "@internal/http/middlewares/passkey-authentication";

// types
export type WalletContext = {
  walletService: WalletService;
  userService: UserService;
};

const tokenManager = new JwtTokenManager();

export function setupWalletRoutes(router: Express, ctx: WalletContext) {
  const walletRouter = Router();

  // Rutas que requieren ambos middlewares (Passkey + JWT)
  walletRouter.post(
    "/transfer-token",
    AuthMiddleware(ctx.userService, tokenManager),
    // PasskeyAuthMiddleware(userService),
    transferTokenHandler(ctx)
  );

  walletRouter.post("/swap-token", AuthMiddleware(ctx.userService, tokenManager), swapTokenHandler(ctx));

  walletRouter.post("/invest", AuthMiddleware(ctx.userService, tokenManager), investPoolHandler(ctx));

  walletRouter.get(
    "/get-positions",
    AuthMiddleware(ctx.userService, tokenManager),
    getPositionsHandler(ctx)
  );

  walletRouter.post(
    "/bridge",
    AuthMiddleware(ctx.userService, tokenManager),
    bridgeTokenHandler(ctx)
  );
  router.use("/wallet", walletRouter);
  console.log("✅ Rutas de wallet configuradas");
}
