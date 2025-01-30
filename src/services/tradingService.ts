import { walletConfig } from "../config/wallet";
import { createLogger } from "../utils/logger";
import { sendMessage } from "./telegramService";
import { WalletService } from "./walletService";

const logger = createLogger();

export class TradingService {
  public checkShouldSwap(
    tokenPrice: number,
    nextBuy: number,
    nextSell: number
  ) {
    if (tokenPrice <= nextSell) {
      return 2; //sell
    } else if (tokenPrice >= nextBuy) {
      return 1; //buy
    }
    return 0; //do nothing
  }

  public async swapExactRonForToken(
    tokenAddress: string,
    amount: number,
    slippage: number
  ) {
    try {
      const walletService = new WalletService(walletConfig, logger);

      const result = await walletService.swapExactRonForToken(
        tokenAddress,
        amount,
        slippage
      );
      return result;
    } catch (error) {
      logger.error(`Error processing swap: ${error}`);
      sendMessage(`Error during swap: ${error}`);
      throw error;
    }
  }

  public async swapTokensForExactRon(
    tokenAddress: string,
    amount: number,
    slippage: number
  ) {
    try {
      const walletService = new WalletService(walletConfig, logger);

      const result = await walletService.swapTokensForExactRon(
        tokenAddress,
        amount,
        slippage
      );
      return result;
    } catch (error) {
      logger.error(`Error processing swap: ${error}`);
      sendMessage(`Error during swap: ${error}`);
      throw error;
    }
  }

  public async swapRONForExactTokens(
    tokenAddress: string,
    amount: number,
    slippage: number
  ) {
    try {
      const walletService = new WalletService(walletConfig, logger);

      const result = await walletService.swapRONForExactTokens(
        tokenAddress,
        amount,
        slippage
      );
      return result;
    } catch (error) {
      logger.error(`Error processing swap: ${error}`);
      sendMessage(`Error during swap: ${error}`);
      throw error;
    }
  }

  public async swapExactTokensForRon(
    tokenAddress: string,
    amount: number,
    slippage: number
  ) {
    try {
      const walletService = new WalletService(walletConfig, logger);

      const result = await walletService.swapExactTokensForRon(
        tokenAddress,
        amount,
        slippage
      );
      return result;
    } catch (error) {
      logger.error(`Error processing swap: ${error}`);
      sendMessage(`Error during swap: ${error}`);
      throw error;
    }
  }
}
