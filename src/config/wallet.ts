import dotenv from "dotenv";

dotenv.config();

export const walletConfig = {
  privateKey: process.env.PRIVATE_KEY!,
  roninRpcUrl: process.env.RONIN_MAINNET_RPC!,
  routerAddress: process.env.ROUTER_ADDRESS!,
  wronAddress: process.env.WRON_ADDRESS!,
};
