// dependencies
import { Firestore } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";
import { http, config, users, deposits, wallet } from "@internal";
import { CHAIN_CONFIGS } from "@internal/wallet/config";
import { WalletService } from "@internal/wallet/service";

config.validateRequiredEnvs();

// clients
const firestore = new Firestore({ projectId: config.PROJECT_ID, databaseId: config.DATABASE_ENV });
const bucketStorage = new Storage({ projectId: config.PROJECT_ID });

// storages
const userDataStorage = new users.UserDataStorage(firestore);

// services
const userService = new users.UserService(userDataStorage);
const depositService = new deposits.DepositService(
  firestore,
  bucketStorage,
  config.RESEND_API_KEY as string
);
const tokenManager = new users.JwtTokenManager();
const BaseWalletService = new WalletService(CHAIN_CONFIGS);

// http
const server = http.createServer();
http.setupUserRoutes(server, userService, tokenManager);
http.setupDepositRoutes(server, depositService, userService);
http.setupWalletRoutes(server, { walletService: BaseWalletService, userService });
console.log("Server configured with user services");

export default server;
