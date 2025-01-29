import axios from "axios";
import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import { SwapResult } from "../types";

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_API_TOKEN!, { polling: true });

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
      {
        headers: {
          "x-api-key": process.env.API_KEY,
        },
      }
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
      {
        headers: {
          "x-api-key": process.env.API_KEY,
        },
      }
    );
    bot.sendMessage(chatId, `Response: ${JSON.stringify(response.data)}`);
  } catch (error) {
    bot.sendMessage(chatId, `Stop Failed 🚨: ${error}`);
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
    process.env.TELEGRAM_CHAT_ID!,
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
