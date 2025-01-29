import axios from "axios";
import { createLogger } from "../utils/logger";

const logger = createLogger();

export class CoinGeckoService {
  public async getMultiTokenPrice(tokenAddresses: string[], network: string) {
    logger.info(`checking token prices on coingecko...`);
    const url = `https://api.geckoterminal.com/api/v2/simple/networks/${network}/token_price/${tokenAddresses.join(
      ","
    )}`;
    try {
      const { data } = await axios.get(url);
      tokenAddresses.forEach((address) => {
        if (!data.data.attributes.token_prices[address]) {
          logger.error(`No price found for ${address}`);
        } else {
          logger.info(
            `Price for ${address}: ${data.data.attributes.token_prices[address]}`
          );
        }
      });
      return data;
    } catch (error) {
      logger.error(`Error fetching token prices: ${error}`);
    }
  }
}
