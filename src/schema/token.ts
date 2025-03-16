import { z } from "zod";

export const tokenSchema = z.object({
  id: z.string(),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  isActive: z.boolean(),
  ticker: z.string(),
  priceLevels: z.array(z.number().optional()),
  swapAmountInToken: z.number(),
  nextBuy: z.number(),
  nextSell: z.number(),
});

export const tokensSchema = z.array(tokenSchema).superRefine((data) => {
  const tokenIds = data.map((token) => token.id);
  const uniqueTokenAddresses = new Set(tokenIds);
  if (tokenIds.length !== uniqueTokenAddresses.size) {
    throw new Error("Duplicate token addresses found.");
  }
  return true;
});

export const toggleSchema = z.object({
  ticker: z.string(),
});
