import { Request, Response, Router } from 'express';
import KSUID from 'ksuid';
import { TreeSet } from 'tstl';

export const router = Router();

enum OrderStatus {
  FILLED = 'FILLED', // order matched entirely
  PARTIALLY_FILLED = 'PARTIALLY_FILLED', // order matched partially
  REJECTED = 'REJECTED', // order rejected
  PENDING = 'PENDING', // order pending
}
enum OrderTypes {
  BUY = 'buy',
  SELL = 'sell',
}

type Price = {
  price: number;
};
type PriceAndTime = Price & {
  timestamp: number;
};

type Order = PriceAndTime & {
  type: OrderTypes;
  amount: number;
  status: OrderStatus;
  id: string;
};
type Offers = TreeSet<Order>;

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

const asks: Offers = new TreeSet<Order>(compareLowest); // sell offers
const bids: Offers = new TreeSet<Order>(compareHighest); // buy offers
const transactions: Order[] = [];

interface Orderbook {
  asks: Order[];
  bids: Order[];
}

type InputOrder = {
  price: unknown;
  amount: unknown;
  type: unknown;
};
type InputOrderPartial = Partial<InputOrder>;
interface InputError {
  message: string;
}
type ValidInputOrder = {
  price: number;
  amount: number;
  type: OrderTypes;
};

// eslint-disable-next-line no-unused-vars
router.post(
  '/order/submit',
  (req: Request<InputOrderPartial, Order | InputError, InputOrderPartial>, res: Response<Order | InputError>) => {
    /*
    TODO
    - If the new order is a buy, then match with the other sell orders
    - If the new order is a sell, then match with the other buy orders
  */
    const input: InputOrderPartial = req.body;

    if (isValidInputOrder(input)) {
      const validInput = input as ValidInputOrder;
      const order: Order = getOrder(validInput);

      if (order.status === OrderStatus.FILLED) {
        saveFilledOrder(order);
      }
      saveNotFilledOrder(order);

      res.status(200).json(order);
    } else {
      res.status(400).send({
        message: 'Valid amount, price and order type are required',
      });
    }
  },
);

// eslint-disable-next-line no-unused-vars
router.get('/orderbook', (req: Request, res: Response<Orderbook>) => {
  res.status(200).json({
    asks: asks.toJSON(),
    bids: bids.toJSON(),
  });
});

// eslint-disable-next-line no-unused-vars
router.get('/transactions', (req, res: Response<Order[]>, next) => {
  return res.status(200).json(transactions);
});

const saveFilledOrder = (order: Order): void => {
  transactions.push(order);
};

const saveNotFilledOrder = (order: Order): void => {
  if (order.type === OrderTypes.BUY) {
    bids.insert(order);
  } else {
    asks.insert(order);
  }
};

const isValidInputOrder = (input: Partial<InputOrder>): boolean => {
  if (!input.amount || !input.price || !input.type) {
    return false;
  }
  if (typeof input.amount !== 'number' || typeof input.price !== 'number' || typeof input.type !== 'string') {
    return false;
  }
  return Object.values(OrderTypes).includes(input.type as OrderTypes);
};

const getOrder = (input: ValidInputOrder): Order => {
  const timestamp = Date.now();
  return {
    id: KSUID.randomSync(timestamp).string,
    amount: input.amount,
    price: input.price,
    status: OrderStatus.FILLED,
    timestamp,
    type: input.type,
  };
};
