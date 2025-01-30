import { ethers } from "ethers";
import { Logger } from "winston";
import { ERC20_ABI, ROUTER_ABI } from "../config/routerAbi";
import { SwapResult, TokenSwapConfig } from "../types";
import {
  calculateMaxInputWithSlippage,
  calculateMinOutputWithSlippage,
} from "../utils/wallet";
import { sendMessage } from "./telegramService";

export class WalletService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private logger: Logger;

  constructor(private config: TokenSwapConfig, logger: Logger) {
    this.provider = new ethers.JsonRpcProvider(config.roninRpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    this.logger = logger;
  }

  public async getWalletBalance(): Promise<string> {
    return ethers.formatEther(
      await this.provider.getBalance(this.wallet.address)
    );
  }

  private async getTokenBalance(
    tokenAddress: string,
    walletAddress: string
  ): Promise<string> {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      this.provider
    );
    const balance = await tokenContract.balanceOf(walletAddress);
    const decimals = await tokenContract.decimals();
    return ethers.formatUnits(balance, decimals);
  }

  private async getTokenSymbol(tokenAddress: string): Promise<string> {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      this.provider
    );
    return await tokenContract.symbol();
  }

  private async getTokenDecimals(tokenAddress: string): Promise<number> {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      this.provider
    );
    return await tokenContract.decimals();
  }

  private async getInitialBalances(tokenAddress: string) {
    const initialRon = ethers.formatEther(
      await this.provider.getBalance(this.wallet.address)
    );
    const initialToken = await this.getTokenBalance(
      tokenAddress,
      this.wallet.address
    );
    const tokenSymbol = await this.getTokenSymbol(tokenAddress);

    this.logger.info(`Initial RON balance: ${initialRon} RON`);
    this.logger.info(
      `Initial ${tokenSymbol} balance: ${initialToken} ${tokenSymbol}`
    );

    return {
      initialRon,
      initialToken,
      tokenSymbol,
    };
  }

  private async processReceipt(
    receipt: ethers.TransactionReceipt,
    tokenAddress: string
  ) {
    if (!receipt || receipt.status !== 1) {
      return { success: false, message: "Invalid receipt" };
    }

    const gasUsed = ethers.formatEther(
      BigInt(receipt.gasUsed) * BigInt(receipt.gasPrice)
    );

    const finalRon = ethers.formatEther(
      await this.provider.getBalance(this.wallet.address)
    );

    const finalToken = await this.getTokenBalance(
      tokenAddress,
      this.wallet.address
    );

    this.logger.info(`✅ Success!`);
    this.logger.info(`⛽ Gas used: ${gasUsed} RON`);
    this.logger.info(`💰 Final RON balance: ${finalRon} RON`);
    this.logger.info(`🔄 Final Token balance: ${finalToken} WRON`);
    console.log("====================================");

    return {
      success: true,
      gasUsed,
      finalRon,
      finalToken,
    };
  }

  async swapTokensForExactRon(
    tokenAddress: string,
    amountRonOut: number,
    slippage: number = 0.5
  ): Promise<SwapResult> {
    try {
      const { initialRon, initialToken, tokenSymbol } =
        await this.getInitialBalances(tokenAddress);

      const routerContract = new ethers.Contract(
        this.config.routerAddress,
        ROUTER_ABI,
        this.wallet
      );

      const amountRonOutWei = ethers.parseEther(amountRonOut.toString());
      const path = [tokenAddress, this.config.wronAddress];
      const amounts = await routerContract.getAmountsIn(amountRonOutWei, path);
      const tokenDecimals = await this.getTokenDecimals(tokenAddress);
      const requiredTokens = ethers.formatUnits(amounts[0], tokenDecimals);

      this.logger.info(
        `Required ${tokenSymbol} input: ${requiredTokens} ${tokenSymbol} to get ${amountRonOut} RON`
      );

      // Calculate maximum input with slippage tolerance
      const maxTokensIn = calculateMaxInputWithSlippage(amounts[0], slippage);
      const deadline = Math.floor(Date.now() / 1000) + 1200;

      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        this.wallet
      );

      const approvalTx = await tokenContract.approve(
        this.config.routerAddress,
        maxTokensIn
      );
      await approvalTx.wait();
      this.logger.info("Token approval confirmed");

      // Build and send transaction
      const tx = await routerContract.swapTokensForExactRON(
        amountRonOutWei, // The exact amount of RON you want to receive
        maxTokensIn, // Maximum amount of tokens you're willing to spend
        path, // Trading path
        this.wallet.address, // Recipient
        deadline, // Transaction deadline
        {
          gasLimit: 500000,
        }
      );

      this.logger.info(`Transaction sent: ${tx.hash}`);
      this.logger.info("Waiting for transaction to complete...");

      const receipt = await tx.wait();

      const { success, gasUsed, finalRon, finalToken } =
        await this.processReceipt(receipt, tokenAddress);

      if (success) {
        return {
          success,
          txHash: tx.hash,
          gasUsed: gasUsed,
          initialBalance: {
            ron: initialRon,
            token: initialToken,
          },
          finalBalance: {
            ron: finalRon || "",
            token: finalToken || "",
          },
        };
      }

      return {
        success: false,
        error: "Transaction failed",
      };
    } catch (error) {
      this.logger.error(`Error during swap: ${error}`);
      sendMessage(`Error during swap: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async swapExactRonForToken(
    tokenAddress: string,
    amountRon: number,
    slippage: number = 0.5
  ): Promise<SwapResult> {
    try {
      const { initialRon, initialToken, tokenSymbol } =
        await this.getInitialBalances(tokenAddress);

      const routerContract = new ethers.Contract(
        this.config.routerAddress,
        ROUTER_ABI,
        this.wallet
      );

      const amountRonWei = ethers.parseEther(amountRon.toString());
      this.logger.info(
        `Swapping ${amountRon} RON (${amountRonWei.toString()} Wei) for ${tokenSymbol}...`
      );

      const path = [this.config.wronAddress, tokenAddress];
      const amounts = await routerContract.getAmountsOut(amountRonWei, path);
      const expectedTokens = ethers.formatEther(amounts[1]);
      const minTokens = calculateMinOutputWithSlippage(amounts[1], slippage);
      const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 mins

      this.logger.info(
        `Expected ${tokenSymbol} output: ${expectedTokens} ${tokenSymbol}`
      );

      const tx = await routerContract.swapRONForExactTokens(
        minTokens,
        path,
        this.wallet.address,
        deadline,
        {
          value: amountRonWei,
          gasLimit: 500000,
        }
      );

      this.logger.info(`Transaction sent: ${tx.hash}`);
      this.logger.info("Waiting for transaction to complete...");

      const receipt = await tx.wait();

      const { success, gasUsed, finalRon, finalToken } =
        await this.processReceipt(receipt, tokenAddress);

      if (success) {
        return {
          success,
          txHash: tx.hash,
          gasUsed: gasUsed,
          initialBalance: {
            ron: initialRon,
            token: initialToken,
          },
          finalBalance: {
            ron: finalRon || "",
            token: finalToken || "",
          },
        };
      }

      return {
        success: false,
        error: "Transaction failed",
      };
    } catch (error) {
      this.logger.error(`Error during swap: ${error}`);
      sendMessage(`Error during swap: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async swapExactTokensForRon(
    tokenAddress: string,
    amountTokens: number,
    slippage: number = 0.5
  ) {
    try {
      const { initialRon, initialToken, tokenSymbol } =
        await this.getInitialBalances(tokenAddress);

      const routerContract = new ethers.Contract(
        this.config.routerAddress,
        ROUTER_ABI,
        this.wallet
      );

      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        this.wallet
      );

      const amountTokensWei = ethers.parseUnits(
        amountTokens.toString(),
        await tokenContract.decimals()
      );
      this.logger.info(
        `Swapping ${amountTokens} ${tokenSymbol} (${amountTokensWei.toString()} Wei) for RON...`
      );

      const path = [tokenAddress, this.config.wronAddress];
      const amounts = await routerContract.getAmountsOut(amountTokensWei, path);
      const expectedRon = ethers.formatEther(amounts[1]);
      this.logger.info(`Expected RON output: ${expectedRon} RON`);

      const minRon = calculateMinOutputWithSlippage(amounts[1], slippage);
      const deadline = Math.floor(Date.now() / 1000) + 1200;

      const approvalTx = await tokenContract.approve(
        this.config.routerAddress,
        amountTokensWei
      );
      await approvalTx.wait();
      this.logger.info("Token approval confirmed");

      const tx = await routerContract.swapExactTokensForRON(
        amountTokensWei,
        minRon,
        path,
        this.wallet.address,
        deadline,
        {
          gasLimit: 500000,
        }
      );

      this.logger.info(`Transaction sent: ${tx.hash}`);
      this.logger.info("Waiting for transaction to complete...");

      const receipt = await tx.wait();

      const { success, gasUsed, finalRon, finalToken } =
        await this.processReceipt(receipt, tokenAddress);

      if (success) {
        return {
          success,
          txHash: tx.hash,
          gasUsed: gasUsed,
          initialBalance: {
            ron: initialRon,
            token: initialToken,
          },
          finalBalance: {
            ron: finalRon || "",
            token: finalToken || "",
          },
        };
      }

      return {
        success: false,
        error: "Transaction failed",
      };
    } catch (error) {
      this.logger.error(`Error during swap: ${error}`);
      sendMessage(`Error during swap: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async swapRONForExactTokens(
    tokenAddress: string,
    amountTokensOut: number,
    slippage: number = 0.5
  ) {
    try {
      const { initialRon, initialToken, tokenSymbol } =
        await this.getInitialBalances(tokenAddress);

      const routerContract = new ethers.Contract(
        this.config.routerAddress,
        ROUTER_ABI,
        this.wallet
      );

      // Convert desired token output to Wei
      const tokenDecimals = await this.getTokenDecimals(tokenAddress);
      const amountTokensOutWei = ethers.parseUnits(
        amountTokensOut.toString(),
        tokenDecimals
      );
      const path = [this.config.wronAddress, tokenAddress];
      const amounts = await routerContract.getAmountsIn(
        amountTokensOutWei,
        path
      );
      const requiredRon = ethers.formatEther(amounts[0]);

      this.logger.info(
        `Required RON input: ${requiredRon} RON to get ${amountTokensOut} ${tokenSymbol}`
      );

      // Calculate maximum input with slippage tolerance
      const maxRonIn = calculateMaxInputWithSlippage(amounts[0], slippage);
      const deadline = Math.floor(Date.now() / 1000) + 1200;

      // Build and send transaction
      const tx = await routerContract.swapRONForExactTokens(
        amountTokensOutWei, // The exact amount of tokens you want to receive
        path, // Trading path
        this.wallet.address, // Recipient
        deadline, // Transaction deadline
        {
          value: maxRonIn,
          gasLimit: 500000,
        }
      );

      this.logger.info(`Transaction sent: ${tx.hash}`);
      this.logger.info("Waiting for transaction to complete...");

      const receipt = await tx.wait();

      const { success, gasUsed, finalRon, finalToken } =
        await this.processReceipt(receipt, tokenAddress);

      if (success) {
        return {
          success,
          txHash: tx.hash,
          gasUsed: gasUsed,
          initialBalance: {
            ron: initialRon,
            token: initialToken,
          },
          finalBalance: {
            ron: finalRon || "",
            token: finalToken || "",
          },
        };
      }

      return {
        success: false,
        error: "Transaction failed",
      };
    } catch (error) {
      this.logger.error(`Error during swap: ${error}`);
      sendMessage(`Error during swap: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
