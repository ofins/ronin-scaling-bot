export function pyramidAlgo(
  tokenPrice: number,
  nextBuy: number,
  nextSell: number
): number {
  if (tokenPrice <= nextSell) {
    return 2; //sell
  } else if (tokenPrice >= nextBuy) {
    return 1; //buy
  }
  return 0; //do nothing
}

export function scalingOutAlgo(tokenPrice: number, nextSell: number): number {
  if (tokenPrice >= nextSell) {
    return 2; //sell
  }
  return 0; //do nothing
}
