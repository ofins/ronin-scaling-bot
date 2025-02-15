import { sendMessage, sendSwapSuccess } from "../services/telegramService";
import { TokenType } from "../services/tokenService";
import { WalletService } from "../services/walletService";
import { SwapResult } from "../types";
import { createLogger } from "../utils/logger";
import { limitOrderTrigger } from "../utils/trade";

const logger = createLogger();

export async function simpleLimitAlgo(
  token: TokenType,
  tokenPrice: number,
  wallet: WalletService
  // tokenService: TokenService
) {
  const shouldSwap = limitOrderTrigger(
    tokenPrice,
    token.nextBuy,
    token.nextSell
  );

  if (shouldSwap === 1) {
    logger.info(
      `${token.ticker}: 🔺 amount ${token.swapAmountInToken} BUY @ ${tokenPrice}`
    );
    sendMessage(
      `${token.ticker}: 🔺 amount ${token.swapAmountInToken} BUY @ ${tokenPrice}`
    );
    const result = await wallet.swapExactRonForToken(
      token.address,
      token.swapAmountInToken,
      0.5
    );

    // const activeToken = tokenService.getSingleToken(token.address);

    sendSwapSuccess(result as SwapResult);
  } else if (shouldSwap === 2) {
    // const { initialToken } = await wallet.getInitialBalances(token.address);
    // const balanceToSwapInToken = Math.floor(Number(initialToken));

    logger.info(
      `${token.ticker}: 🔻 Sell amount ${token.swapAmountInToken} @ ${tokenPrice}`
    );
    sendMessage(
      `${token.ticker}: 🔻 Sell amount ${token.swapAmountInToken} @ ${tokenPrice}`
    );
    const result = await wallet.swapExactTokensForRon(
      token.address,
      token.swapAmountInToken,
      0.5
    );

    sendSwapSuccess(result);
  } else {
    logger.info(`${token.ticker}: Hold`);
  }
}
