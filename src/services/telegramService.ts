import axios from "axios";
import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_API_TOKEN!, { polling: true });

bot.onText(/\/healthcheck/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const response = await axios.get(`/health-${process.env.BASE_URL}check`);
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
    console.error("Health check failed:", error);
    bot.sendMessage(chatId, "Stop failed 🚨");
  }
});

export default bot;
