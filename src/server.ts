import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import { createLogger } from "./utils/logger";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const logger = createLogger();

const authenticateAPIKey = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const providedKey = req.header("x-api-key");

  if (!providedKey) {
    res.status(401).json({ error: "Invalid." });
    return;
  }

  if (providedKey !== API_KEY) {
    res.status(403).json({ error: "Invalid." });
    return;
  }

  next();
};

app.use(express.json());

app.post("/swap", authenticateAPIKey, async (req, res) => {
  const { tokenAddress, amount, slippage } = req.body;

  console.log("swap");

  return;

  //   try {
  //     const walletService = new WalletService(
  //       {
  //         privateKey: process.env.PRIVATE_KEY!,
  //         roninRpcUrl: process.env.RONIN_MAINNET_RPC!,
  //         routerAddress: process.env.ROUTER_ADDRESS!,
  //         wronAddress: process.env.WRON_ADDRESS!,
  //       },
  //       logger
  //     );

  //     const result = await walletService.swapExactRonForToken(
  //       tokenAddress,
  //       amount,
  //       slippage
  //     );
  //     res.json(result);
  //   } catch (error) {
  //     logger.error(`Error processing swap: ${error}`);
  //     res.status(500).json({
  //       success: false,
  //       error: error instanceof Error ? error.message : "Unknown error",
  //     });
  //   }
});

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
