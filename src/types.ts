export enum OrderStatus {
  FILLED = 'FILLED', // order matched entirely
  PARTIALLY_FILLED = 'PARTIALLY_FILLED', // order matched partially
  REJECTED = 'REJECTED', // order rejected
  PENDING = 'PENDING', // order pending
}
export enum OrderTypes {
  BUY = 'buy',
  SELL = 'sell',
}

export type Price = {
  price: number;
};
export type PriceAndTime = Price & {
  timestamp: number;
};

export type Order = PriceAndTime & {
  type: OrderTypes;
  amount: number;
  status: OrderStatus;
  id: string;
  filledTimestamp?: number;
};

export type InputOrder = {
  price: unknown;
  amount: unknown;
  type: unknown;
};
export type InputOrderPartial = Partial<InputOrder>;

export type ValidInputOrder = {
  price: number;
  amount: number;
  type: OrderTypes;
};
