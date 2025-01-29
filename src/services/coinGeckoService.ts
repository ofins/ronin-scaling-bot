import axios from "axios";
import { createLogger } from "../utils/logger";

const logger = createLogger();

export class CoinGeckoService {
  public async getMultiTokenPrice(tokenAddresses: string[], network: string) {
    logger.info(
      `Fetching token prices for ${tokenAddresses.join(", ")} ${network}`
    );
    const url = `https://api.geckoterminal.com/api/v2/simple/networks/${network}/token_price/${tokenAddresses.join(
      ","
    )}`;
    try {
      const { data } = await axios.get(url);
      return data;
    } catch (error) {
      logger.error(`Error fetching token prices: ${error}`);
    }
  }
}
