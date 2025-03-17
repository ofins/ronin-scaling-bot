import { sendMessage, sendSwapSuccess } from "../services/telegramService";
import { TokenService, TokenType } from "../services/tokenService";
import { WalletService } from "../services/walletService";
import { SwapResult } from "../types";
import { createLogger } from "../utils/logger";
import { limitOrderTrigger } from "../utils/trade";

const logger = createLogger();
const MAX_ATTEMPTS = 1;

export async function simpleLimitAlgo(
  token: TokenType,
  tokenPrice: number,
  wallet: WalletService,
  tokenService: TokenService
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

    let isSuccessful = false;
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const result = await wallet.swapExactRonForToken(
        token.address,
        token.swapAmountInToken,
        0.5
      );

      if (result.success) {
        isSuccessful = true;
        sendSwapSuccess(result as SwapResult);
        break;
      }
    }

    if (!isSuccessful) {
      logger.error(
        `Failed to swap ${token.ticker} after ${MAX_ATTEMPTS} attempts`
      );
      sendMessage(
        `Failed to swap ${token.ticker} after ${MAX_ATTEMPTS} attempts`
      );
    }

    const updatedToken = tokenService.updateSingleToken(token.id, {
      ...token,
      isActive: false,
    });

    logger.info(
      `${updatedToken?.ticker} - [NEW]: isActive: ${updatedToken.isActive}`
    );
    sendMessage(`${token.ticker}: Status: ${updatedToken.isActive}`);
  } else if (shouldSwap === 2) {
    // const { initialToken } = await wallet.getInitialBalances(token.address);
    // const balanceToSwapInToken = Math.floor(Number(initialToken));

    logger.info(
      `${token.ticker}: 🔻 Sell amount ${token.swapAmountInToken} @ ${tokenPrice}`
    );
    sendMessage(
      `${token.ticker}: 🔻 Sell amount ${token.swapAmountInToken} @ ${tokenPrice}`
    );

    let isSuccessful = false;
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const result = await wallet.swapExactTokensForRon(
        token.address,
        token.swapAmountInToken,
        0.5
      );

      if (result.success) {
        isSuccessful = true;
        sendSwapSuccess(result);
        break;
      }
    }

    if (!isSuccessful) {
      logger.error(
        `Failed to swap ${token.ticker} after ${MAX_ATTEMPTS} attempts`
      );
      sendMessage(
        `Failed to swap ${token.ticker} after ${MAX_ATTEMPTS} attempts`
      );
    }

    const updatedToken = tokenService.updateSingleToken(token.id, {
      ...token,
      isActive: false,
    });

    logger.info(
      `${updatedToken?.ticker} - [NEW]: isActive: ${updatedToken.isActive}`
    );
    sendMessage(`${token.ticker}: Status: ${updatedToken.isActive}`);
  } else {
    logger.info(`${token.ticker}: Hold`);
  }
}
