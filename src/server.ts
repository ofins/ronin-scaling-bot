import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import { ActiveTokenService } from "./services/activeTokenService";
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
    const tokens = activeTokenService.getActiveTokens();
    if (!tokens || tokens.length === 0) {
      logger.error("No active trading addresses found.");
      return; // Exit or handle the case where no addresses are available
    }
    // logger.info(JSON.stringify(tokens, null, 2));

    const data = await coinGeckoService.getMultiTokenPrice(
      tokens.map((a) => a.address),
      network
    );
    const prices = data.data.attributes.token_prices;
    // logger.info(JSON.stringify(prices, null, 2));

    tokens.forEach(async (token) => {
      const tokenPrice = prices[token.address];
      if (!tokenPrice) {
        logger.error(
          `No price found for ${token.ticker}, address: ${token.address}`
        );
        return;
      }

      if (!token.isActive) {
        return;
      }

      const trade = new TradingService();
      const shouldSwap = trade.checkShouldSwap(
        tokenPrice,
        token.nextBuy,
        token.nextSell
      );

      if (shouldSwap === 1) {
        logger.info(`${token.ticker}: 🔺 BUY @ ${tokenPrice}`);
        await trade.swapExactRonForToken(
          token.address,
          token.swapInRonAmount,
          0.5
        );

        const nextBuyIndex = token.priceLevels.indexOf(token.nextBuy);
        token.nextBuy = token.priceLevels[nextBuyIndex + 1];
        token.nextSell = token.priceLevels[nextBuyIndex - 1];

        // check
        const activeToken = activeTokenService.getSingleToken(token.address);
        logger.info(JSON.stringify(activeToken));
      } else if (shouldSwap === 2) {
        logger.info(`${token.ticker}: 🔻 Sell @ ${tokenPrice}`);
        await trade.swapTokensForExactRon(
          token.address,
          token.swapInRonAmount,
          0.5
        );

        const nextSellIndex = token.priceLevels.indexOf(token.nextSell);
        token.nextSell = token.priceLevels[nextSellIndex - 1];
        token.nextBuy = token.priceLevels[nextSellIndex + 1];

        const activeToken = activeTokenService.getSingleToken(token.address);
        logger.info(JSON.stringify(activeToken));
      } else {
        logger.info(`${token.ticker}: Hold`);
      }

      //   const tokenPriceInRon = tokenPrice.ron;
      //   const priceLevels = token.priceLevels;
    });
  }, 30000);

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

app.post("/swap", authenticateAPIKey, async (req, res) => {
  const { tokenAddress, amount, slippage, direction } = req.body;

  try {
    const trade = new TradingService();

    if (direction === "ron-to-token") {
      const result = await trade.swapExactRonForToken(
        tokenAddress,
        amount,
        slippage
      );
      res.status(200).json(result);
    } else if (direction === "token-to-ron") {
      const result = await trade.swapTokensForExactRon(
        tokenAddress,
        amount,
        slippage
      );
      res.status(200).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
});

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
