import { z } from "zod";

export const tokenSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  isActive: z.boolean(),
  ticker: z.string(),
  priceLevels: z.array(z.number()),
  swapInRonAmount: z.number(),
  nextBuy: z.number(),
  nextSell: z.number(),
});

export const tokensSchema = z.array(tokenSchema);
