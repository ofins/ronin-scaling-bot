import axios from "axios";
import { createLogger } from "../utils/logger";
import { sendMessage } from "./telegramService";

const logger = createLogger();

export class CoinGeckoService {
  public async getMultiTokenPrice(tokenAddresses: string[], network: string) {
    logger.info(`checking token prices on coingecko...`);
    const url = `https://api.geckoterminal.com/api/v2/simple/networks/${network}/token_price/${tokenAddresses.join(
      ","
    )}`;
    try {
      const { data } = await axios.get(url, {
        headers: {
          "x-cg-demo-api-key": process.env.COINGECKO_API_KEY,
        },
      });
      return data;
    } catch (error) {
      logger.error(`Error fetching token prices: ${error}`);
      sendMessage(`Error fetching token prices: ${error}`);
    }
  }
}
