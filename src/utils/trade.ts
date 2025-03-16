export enum OrderType {
  Stop = "stop",
  Limit = "limit",
}

export enum AlgoEnumType {
  ScalingUpDownAlgo = "scaling-up-down",
  SimpleLimitAlgo = "simple-limit",
  AlertAlgo = "alert",
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
    return 0; //sell TODO: do not sell for now.
  } else if (tokenPrice >= nextBuy) {
    return 1; //buy
  }
  return 0; //do nothing
}

export function limitOrderTrigger(
  tokenPrice: number,
  nextBuy: number = 0,
  nextSell: number = 0
): number {
  if (tokenPrice <= nextBuy && nextBuy !== 0) {
    return 1; //buy
  } else if (tokenPrice >= nextSell && nextSell !== 0) {
    return 2; //sell
  }
  return 0; //do nothing
}

export function scalingOutAlgo(tokenPrice: number, nextSell: number): number {
  if (tokenPrice >= nextSell) {
    return 2; //sell
  }
  return 0; //do nothing
}
