import express, { Router } from "express";
import { TokenController } from "../controller/tokenController";
import { authenticateAPIKey } from "../middleware/auth";
import { TokenService } from "../services/tokenService";

function tokensRoutes(tokenService: TokenService): Router {
  const router = express.Router();
  const controller = new TokenController(tokenService);

  router.get("/active", authenticateAPIKey, controller.getActiveTokens);
  router.post("/add-token", authenticateAPIKey, controller.addToken);
  router.post("/update-token", authenticateAPIKey, controller.updateTokens);
  router.post("/toggle-token", authenticateAPIKey, controller.toggleToken);
  router.get("/balance", authenticateAPIKey, controller.getWalletBalance);

  return router;
}

export default tokensRoutes;
