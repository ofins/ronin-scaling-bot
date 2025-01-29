import { createLogger } from "winston";
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
      const walletService = new WalletService(
        {
          privateKey: process.env.PRIVATE_KEY!,
          roninRpcUrl: process.env.RONIN_MAINNET_RPC!,
          routerAddress: process.env.ROUTER_ADDRESS!,
          wronAddress: process.env.WRON_ADDRESS!,
        },
        logger
      );

      const result = await walletService.swapExactRonForToken(
        tokenAddress,
        amount,
        slippage
      );
      return result;
    } catch (error) {
      logger.error(`Error processing swap: ${error}`);
      throw error;
    }
  }

  //   swapExactTokenForRon
}
