import { sendMessage, sendSwapSuccess } from "../services/telegramService";
import { TokenService, TokenType } from "../services/tokenService";
import { WalletService } from "../services/walletService";
import { SwapResult } from "../types";
import { createLogger } from "../utils/logger";
import { limitOrderTrigger } from "../utils/trade";

const logger = createLogger();

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
    const result = await wallet.swapExactRonForToken(
      token.address,
      token.swapAmountInToken,
      0.5
    );

    sendSwapSuccess(result as SwapResult);
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
    const result = await wallet.swapExactTokensForRon(
      token.address,
      token.swapAmountInToken,
      0.5
    );

    sendSwapSuccess(result);
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
