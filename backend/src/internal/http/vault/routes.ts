// third-party
import { Express, Router } from "express";

// service
import { getVaultBalanceHandler } from "./get-vault-balance-handler";
import { getVaultBalanceHistoryHandler } from "./get-vault-balance-history-handler";
import { getVaultTestDataHandler } from "./get-vault-test-data-handler";
import { VaultBalanceStorage } from "@internal/bank-scrap/storage";
import { DepositService } from "@internal/deposits";

interface VaultGetter {
  getVaultBalance(): Promise<number>;
}

export type VaultContext = {
  scrapService: VaultGetter;
  storageService: VaultBalanceStorage;
  depositService: DepositService
};

export function setupVaultRoutes(router: Express, ctx: VaultContext) {
  const vaultRouter = Router();

  vaultRouter.get("/balance", getVaultBalanceHandler(ctx));
  vaultRouter.get("/balance/storage", getVaultBalanceHandler(ctx));
  vaultRouter.get("/balance/history", getVaultBalanceHistoryHandler(ctx));
  vaultRouter.get("/balance/chains", getVaultTestDataHandler(ctx));
  
  router.use("/vault", vaultRouter);
  console.log("🚀 Vault routes set up");
}