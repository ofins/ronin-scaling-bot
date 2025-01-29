export interface TokenSwapConfig {
  privateKey: string;
  roninRpcUrl: string;
  routerAddress: string;
  wronAddress: string;
}

export interface SwapResult {
  success: boolean;
  txHash?: string;
  gasUsed?: string;
  initialBalance?: {
    ron: string;
    token: string;
  };
  finalBalance?: {
    ron: string;
    token: string;
  };
  error?: string;
}
