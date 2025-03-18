export enum OrderType {
  Stop = "stop",
  Limit = "limit",
}

export enum AlgoEnumType {
  ScalingUpDownAlgo = "scaling-up-down",
  SimpleLimitAlgo = "simple-limit",
  AlertAlgo = "alert",
}

export enum SwapActionType {
  HOLD = 0,
  BUY = 1,
  SELL = 2,
}

export function checkAlgo(algoType: AlgoEnumType) {
  if (algoType === AlgoEnumType.ScalingUpDownAlgo) {
    return AlgoEnumType.ScalingUpDownAlgo;
  }

  if (algoType === AlgoEnumType.SimpleLimitAlgo) {
    return AlgoEnumType.SimpleLimitAlgo;
  }
}

export function stopOrderTrigger(
  tokenPrice: number,
  nextBuy: number,
  nextSell: number
): number {
  if (tokenPrice <= nextSell) {
    return SwapActionType.HOLD; //sell TODO: do not sell for now.
  } else if (tokenPrice >= nextBuy) {
    return SwapActionType.BUY; //buy
  }
  return SwapActionType.HOLD; //do nothing
}

export function limitOrderTrigger(
  tokenPrice: number,
  nextBuy: number = 0,
  nextSell: number = 0
): number {
  if (tokenPrice <= nextBuy && nextBuy !== 0) {
    return SwapActionType.BUY; //buy
  } else if (tokenPrice >= nextSell && nextSell !== 0) {
    return SwapActionType.SELL; //sell
  }
  return SwapActionType.HOLD; //do nothing
}

export function scalingOutAlgo(tokenPrice: number, nextSell: number): number {
  if (tokenPrice >= nextSell) {
    return SwapActionType.SELL; //sell
  }
  return SwapActionType.HOLD; //do nothing
}
