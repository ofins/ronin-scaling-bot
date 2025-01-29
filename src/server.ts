import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { authenticateAPIKey } from "./middleware/auth";
import { tokensSchema } from "./schema/token";
import { swapSchema } from "./schema/trade";
import { ActiveTokenService } from "./services/activeTokenService";
import { CoinGeckoService } from "./services/coinGeckoService";
import { TradingService } from "./services/tradingService";
import { createLogger } from "./utils/logger";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const logger = createLogger();

app.use(helmet());
app.use(express.json());

// Token address is initialized when server starts
const activeTokenService = new ActiveTokenService();

// const fetchInterval = 60 * 4.7 * 1000; // 4.7 minutes
const fetchInterval = 3000;

app.post("/start", authenticateAPIKey, async (_req, res) => {
  const coinGeckoService = new CoinGeckoService();
  logger.info("Starting bot...");
  logger.info("Fetch interval: " + fetchInterval / 1000 + " seconds");

  const network = "ronin";

  setInterval(async () => {
    const tokens = activeTokenService.getActiveTokens();

    try {
      tokensSchema.parse(tokens);
    } catch (error) {
      logger.error("Invalid token schema");
      return;
    }

    if (!tokens || tokens.length === 0) {
      logger.warn("No active trading addresses found.");
      return; // Exit or handle the case where no addresses are available
    }
    // logger.info(JSON.stringify(tokens, null, 2));

    const data = await coinGeckoService.getMultiTokenPrice(
      tokens.map((a) => a.address),
      network
    );

    if (!data || !data.data.attributes.token_prices) {
      logger.error("No data found from CoinGecko.");
      return;
    }

    const prices = data.data.attributes.token_prices || {};
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
  }, fetchInterval);

  res.status(200).json({ message: "Success", data: "Started" });

  // run scanner
  // if criteria is matched, execute swap ron
});

app.get("/active-tokens", authenticateAPIKey, async (_req, res) => {
  const tokens = activeTokenService.getActiveTokens();
  res.status(200).json(tokens);
});

app.post("/add-active-token", authenticateAPIKey, async (req, res) => {
  const body = req.body;

  try {
    tokensSchema.parse(body);
  } catch (error) {
    res.status(400).json({ error: "Invalid schema" });
    return;
  }

  activeTokenService.addToken(body);
  const updatedTokens = activeTokenService.getAllTokens();

  if (JSON.stringify(updatedTokens) === JSON.stringify(body)) {
    logger.info("Token added successfully");
    res.status(200).json({ message: "Success", updatedTokens });
  } else {
    res.status(500).json({ error: "An error occurred" });
  }
});

app.post("/update-active-tokens", authenticateAPIKey, async (req, res) => {
  const body = req.body;

  try {
    tokensSchema.parse(body);
  } catch (error) {
    res.status(400).json({ error: "Invalid schema" });
    return;
  }

  activeTokenService.updateTokens(body);
  const updatedTokens = activeTokenService.getAllTokens();

  if (JSON.stringify(updatedTokens) === JSON.stringify(body)) {
    logger.info("Tokens updated successfully");
    res.status(200).json({ message: "Success", updatedTokens });
  } else {
    res.status(500).json({ error: "An error occurred" });
  }
});

app.post("/swap", authenticateAPIKey, async (req, res) => {
  const { tokenAddress, amount, slippage, direction } = req.body;

  try {
    swapSchema.parse(req.body);
  } catch (error) {
    res.status(400).json({ error: "Invalid schema" });
    return;
  }

  try {
    const trade = new TradingService();

    if (direction === 1) {
      const result = await trade.swapExactRonForToken(
        tokenAddress,
        amount,
        slippage
      );
      res.status(200).json(result);
    } else if (direction === 2) {
      const result = await trade.swapTokensForExactRon(
        tokenAddress,
        amount,
        slippage
      );
      res.status(200).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: "An error occurred during swap" });
  }
});

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
