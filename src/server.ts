import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import { AddressService } from "./services/addressService";
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

const addressService = new AddressService();
// Token address is initialized when server starts

app.post("/start", authenticateAPIKey, async (req, res) => {
  const { isStart } = req.body;
  const coinGeckoService = new CoinGeckoService();

  const network = "ronin";

  setInterval(async () => {
    const tokenAddresses = await addressService.getActiveTradingAddresses();
    if (!tokenAddresses || tokenAddresses.length === 0) {
      logger.error("No active trading addresses found.");
      return; // Exit or handle the case where no addresses are available
    }
    logger.info(tokenAddresses);

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

app.post(
  "/addresses/update-addresses",
  authenticateAPIKey,
  async (req, res) => {
    const { addresses } = req.body;

    await addressService.updateAddresses(addresses);
    res.status(200).json({ message: "Success", data: addresses });
  }
);

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
