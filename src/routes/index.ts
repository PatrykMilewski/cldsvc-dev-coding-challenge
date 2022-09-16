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
  filledTimestamp?: number;
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

      let processedOrder: Order;
      if (order.type === OrderTypes.BUY) {
        processedOrder = handleBuyOrder(order);
      } else {
        processedOrder = handleSellOrder(order);
      }

      if (processedOrder.status === OrderStatus.FILLED) {
        saveFilledOrder(processedOrder);
      } else {
        saveNotFilledOrder(processedOrder);
      }
      res.status(200).json(processedOrder);
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
router.get('/transactions', (req, res: Response<Order[]>) => {
  return res.status(200).json(transactions);
});

const saveFilledOrder = (order: Order): void => {
  order.filledTimestamp = Date.now();
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
    status: OrderStatus.PENDING,
    timestamp,
    type: input.type,
  };
};

const handleBuyOrder = (buyOrder: Order): Order => {
  if (asks.size() === 0) {
    return buyOrder;
  }
  const startingAmount = buyOrder.amount;
  let theLowestSellPriceOffer = asks.begin().value;

  // bought none
  if (theLowestSellPriceOffer.price > buyOrder.price) {
    buyOrder.status = OrderStatus.PENDING;
    return buyOrder;
  }
  while (buyOrder.amount > 0 && asks.size() && theLowestSellPriceOffer.price <= buyOrder.amount) {
    // bought all
    if (theLowestSellPriceOffer.amount >= buyOrder.amount) {
      theLowestSellPriceOffer.amount -= buyOrder.amount;
      buyOrder.amount = 0;

      // sold all
      if (theLowestSellPriceOffer.amount === 0) {
        setOrderFilled(theLowestSellPriceOffer);
      }
      break;
    }
    // bought some
    else {
      buyOrder.amount -= theLowestSellPriceOffer.amount;
      setOrderFilled(theLowestSellPriceOffer);
    }

    theLowestSellPriceOffer = asks.begin().value;
  }

  buyOrder.status = getNewOrderStatus(buyOrder, startingAmount);
  return buyOrder;
};

const handleSellOrder = (sellOrder: Order): Order => {
  if (bids.size() === 0) {
    return sellOrder;
  }
  const startingAmount = sellOrder.amount;
  let theHighestBuyPriceOffer = bids.begin().value;

  // bought none
  if (theHighestBuyPriceOffer.price > sellOrder.price) {
    sellOrder.status = OrderStatus.PENDING;
    return sellOrder;
  }

  while (sellOrder.amount > 0 && asks.size() && theHighestBuyPriceOffer.price >= sellOrder.amount) {
    // bought all
    if (theHighestBuyPriceOffer.amount <= sellOrder.amount) {
      theHighestBuyPriceOffer.amount -= sellOrder.amount;
      sellOrder.amount = 0;

      // sold all
      if (theHighestBuyPriceOffer.amount === 0) {
        setOrderFilled(theHighestBuyPriceOffer);
      }
      break;
    }
    // bought some
    else {
      sellOrder.amount -= theHighestBuyPriceOffer.amount;
      setOrderFilled(theHighestBuyPriceOffer);
    }

    theHighestBuyPriceOffer = asks.begin().value;
  }

  sellOrder.status = getNewOrderStatus(sellOrder, startingAmount);
  return sellOrder;
};

const getNewOrderStatus = (order: Order, startingAmount: number): OrderStatus => {
  if (order.amount > 0 && startingAmount !== order.amount) {
    return OrderStatus.PARTIALLY_FILLED;
  } else if (order.amount > 0) {
    return OrderStatus.PENDING;
  } else {
    return OrderStatus.FILLED;
  }
};

const setOrderFilled = (order: Order): void => {
  order.amount = 0;
  order.status = OrderStatus.FILLED;
  asks.erase(order);
  saveFilledOrder(order);
};
