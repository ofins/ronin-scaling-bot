export type TokenType = {
  address: string;
  isActive: boolean;
  ticker: string;
  priceLevels: number[];
  swapAmountInToken: number;
  nextBuy: number;
  nextSell: number;
};

export class TokenService {
  private tokens: TokenType[];

  constructor() {
    this.tokens = [];
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

  public updateSingleToken(address: string, token: TokenType) {
    const index = this.tokens.findIndex((a) => a.address === address);
    this.tokens[index] = token;
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
