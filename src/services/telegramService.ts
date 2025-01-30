import axios from "axios";
import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import { SwapResult } from "../types";
import { TokenType } from "./tokenService";

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_API_TOKEN!, { polling: true });

const headers = {
  headers: {
    "x-api-key": process.env.API_KEY,
  },
};

const chatId = process.env.TELEGRAM_CHAT_ID!;

bot.onText(/\/hc/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const response = await axios.get(`${process.env.BASE_URL}/health-check`);
    bot.sendMessage(chatId, `Server Status: ${JSON.stringify(response.data)}`);
  } catch (error) {
    console.error("Health check failed:", error);
    bot.sendMessage(chatId, "Health check failed 🚨");
  }
});

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const response = await axios.post(
      `${process.env.BASE_URL}/start`,
      {},
      headers
    );
    bot.sendMessage(chatId, `Response: ${JSON.stringify(response.data)}`);
  } catch (error) {
    console.error("Start failed:", error);
    bot.sendMessage(chatId, "Start failed 🚨");
  }
});

bot.onText(/\/stop/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const response = await axios.post(
      `${process.env.BASE_URL}/stop`,
      {},
      headers
    );
    bot.sendMessage(chatId, `Response: ${JSON.stringify(response.data)}`);
  } catch (error) {
    bot.sendMessage(chatId, `Stop Failed 🚨: ${error}`);
  }
});

bot.onText(/\/toggle (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const ticker = match?.[1]; // Extract the ticker from the message
  console.log(match);
  if (!ticker) {
    bot.sendMessage(
      chatId,
      "Please provide a ticker. Example: /toggle-token BTC"
    );
    return;
  }

  try {
    const response = await axios.post(
      `${process.env.BASE_URL}/toggle-token`,
      { ticker }, // Send ticker in the body
      headers
    );
    bot.sendMessage(chatId, `Response: ${JSON.stringify(response.data)}`);
  } catch (error: any) {
    bot.sendMessage(chatId, `Toggle Token Failed 🚨: ${error.message}`);
  }
});

bot.onText(/\/active/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const response = await axios.get(
      `${process.env.BASE_URL}/active-tokens`,
      headers
    );

    const content = response.data.map(
      (token: TokenType) =>
        `[${token.ticker}]: nextBuy ${token.nextBuy}, nextSell ${token.nextSell}`
    );

    bot.sendMessage(chatId, content.join("\n"));
  } catch (error) {
    bot.sendMessage(chatId, `Active Tokens Failed 🚨: ${error}`);
  }
});

export function sendMessage(message: string) {
  bot.sendMessage(process.env.TELEGRAM_CHAT_ID!, message);
}

export function sendSwapSuccess({
  txHash,
  gasUsed,
  initialBalance,
  finalBalance,
}: SwapResult) {
  bot.sendMessage(
    chatId,
    `✅ Swap successful!
  📌 Transaction hash: https://app.roninchain.com/tx/${txHash}
  
  ⛽ Gas used: ${Number(gasUsed).toFixed(4)} RON

  RON : ${Number(initialBalance?.ron).toFixed(4)} ➡️ ${Number(
      finalBalance?.ron
    ).toFixed(4)}
  
  Token : ${Number(initialBalance?.token).toFixed(4)} ➡️ ${Number(
      finalBalance?.token
    ).toFixed(4)}`
  );
}

export default bot;
