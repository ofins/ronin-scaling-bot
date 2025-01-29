import { z } from "zod";

export const swapSchema = z.object({
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.number(),
  slippage: z.number(),
  direction: z.number().refine((val) => val === 1 || val === 2),
});
