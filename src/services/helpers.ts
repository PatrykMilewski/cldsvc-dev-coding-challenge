import { InputOrder, Order, OrderStatus, OrderTypes, ValidInputOrder } from '../types';
import KSUID from 'ksuid';
import { z, ZodError } from 'zod';

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

export const orderInputSchema = z.object({
  amount: z.number().min(1).max(99),
  price: z.number().min(1),
  type: z.nativeEnum(OrderTypes),
});

export const isValidInputOrder = (input: Partial<InputOrder>): { success: boolean; error?: ZodError } => {
  return orderInputSchema.safeParse(input);
};
