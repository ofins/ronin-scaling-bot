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

bot.sendMessage(chatId, "Server restarted 🔄");

bot.onText(/\/health/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const response = await axios.get(`${process.env.BASE_URL}/system/health`);
    bot.sendMessage(chatId, `Server Status: ${JSON.stringify(response.data)}`);
  } catch (error) {
    console.error("Health check failed:", error);
    bot.sendMessage(chatId, "Health check failed 🚨");
  }
});

bot.onText(/\/start/, async (msg, match) => {
  const chatId = msg.chat.id;
  const input = match?.input;
  if (input !== "/start 1") {
    bot.sendMessage(chatId, "Please provide a value to start.");
    return;
  }
  try {
    const response = await axios.post(
      `${process.env.BASE_URL}/system/start`,
      {},
      headers
    );
    bot.sendMessage(chatId, `Response: ${JSON.stringify(response.data)}`);
  } catch (error) {
    console.error("Start failed:", error);
    bot.sendMessage(chatId, "Start failed 🚨");
  }
});

bot.onText(/\/stop/, async (msg, match) => {
  const chatId = msg.chat.id;
  const input = match?.input;

  if (input !== "/stop 1") {
    bot.sendMessage(chatId, "Please provide a value to start.");
    return;
  }

  try {
    const response = await axios.post(
      `${process.env.BASE_URL}/system/stop`,
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
  if (!ticker) {
    bot.sendMessage(chatId, "Please provide a ticker. Example: /toggle RON");
    return;
  }

  try {
    const response = await axios.post(
      `${process.env.BASE_URL}/tokens/toggle-token`,
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
      `${process.env.BASE_URL}/tokens/active`,
      headers
    );

    const content = response.data.map(
      (token: TokenType) =>
        `[${token.ticker}]: ${token.algoType} | ${token.id} | nextBuy ${token.nextBuy}, nextSell ${token.nextSell}`
    );

    bot.sendMessage(chatId, content.join("\n"));
  } catch (error) {
    bot.sendMessage(chatId, `Active Tokens Failed 🚨: ${error}`);
  }
});

bot.onText(/\/all/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const response = await axios.get(
      `${process.env.BASE_URL}/tokens/all`,
      headers
    );

    const activeTokens = response.data.filter(
      (token: TokenType) => token.isActive
    );
    const inactiveTokens = response.data.filter(
      (token: TokenType) => !token.isActive
    );

    const activeContent = activeTokens.map(
      (token: TokenType) =>
        `[${token.ticker}]: ${token.algoType} | ${token.id} | nextBuy ${token.nextBuy}, nextSell ${token.nextSell}`
    );

    const inactiveContent = inactiveTokens.map(
      (token: TokenType) =>
        `[${token.ticker}]: ${token.algoType} | ${token.id} | nextBuy ${token.nextBuy}, nextSell ${token.nextSell}`
    );

    const content = [
      "ACTIVE TOKENS:",
      ...activeContent,
      "",
      "INACTIVE TOKENS:",
      ...inactiveContent,
    ];

    bot.sendMessage(chatId, content.join("\n"));
  } catch (error) {
    bot.sendMessage(chatId, `All Tokens Failed 🚨: ${error}`);
  }
});

bot.onText(/\/balance/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const response = await axios.get(
      `${process.env.BASE_URL}/tokens/balance`,
      headers
    );

    bot.sendMessage(chatId, `Wallet: ${JSON.stringify(response.data)}`);
  } catch (error) {
    bot.sendMessage(chatId, `Wallet Failed 🚨: ${error}`);
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
