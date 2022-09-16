import { InputOrder, Order, OrderStatus, OrderTypes, ValidInputOrder } from '../types';
import KSUID from 'ksuid';

export const parseInputToOrder = (input: ValidInputOrder): Order => {
  const timestamp = Date.now();
  return {
    id: KSUID.randomSync(timestamp).string,
    amount: input.amount,
    price: input.price,
    status: OrderStatus.PENDING,
    timestamp,
    type: input.type,
  };
};

export const isValidInputOrder = (input: Partial<InputOrder>): boolean => {
  if (!input.amount || !input.price || !input.type) {
    return false;
  }
  if (typeof input.amount !== 'number' || typeof input.price !== 'number' || typeof input.type !== 'string') {
    return false;
  }
  return Object.values(OrderTypes).includes(input.type as OrderTypes);
};
