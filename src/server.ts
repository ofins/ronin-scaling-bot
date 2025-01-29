import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import { ActiveTokenService } from "./services/addressService";
import { CoinGeckoService } from "./services/coinGeckoService";
import { TradingService } from "./services/tradingService";
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

const activeTokenService = new ActiveTokenService();
// Token address is initialized when server starts

app.post("/start", authenticateAPIKey, async (req, res) => {
  const { isStart } = req.body;
  const coinGeckoService = new CoinGeckoService();

  const network = "ronin";

  setInterval(async () => {
    const tokens = await activeTokenService.getActiveToken();
    if (!tokens || tokens.length === 0) {
      logger.error("No active trading addresses found.");
      return; // Exit or handle the case where no addresses are available
    }
    logger.info(JSON.stringify(tokens, null, 2));

    const data = await coinGeckoService.getMultiTokenPrice(
      tokens.map((a) => a.address),
      network
    );
    const prices = data.data.attributes.token_prices;
    logger.info(JSON.stringify(prices, null, 2));
    console.log("====================================");

    tokens.forEach((token) => {
      const tokenPrice = prices[token.address];
      if (!tokenPrice) {
        logger.error(
          `No price found for ${token.ticker}, address: ${token.address}`
        );
        return;
      }

      const trade = new TradingService();
      const shouldSwap = trade.checkShouldSwap(
        tokenPrice,
        token.nextBuy,
        token.nextSell
      );

      if (shouldSwap === 1) {
        logger.info(`Should buy ${token.ticker}`);
      } else if (shouldSwap === 2) {
        logger.info(`Should sell ${token.ticker}`);
      } else {
        logger.info(`Do nothing for ${token.ticker}`);
      }

      //   const tokenPriceInRon = tokenPrice.ron;
      //   const priceLevels = token.priceLevels;
    });
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

    await activeTokenService.updateTokens(addresses);
    res.status(200).json({ message: "Success", data: addresses });
  }
);

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});

app.post("/swap", authenticateAPIKey, async (req, res) => {
  const { tokenAddress, amount, slippage } = req.body;

  try {
    const trade = new TradingService();
    const result = await trade.swapExactRonForToken(
      tokenAddress,
      amount,
      slippage
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
});
