import { Order, OrderStatus, OrderTypes } from '../types';
import { asks, bids } from './orderbook';

export let transactions: Order[] = [];

export const saveFilledOrder = (order: Order): void => {
  order.filledTimestamp = Date.now();
  transactions.push(order);
};

export const setOrderFilled = (order: Order): void => {
  order.amount = 0;
  order.status = OrderStatus.FILLED;
  if (order.type === OrderTypes.SELL) {
    asks.erase(order);
  } else {
    bids.erase(order);
  }
  saveFilledOrder(order);
};

export const clearTransactions = (): void => {
  transactions = [];
};
