// dependencies
import { Firestore } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";
import { http, bankScrap, config } from "@internal";
import { DepositService } from "@internal/deposits";

config.validateVaultApiEnvs();

// clients
 const firestore = new Firestore({ projectId: config.PROJECT_ID, databaseId: config.DATABASE_ENV });

// storages
const vaultBalanceStorage = new bankScrap.VaultBalanceStorage();

// services
const scrapService = new bankScrap.SantanderClScraper();
const depositService = new DepositService(firestore, new Storage(), config.RESEND_API_KEY as string);
// http
const server = http.createServer();
http.setupVaultRoutes(server, { scrapService, storageService: vaultBalanceStorage, depositService });

export default server;
