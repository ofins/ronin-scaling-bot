import { NextFunction, Request, Response } from "express";

import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.API_KEY;

export const authenticateAPIKey = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const providedKey = req.header("x-api-key");

  if (!providedKey) {
    res.status(401).json({ error: "Invalid." });
    return;
  }

  if (providedKey !== API_KEY) {
    res.status(403).json({ error: "Invalid." });
    return;
  }

  next();
};
