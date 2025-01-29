import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import { CoinGeckoService } from "./services/coinGeckoService";
import { WalletService } from "./services/walletService";
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

app.post("/start", authenticateAPIKey, async (req, res) => {
  const { isStart } = req.body;
  const coinGeckoService = new CoinGeckoService();
  const tokenAddresses = [
    "0xe514d9deb7966c8be0ca922de8a064264ea6bcd4",
    "0x97a9107c1793bc407d6f527b77e7fff4d812bece",
  ];
  const network = "ronin";

  setInterval(async () => {
    const prices = await coinGeckoService.getMultiTokenPrice(
      tokenAddresses,
      network
    );
    logger.info(JSON.stringify(prices, null, 2));
    console.log("====================================");
  }, 3000);

  res.status(200).json({ message: "Success", data: "Started" });

  // run scanner
  // if criteria is matched, execute swap ron
});

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});

app.post("/swap", authenticateAPIKey, async (req, res) => {
  const { tokenAddress, amount, slippage } = req.body;

  try {
    const result = await swapExactRonForToken(tokenAddress, amount, slippage);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
});

async function swapExactRonForToken(
  tokenAddress: string,
  amount: number,
  slippage: number
) {
  try {
    const walletService = new WalletService(
      {
        privateKey: process.env.PRIVATE_KEY!,
        roninRpcUrl: process.env.RONIN_MAINNET_RPC!,
        routerAddress: process.env.ROUTER_ADDRESS!,
        wronAddress: process.env.WRON_ADDRESS!,
      },
      logger
    );

    const result = await walletService.swapExactRonForToken(
      tokenAddress,
      amount,
      slippage
    );
    return result;
  } catch (error) {
    logger.error(`Error processing swap: ${error}`);
    throw error;
  }
}
