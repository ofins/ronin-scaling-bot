import express from "express";
import { walletConfig } from "../config/wallet";
import { authenticateAPIKey } from "../middleware/auth";
import { swapSchema } from "../schema/trade";
import { sendSwapSuccess } from "../services/telegramService";
import { WalletService } from "../services/walletService";
import { SwapResult } from "../types";
import { createLogger } from "../utils/logger";

const logger = createLogger();
const router = express.Router();

router.post("/swap", authenticateAPIKey, async (req, res) => {
  const { tokenAddress, amount, slippage, direction } = req.body;

  try {
    swapSchema.parse(req.body);
  } catch (error) {
    res.status(400).json({ error: "Invalid schema" });
    return;
  }

  const wallet = new WalletService(walletConfig, logger);

  try {
    if (direction === 1) {
      const result = await wallet.swapRONForExactTokens(
        tokenAddress,
        amount,
        slippage
      );
      res.status(200).json(result);
      sendSwapSuccess(result as SwapResult);
      logger.info(result);
    } else if (direction === 2) {
      const result = await wallet.swapExactTokensForRon(
        tokenAddress,
        amount,
        slippage
      );

      res.status(200).json(result);
      sendSwapSuccess(result);
    }
  } catch (error) {
    res.status(500).json({ error: "An error occurred during swap" });
  }
});

export default router;
