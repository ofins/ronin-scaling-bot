type TokenType = {
  address: string;
  isActive: boolean;
  ticker: string;
  priceLevels: number[];
  swapInRonAmount: number;
  nextBuy: number;
  nextSell: number;
};

export class ActiveTokenService {
  private tokens: TokenType[];

  constructor() {
    this.tokens = [
      {
        address: "0xe514d9deb7966c8be0ca922de8a064264ea6bcd4",
        ticker: "RON",
        isActive: false,
        priceLevels: [1.25, 1.5, 1.75, 2],
        nextBuy: 1.75,
        nextSell: 1.25,
        swapInRonAmount: 0.01,
      },
      {
        address: "0x97a9107c1793bc407d6f527b77e7fff4d812bece",
        ticker: "AXS",
        isActive: true,
        priceLevels: [5, 6, 7, 8, 9, 10],
        nextBuy: 5,
        nextSell: 4,
        swapInRonAmount: 0.01,
      }, //axs
    ];
  }

  public async getActiveToken(): Promise<TokenType[]> {
    return this.tokens;
  }

  public async addToken(address: TokenType): Promise<void> {
    this.tokens.push(address);
  }

  public async removeToken(address: string): Promise<void> {
    this.tokens = this.tokens.filter((a) => a.address !== address);
  }

  public async updateTokens(addresses: TokenType[]): Promise<void> {
    this.tokens = addresses;
  }
}
