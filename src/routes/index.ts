import { Request, Response, Router } from 'express';
import { asks, bids, getOrderbookJSON, Orderbook, saveNotFilledOrder } from '../services/orderbook';
import { InputOrderPartial, Order, OrderStatus, OrderTypes, ValidInputOrder } from '../types';
import { saveFilledOrder, setOrderFilled, transactions } from '../services/transactions';
import { isValidInputOrder, parseInputToOrder } from '../services/helpers';

export const router = Router();

// eslint-disable-next-line no-unused-vars
router.post(
  '/order/submit',
  (req: Request<InputOrderPartial, Order | InputError, InputOrderPartial>, res: Response<Order | InputError>) => {
    const input: InputOrderPartial = req.body;

    if (isValidInputOrder(input)) {
      const validInput = input as ValidInputOrder;
      const order: Order = parseInputToOrder(validInput);

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
  res.status(200).json(getOrderbookJSON());
});

// eslint-disable-next-line no-unused-vars
router.get('/transactions', (req, res: Response<Order[]>) => {
  return res.status(200).json(transactions);
});

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
  while (buyOrder.amount > 0 && asks.size() && theLowestSellPriceOffer.price <= buyOrder.price) {
    // bought all
    if (theLowestSellPriceOffer.amount >= buyOrder.amount) {
      theLowestSellPriceOffer.amount -= buyOrder.amount;
      buyOrder.amount = 0;
      theLowestSellPriceOffer.status = OrderStatus.PARTIALLY_FILLED;

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
  if (theHighestBuyPriceOffer.price < sellOrder.price) {
    sellOrder.status = OrderStatus.PENDING;
    return sellOrder;
  }

  while (sellOrder.amount > 0 && bids.size() && theHighestBuyPriceOffer.price >= sellOrder.price) {
    // bought all
    if (theHighestBuyPriceOffer.amount >= sellOrder.amount) {
      theHighestBuyPriceOffer.amount -= sellOrder.amount;
      sellOrder.amount = 0;
      theHighestBuyPriceOffer.status = OrderStatus.PARTIALLY_FILLED;

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

    theHighestBuyPriceOffer = bids.begin().value;
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

interface InputError {
  message: string;
}
