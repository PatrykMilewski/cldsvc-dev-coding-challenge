import { TreeSet } from 'tstl';
import { Order, OrderTypes } from '../types';

export interface Orderbook {
  asks: Order[];
  bids: Order[];
}

const compareHighest = (first: Order, second: Order): boolean => {
  if (first.price === second.price) {
    return first.timestamp < second.timestamp;
  }
  return first.price > second.price;
};

const compareLowest = (first: Order, second: Order): boolean => {
  if (first.price === second.price) {
    return first.timestamp < second.timestamp;
  }
  return first.price < second.price;
};

export const asks: Offers = new TreeSet<Order>(compareLowest); // sell offers
export const bids: Offers = new TreeSet<Order>(compareHighest); // buy offers

export const getOrderbookJSON = (): Orderbook => {
  return {
    asks: asks.toJSON(),
    bids: bids.toJSON(),
  };
};

type Offers = TreeSet<Order>;

export const saveNotFilledOrder = (order: Order): void => {
  if (order.type === OrderTypes.BUY) {
    bids.insert(order);
  } else {
    asks.insert(order);
  }
};

export const clearOrderbook = (): void => {
  asks.clear();
  bids.clear();
};
