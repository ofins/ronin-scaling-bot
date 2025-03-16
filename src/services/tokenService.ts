import { AlgoEnumType } from "../utils/trade";
import tokens from "./testTokens";

export type TokenType = {
  id: string;
  address: string;
  isActive: boolean;
  ticker: string;
  priceLevels: number[];
  swapAmountInToken: number;
  nextBuy: number;
  nextSell: number;
  algoType: AlgoEnumType;
};

export class TokenService {
  private tokens: TokenType[];

  constructor() {
    this.tokens = tokens;
  }

  public getActiveTokens() {
    return this.tokens.filter((a) => a.isActive);
  }

  public getAllTokens() {
    return this.tokens;
  }

  public getSingleToken(address: string) {
    return this.tokens.find((a) => a.address === address);
  }

  public getSingleTokenByTicker(ticker: string) {
    return this.tokens.find(
      (a) => a.ticker.toLowerCase() === ticker.toLowerCase()
    );
  }

  public getSingleTokenById(id: string) {
    return this.tokens.find((a) => a.id === id);
  }

  public updateSingleToken(id: string, token: TokenType): TokenType {
    // const index = this.tokens.findIndex((a) => a.address === address);
    // this.tokens[index] = token;
    const index = this.tokens.findIndex((a) => a.id === id);
    this.tokens[index] = token;
    return token;
  }

  public addToken(address: TokenType) {
    this.tokens.push(address);
  }

  public removeToken(address: string) {
    this.tokens = this.tokens.filter((a) => a.address !== address);
  }

  public updateTokens(addresses: TokenType[]) {
    this.tokens = addresses;
  }
}
