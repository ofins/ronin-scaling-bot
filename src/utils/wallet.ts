export function calculateMinOutputWithSlippage(
  inputAmount: bigint,
  slippage: number
) {
  return (
    inputAmount -
    (inputAmount * BigInt(Math.floor(slippage * 100))) / BigInt(10000)
  );
}

export function calculateMaxInputWithSlippage(
  outputAmount: bigint,
  slippage: number
) {
  return (
    outputAmount +
    (outputAmount * BigInt(Math.floor(slippage * 100))) / BigInt(10000)
  );
}
