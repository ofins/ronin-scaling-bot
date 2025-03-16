import express from "express";
import { alertAlgo } from "../algo/alertAlgo";
import { scalingUpDownAlgo } from "../algo/scalingUpAlgo";
import { simpleLimitAlgo } from "../algo/simpleLimitAlgo";
import { walletConfig } from "../config/wallet";
import { CoinGeckoNetworkEnum } from "../enums/network";
import { authenticateAPIKey } from "../middleware/auth";
import { tokensSchema } from "../schema/token";
import { CoinGeckoService } from "../services/coinGeckoService";
import { sendMessage, sendSwapSuccess } from "../services/telegramService";
import { TokenService } from "../services/tokenService";
import { WalletService } from "../services/walletService";
import { SwapResult } from "../types";
import { createLogger } from "../utils/logger";
import { AlgoEnumType, scalingOutAlgo } from "../utils/trade";

const router = express.Router();
const logger = createLogger();
const wallet = new WalletService(walletConfig, logger);

const fetchInterval = 60000 * 4.7;
let botInterval: NodeJS.Timeout | null = null; // Store the interval ID

router.get("/", (_req, res) => {
  res.send("Hello Roner!");
});

function systemRoutes(tokenService: TokenService) {
  router.get("/health", (_req, res) => {
    const botStatus = botInterval ? "active" : "inactive"; // Check if interval is active
    const intervalId = botInterval ? "Not None" : "None"; // Get the ID of the interval (or "None")
    res.status(200).json({
      status: "ok",
      uptime: `${(process.uptime() / 86400).toFixed(5)} days`,
      botStatus,
      intervalId,
    });
  });

  router.post("/start", authenticateAPIKey, async (_req, res) => {
    if (botInterval) {
      res.status(400).json({ message: "Bot is already running" });
      return;
    }

    const coinGeckoService = new CoinGeckoService();
    logger.info("Starting bot...");
    logger.info("Fetch interval: " + fetchInterval / 1000 + " seconds");

    botInterval = setInterval(async () => {
      const tokens = tokenService.getActiveTokens();

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

      const data = await coinGeckoService.getMultiTokenPrice(
        tokens.map((a) => a.address),
        CoinGeckoNetworkEnum.RON
      );

      if (!data || !data.data.attributes.token_prices) {
        logger.error("No data found from CoinGecko.");
        return;
      }

      const prices = data.data.attributes.token_prices || {};

      // make all keys lowercase
      const lowerCasePrices = Object.keys(prices).reduce((acc: any, key) => {
        acc[key.toLowerCase()] = prices[key];
        return acc;
      }, {});

      // execute proper async/await logic here
      for (const token of tokens) {
        const tokenPrice = lowerCasePrices[token.address.toLowerCase()];
        if (!tokenPrice) {
          logger.error(
            `No price found for ${token.ticker}, address: ${token.address}`
          );
          return;
        }

        if (
          !token.isActive ||
          token.nextBuy === undefined ||
          token.nextSell === undefined
        ) {
          logger.error(
            `Token ${token.ticker} is not active or nextBuy/nextSell is not set`
          );
          sendMessage(
            `Token ${token.ticker} is not active or nextBuy/nextSell is not set`
          );
          return;
        }

        // swapping RON for USDC
        if (token.ticker === "RON") {
          const shouldSwap = scalingOutAlgo(tokenPrice, token.nextSell);

          if (shouldSwap === 2) {
            logger.info(`${token.ticker}: 🔻 Sell @ ${tokenPrice}`);
            sendMessage(`${token.ticker}: 🔻 Sell @ ${tokenPrice}`);
            const result = await wallet.swapRONForExactTokens(
              "0x0b7007c13325c48911f73a2dad5fa5dcbf808adc", //USDC contract
              token.swapAmountInToken,
              0.5
            );

            const activeToken = tokenService.getSingleToken(token.address);
            logger.info(
              `${activeToken?.ticker} - [PREV]: nextBuy: nextSell: ${activeToken?.nextSell}`
            );

            const nextSellIndex = token.priceLevels.indexOf(token.nextSell);
            token.nextSell = token.priceLevels[nextSellIndex + 1];

            logger.info(
              `${activeToken?.ticker} - [NEW]: nextBuy: nextSell: ${activeToken?.nextSell}`
            );
            sendSwapSuccess(result as SwapResult);
            sendMessage(`${token.ticker}: Next Sell: ${token.nextSell}`);
          } else {
            logger.info(`${token.ticker}: Hold`);
          }
          continue;
        }

        // Algo selection
        if (token.algoType === AlgoEnumType.AlertAlgo) {
          await alertAlgo(token, tokenPrice);
        }

        if (token.algoType === AlgoEnumType.ScalingUpDownAlgo) {
          await scalingUpDownAlgo(token, tokenPrice, wallet, tokenService);
        }

        if (token.algoType === AlgoEnumType.SimpleLimitAlgo) {
          await simpleLimitAlgo(token, tokenPrice, wallet, tokenService);
        }
      }
    }, fetchInterval);
    res.status(200).json({ message: "Bot started" });
  });

  router.post("/stop", authenticateAPIKey, async (_req, res) => {
    if (botInterval) {
      clearInterval(botInterval);
      botInterval = null;
      logger.info("Bot stopped");
      res.status(200).json({ message: "Bot stopped" });
    } else {
      res.status(400).json({ message: "Bot is not running" });
    }
  });

  return router;
}

export default systemRoutes;
