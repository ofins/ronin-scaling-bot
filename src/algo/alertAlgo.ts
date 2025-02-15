import { sendMessage } from "../services/telegramService";
import { TokenType } from "../services/tokenService";
import { createLogger } from "../utils/logger";

const logger = createLogger();

export async function alertAlgo(token: TokenType, tokenPrice: number) {
  const buyPriceDiff = Math.abs(tokenPrice - token.nextBuy) / tokenPrice;
  const sellPriceDiff = Math.abs(tokenPrice - token.nextSell) / tokenPrice;

  const shouldAlert = buyPriceDiff < 0.05 || sellPriceDiff < 0.05;

  if (shouldAlert) {
    logger.info(`🚨 ${token.ticker} is around the price of $${tokenPrice}`);
    sendMessage(`🚨 ${token.ticker} is around the price of $${tokenPrice}`);
  }
}
