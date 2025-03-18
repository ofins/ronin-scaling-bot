import { sendMessage, sendSwapSuccess } from "../services/telegramService";
import { TokenService, TokenType } from "../services/tokenService";
import { WalletService } from "../services/walletService";
import { SwapResult } from "../types";
import { createLogger } from "../utils/logger";
import { stopOrderTrigger, SwapActionType } from "../utils/trade";

const logger = createLogger();

export async function scalingUpDownAlgo(
  token: TokenType,
  tokenPrice: number,
  wallet: WalletService,
  tokenService: TokenService
) {
  const shouldSwap = stopOrderTrigger(
    tokenPrice,
    token.nextBuy,
    token.nextSell
  );

  if (shouldSwap === SwapActionType.BUY) {
    logger.info(`${token.ticker}: 🔺 BUY @ ${tokenPrice}`);
    sendMessage(`${token.ticker}: 🔺 BUY @ ${tokenPrice}`);
    const result = await wallet.swapExactRonForToken(
      token.address,
      token.swapAmountInToken,
      0.5
    );

    const activeToken = tokenService.getSingleToken(token.address);
    logger.info(
      `${activeToken?.ticker} - [PREV]: nextBuy: nextSell: ${activeToken?.nextSell}, ${activeToken?.nextBuy}`
    );

    const nextBuyIndex = token.priceLevels.indexOf(token.nextBuy);
    token.nextBuy = token.priceLevels[nextBuyIndex + 1];
    token.nextSell = token.priceLevels[nextBuyIndex - 1];

    logger.info(
      `${activeToken?.ticker} - [NEW]: nextBuy: nextSell: ${activeToken?.nextSell}, ${activeToken?.nextBuy}`
    );
    sendSwapSuccess(result as SwapResult);
    sendMessage(
      `${token.ticker}: Next Buy: ${token.nextBuy}, Next Sell: ${token.nextSell}`
    );
    return true;
  } else if (shouldSwap === SwapActionType.SELL) {
    // const { initialToken } = await wallet.getInitialBalances(token.address);

    // const balanceToSwapInToken = Math.floor(Number(initialToken));

    logger.info(`${token.ticker}: 🔻 Sell @ ${tokenPrice}`);
    sendMessage(`${token.ticker}: 🔻 Sell @ ${tokenPrice}`);
    const result = await wallet.swapExactTokensForRon(
      token.address,
      token.swapAmountInToken,
      0.5
    );

    const activeToken = tokenService.getSingleToken(token.address);
    logger.info(
      `${activeToken?.ticker} - [PREV]: nextBuy: nextSell: ${activeToken?.nextSell}, ${activeToken?.nextBuy}`
    );

    const nextSellIndex = token.priceLevels.indexOf(token.nextSell);
    token.nextSell = token.priceLevels[nextSellIndex - 1];
    token.nextBuy = token.priceLevels[nextSellIndex + 1];

    logger.info(
      `${activeToken?.ticker} - [NEW]: nextBuy: nextSell: ${activeToken?.nextSell}, ${activeToken?.nextBuy}`
    );
    sendSwapSuccess(result);
    sendMessage(
      `${token.ticker}: Next Buy: ${token.nextBuy}, Next Sell: ${token.nextSell}`
    );
    return true;
  } else {
    logger.info(`${token.ticker}: Hold`);
    return false;
  }
}
