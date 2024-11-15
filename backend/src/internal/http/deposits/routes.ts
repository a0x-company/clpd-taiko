import { Express, Router } from "express";
import multer from "multer";
import { JwtTokenManager } from "@internal/users/token-manager";

// services
import { DepositService } from "@internal/deposits";
import { UserService } from "@internal/users";

// handlers
import { approveRejectDepositHandler } from "./approve-reject-deposit-handler";
import { getDepositsByStatusHandler } from "./get-deposits-handler";
import { mintDepositsHandler } from "./mint-deposits-handler";
import { registerDepositHandler } from "./register-deposit-handler";
import { uploadProofOfDepositHandler } from "./upload-proof-of-deposit-handler";
import { renderApprovalFormHandler } from "./render-approval-form-handler";
import { addApprovalMemberHandler } from "./add-approval-member-handler";
import { registerBurnRequestHandler } from "./register-burn-request-handler";
import { uploadBurnProofHandler } from "./upload-burn-proof-handler";
import { approveRejectBurnRequestHandler } from "./approve-reject-burn-request-handler";
import { getBurnRequestsByStatusHandler } from "./get-burn-requests-handler";

// middleware
import { AuthMiddleware } from "@internal/http/middlewares/authentication";
import { PasskeyAuthMiddleware } from "@internal/http/middlewares/passkey-authentication";

const upload = multer({ storage: multer.memoryStorage() });
const tokenManager = new JwtTokenManager();

export function setupDepositRoutes(
  router: Express,
  depositService: DepositService,
  userService: UserService
) {
  const depositRouter = Router();
  
  // Rutas que requieren ambos middlewares (Passkey + JWT)
  depositRouter.post("/",
    AuthMiddleware(userService, tokenManager),
    registerDepositHandler(depositService)
  );
  
  depositRouter.post("/burn", 
    AuthMiddleware(userService, tokenManager),
    PasskeyAuthMiddleware(userService),
    registerBurnRequestHandler(depositService)
  );

  // Rutas que solo requieren JWT
  depositRouter.post("/:depositId/proof", 
    AuthMiddleware(userService, tokenManager), 
    upload.single('proofImage'), 
    uploadProofOfDepositHandler(depositService)
  );
  
  depositRouter.get("/status/:status", 
    AuthMiddleware(userService, tokenManager), 
    getDepositsByStatusHandler(depositService)
  );
  
  depositRouter.post("/burn/:burnRequestId/proof", 
    AuthMiddleware(userService, tokenManager), 
    upload.single('proofImage'), 
    uploadBurnProofHandler(depositService)
  );
  
  depositRouter.post("/burn/:burnRequestId/approve-reject", 
    AuthMiddleware(userService, tokenManager), 
    approveRejectBurnRequestHandler(depositService)
  );
  
  depositRouter.get("/burn/status/:status", 
    AuthMiddleware(userService, tokenManager), 
    getBurnRequestsByStatusHandler(depositService)
  );

  // Rutas públicas (sin middleware)
  depositRouter.get("/approval-form/:depositId/:token", renderApprovalFormHandler(depositService));
  depositRouter.post("/:depositId/approve-reject/:token", approveRejectDepositHandler(depositService));
  depositRouter.post("/mint", mintDepositsHandler(depositService));
  depositRouter.post("/add-approval-member", addApprovalMemberHandler(depositService));

  router.use("/deposits", depositRouter);
  console.log("✅ Rutas de depósitos configuradas");
}