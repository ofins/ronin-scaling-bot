import { Request, Response } from "express";
import { walletConfig } from "../config/wallet";
import { toggleSchema, tokensSchema } from "../schema/token";
import { TokenService } from "../services/tokenService";
import { WalletService } from "../services/walletService";
import { autoBindMethods } from "../utils/common";
import { createLogger } from "../utils/logger";

const logger = createLogger();

export class TokenController {
  private tokenService: TokenService;

  constructor(tokenService: TokenService) {
    this.tokenService = tokenService;

    autoBindMethods(this);
  }

  public async getActiveTokens(_req: Request, res: Response): Promise<void> {
    try {
      const activeTokens = this.tokenService.getActiveTokens();
      res.status(200).json({ message: "Success", data: activeTokens });
    } catch (error) {
      res.status(500).json({ error: `An error has occured: ${error}` });
    }
  }

  public async addToken(req: Request, res: Response): Promise<void> {
    const body = req.body;

    try {
      tokensSchema.parse(body);
    } catch (error) {
      res.status(400).json({ error: "Invalid schema" });
      return;
    }

    this.tokenService.addToken(body);
    const updatedTokens = this.tokenService.getAllTokens();

    if (JSON.stringify(updatedTokens) === JSON.stringify(body)) {
      logger.info("Token added successfully");
      res.status(200).json({ message: "Success", updatedTokens });
    } else {
      res.status(500).json({ error: "An error occurred" });
    }
  }

  public async updateTokens(req: Request, res: Response): Promise<void> {
    const body = req.body;

    try {
      tokensSchema.parse(body);
    } catch (error) {
      res.status(400).json({ error: "Invalid schema" });
      return;
    }

    this.tokenService.updateTokens(body);
    const updatedTokens = this.tokenService.getAllTokens();

    if (JSON.stringify(updatedTokens) === JSON.stringify(body)) {
      logger.info("Tokens updated successfully");
      res.status(200).json({ message: "Success", updatedTokens });
    } else {
      res.status(500).json({ error: "An error occurred" });
    }
  }

  public async toggleToken(req: Request, res: Response): Promise<void> {
    const { ticker } = req.body;

    try {
      toggleSchema.parse(req.body);
    } catch (error) {
      res.status(400).json({ error: "Invalid schema" });
    }

    const token = this.tokenService.getSingleTokenByTicker(ticker);
    if (!token) {
      res.status(404).json({ error: "Token not found" });
      return;
    }

    const updatedToken = { ...token, isActive: !token.isActive };
    this.tokenService.updateSingleToken(token.address, updatedToken);

    res.status(200).json({ message: "Success", updatedToken });
  }

  public async getWalletBalance(_req: Request, res: Response): Promise<void> {
    const wallet = new WalletService(walletConfig, logger);

    try {
      const result = await wallet.getWalletBalance();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: `An error has occured: ${error}` });
    }
  }
}
