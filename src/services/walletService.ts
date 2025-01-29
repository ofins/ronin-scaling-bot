import { ethers } from "ethers";
import { Logger } from "winston";
import { ERC20_ABI, ROUTER_ABI } from "../config/routerAbi";
import { SwapResult, TokenSwapConfig } from "../types";

export class WalletService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private logger: Logger;

  constructor(private config: TokenSwapConfig, logger: Logger) {
    this.provider = new ethers.JsonRpcProvider(config.roninRpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    this.logger = logger;
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

  async swapExactRonForToken(
    tokenAddress: string,
    amountRon: number,
    slippage: number = 0.5
  ): Promise<SwapResult> {
    try {
      // Get initial balances
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

      const routerContract = new ethers.Contract(
        this.config.routerAddress,
        ROUTER_ABI,
        this.wallet
      );

      const amountRonWei = ethers.parseEther(amountRon.toString());
      this.logger.info(
        `Swapping ${amountRon} RON (${amountRonWei.toString()} Wei) for ${tokenSymbol}...`
      );

      // Set up trade path
      const path = [this.config.wronAddress, tokenAddress];

      // Get expected output amount
      const amounts = await routerContract.getAmountsOut(amountRonWei, path);
      const expectedTokens = ethers.formatEther(amounts[1]);
      this.logger.info(
        `Expected ${tokenSymbol} output: ${expectedTokens} ${tokenSymbol}`
      );

      // Calculate minimum output with slippage tolerance
      const minTokens =
        amounts[1] -
        (amounts[1] * BigInt(Math.floor(slippage * 100))) / BigInt(10000);

      // Set deadline to 20 minutes from now
      const deadline = Math.floor(Date.now() / 1000) + 1200;

      // Build and send transaction
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

      if (receipt && receipt.status === 1) {
        const gasUsed = ethers.formatEther(receipt.gasUsed * receipt.gasPrice);
        const finalRon = ethers.formatEther(
          await this.provider.getBalance(this.wallet.address)
        );
        const finalToken = await this.getTokenBalance(
          tokenAddress,
          this.wallet.address
        );

        this.logger.info(`Success! Transaction hash: ${tx.hash}`);
        this.logger.info(`Gas used: ${gasUsed} RON`);
        this.logger.info(`Final RON balance: ${finalRon} RON`);
        this.logger.info(
          `Final ${tokenSymbol} balance: ${finalToken} ${tokenSymbol}`
        );
        console.log("====================================");
        return {
          success: true,
          txHash: tx.hash,
          gasUsed,
          initialBalance: {
            ron: initialRon,
            token: initialToken,
          },
          finalBalance: {
            ron: finalRon,
            token: finalToken,
          },
        };
      }

      return {
        success: false,
        error: "Transaction failed",
      };
    } catch (error) {
      this.logger.error(`Error during swap: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async swapTokensForExactRon(
    tokenAddress: string,
    amountRonOut: number,
    slippage: number = 0.5
  ): Promise<SwapResult> {
    try {
      // Get initial balances
      const initialRon = ethers.formatEther(
        await this.provider.getBalance(this.wallet.address)
      );
      const initialToken = await this.getTokenBalance(
        tokenAddress,
        this.wallet.address
      );
      const tokenSymbol = await this.getTokenSymbol(tokenAddress);
      const tokenDecimals = await this.getTokenDecimals(tokenAddress);

      this.logger.info(`Initial RON balance: ${initialRon} RON`);
      this.logger.info(
        `Initial ${tokenSymbol} balance: ${initialToken} ${tokenSymbol}`
      );

      const routerContract = new ethers.Contract(
        this.config.routerAddress,
        ROUTER_ABI,
        this.wallet
      );

      // Convert desired RON output to Wei
      const amountRonOutWei = ethers.parseEther(amountRonOut.toString());

      // Set up trade path
      const path = [tokenAddress, this.config.wronAddress];

      // Get required input amount
      const amounts = await routerContract.getAmountsIn(amountRonOutWei, path);
      const requiredTokens = ethers.formatUnits(amounts[0], tokenDecimals);
      this.logger.info(
        `Required ${tokenSymbol} input: ${requiredTokens} ${tokenSymbol} to get ${amountRonOut} RON`
      );

      // Calculate maximum input with slippage tolerance
      const maxTokensIn =
        amounts[0] +
        (amounts[0] * BigInt(Math.floor(slippage * 100))) / BigInt(10000);

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

      if (receipt && receipt.status === 1) {
        const gasUsed = ethers.formatEther(receipt.gasUsed * receipt.gasPrice);
        const finalRon = ethers.formatEther(
          await this.provider.getBalance(this.wallet.address)
        );
        const finalToken = await this.getTokenBalance(
          tokenAddress,
          this.wallet.address
        );
        this.logger.info(`Success! Transaction hash: ${tx.hash}`);
        this.logger.info(`Gas used: ${gasUsed} RON`);
        this.logger.info(`Final RON balance: ${finalRon} RON`);
        this.logger.info(
          `Final ${tokenSymbol} balance: ${finalToken} ${tokenSymbol}`
        );
        console.log("====================================");
        return {
          success: true,
          txHash: tx.hash,
          gasUsed,
          initialBalance: {
            ron: initialRon,
            token: initialToken,
          },
          finalBalance: {
            ron: finalRon,
            token: finalToken,
          },
        };
      }

      return {
        success: false,
        error: "Transaction failed",
      };
    } catch (error) {
      this.logger.error(`Error during swap: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
