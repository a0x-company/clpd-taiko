import { Express, Router } from "express";
import { JwtTokenManager, UserService } from "@internal/users";
import { registerHandler } from "./register-handler";
import { verifySixCharactersHandler } from "./verify-six-characters-handler";
import { initiatePasskeyRegistrationHandler } from "./initiate-passkey-registration-handler";
import { completePasskeyRegistrationHandler } from "./complete-passkey-registration-handler";
import { loginHandler } from "./login-handler";
import { completeLoginHandler } from "./complete-login-handler";
import { AuthMiddleware } from "../middlewares/authentication";
import { resendSixCharactersHandler } from "./resend-six-characters-handler";
import { createContactHandler } from "./create-contact-handler";

export function setupUserRoutes(
  router: Express,
  userService: UserService,
  tokenManager: JwtTokenManager
) {
  const userRouter = Router();

  userRouter.post("/register", registerHandler(userService));
  userRouter.post("/verify", verifySixCharactersHandler(userService));
  userRouter.post("/passkey/start", initiatePasskeyRegistrationHandler(userService));
  userRouter.post("/passkey/complete", completePasskeyRegistrationHandler(userService));
  userRouter.post("/login", AuthMiddleware(userService, tokenManager), loginHandler(userService));
  userRouter.post("/login/complete", completeLoginHandler(userService));
  userRouter.post("/verify/resend", resendSixCharactersHandler(userService));
  userRouter.post(
    "/contact",
    AuthMiddleware(userService, tokenManager),
    createContactHandler(userService)
  );
  router.use("/users", userRouter);
  console.log("User routes set up");
}
