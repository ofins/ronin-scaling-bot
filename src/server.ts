import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import systemRoutes from "./router/systemRouter";
import tokensRoutes from "./router/tokensRouter";
import tradeRoutes from "./router/tradeRouter";
import "./services/telegramService";
import { TokenService } from "./services/tokenService";
import { createLogger } from "./utils/logger";
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const logger = createLogger();

app.use(helmet());
app.use(express.json());

const tokenService = new TokenService();

app.use("/tokens", tokensRoutes(tokenService));
app.use("/system", systemRoutes(tokenService));
app.use("/trade", tradeRoutes);

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
