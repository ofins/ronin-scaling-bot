import { sendMessage, sendSwapSuccess } from "../services/telegramService";
import { TokenService, TokenType } from "../services/tokenService";
import { WalletService } from "../services/walletService";
import { SwapResult } from "../types";
import { createLogger } from "../utils/logger";
import { limitOrderTrigger, SwapActionType } from "../utils/trade";

const logger = createLogger();
const MAX_ATTEMPTS = 2;
const SLIPPAGE = 0.5;

export async function simpleLimitAlgo(
  token: TokenType,
  tokenPrice: number,
  wallet: WalletService,
  tokenService: TokenService
) {
  const swapAction = limitOrderTrigger(
    tokenPrice,
    token.nextBuy,
    token.nextSell
  );

  if (swapAction === SwapActionType.HOLD) {
    logger.info(`${token.ticker}: Hold`);
    return;
  }

  await executeSwap(swapAction, token, tokenPrice, wallet);
  updateTokenStatus(token, tokenService);
}

async function executeSwap(
  swapAction: SwapActionType,
  token: TokenType,
  tokenPrice: number,
  wallet: WalletService
): Promise<boolean> {
  const actionConfig = {
    [SwapActionType.BUY]: {
      message: `${token.ticker}: 🔺 amount ${token.swapAmountInToken} BUY @ ${tokenPrice}`,
      swapFunction: () =>
        wallet.swapExactRonForToken(
          token.address,
          token.swapAmountInToken,
          SLIPPAGE
        ),
    },
    [SwapActionType.SELL]: {
      message: `${token.ticker}: 🔻 Sell amount ${token.swapAmountInToken} @ ${tokenPrice}`,
      swapFunction: () =>
        wallet.swapExactTokensForRon(
          token.address,
          token.swapAmountInToken,
          SLIPPAGE
        ),
    },
  };

  const config = actionConfig[swapAction as keyof typeof actionConfig];
  logger.info(config.message);
  sendMessage(config.message);

  let isSuccessful = false;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const result = await config.swapFunction();

    if (result.success) {
      isSuccessful = true;
      sendSwapSuccess(result as SwapResult);
      break;
    }
  }

  if (!isSuccessful) {
    const errorMessage = `Failed to swap ${token.ticker} after ${MAX_ATTEMPTS} attempts`;
    logger.error(errorMessage);
    sendMessage(errorMessage);
  }

  return isSuccessful;
}

function updateTokenStatus(token: TokenType, tokenService: TokenService): void {
  const updatedToken = tokenService.updateSingleToken(token.id, {
    ...token,
    isActive: false,
  });

  logger.info(
    `${updatedToken?.ticker} - [NEW]: isActive: ${updatedToken.isActive}`
  );

  sendMessage(`${token.ticker}: Status: ${updatedToken.isActive}`);
}
