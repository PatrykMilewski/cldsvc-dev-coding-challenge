/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import request from 'supertest';
import { app, server } from '../app';
import { clearOrderbook, Orderbook } from '../services/orderbook';
import { clearTransactions } from '../services/transactions';
import { Order, OrderStatus, OrderTypes, ValidInputOrder } from '../types';

describe('API tests', () => {
  beforeEach(() => {
    clearOrderbook();
    clearTransactions();
  });

  afterAll(() => {
    server.close();
  });

  it('should return an empty orderbook', async () => {
    const res = await request(app).get('/orderbook');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(emptyOrderbook);
  });

  it('if price doesnt match, shouldnt fill offer for sell offer', async () => {
    const buyOrder = buildOrderInput(5, 10, OrderTypes.BUY);
    const sellOrder = buildOrderInput(15, 10, OrderTypes.SELL);

    await request(app).get('/orderbook');
    await request(app).post('/order/submit').send(buyOrder);
    await request(app).post('/order/submit').send(sellOrder);
    const getOrderbookAfterPlacingBuyOrder = await request(app).get('/orderbook');

    const buyOrderMatcher = buildOrderMatcher(buyOrder, OrderStatus.PENDING);
    const sellOrderMatcher = buildOrderMatcher(sellOrder, OrderStatus.PENDING);

    expect(getOrderbookAfterPlacingBuyOrder.body).toMatchObject(
      buildOrderbookMatcher([sellOrderMatcher], [buyOrderMatcher]),
    );
  });

  it('if price doesnt match, shouldnt fill offer for buy offer', async () => {
    const sellOrder = buildOrderInput(15, 10, OrderTypes.SELL);
    const buyOrder = buildOrderInput(5, 10, OrderTypes.BUY);

    await request(app).get('/orderbook');
    await request(app).post('/order/submit').send(sellOrder);
    await request(app).post('/order/submit').send(buyOrder);
    const getOrderbookAfterPlacingBuyOrder = await request(app).get('/orderbook');

    const sellOrderMatcher = buildOrderMatcher(sellOrder, OrderStatus.PENDING);
    const buyOrderMatcher = buildOrderMatcher(buyOrder, OrderStatus.PENDING);

    expect(getOrderbookAfterPlacingBuyOrder.body).toMatchObject(
      buildOrderbookMatcher([sellOrderMatcher], [buyOrderMatcher]),
    );
  });

  it('should save filled orders to transactions', async () => {
    const buyOrder = buildOrderInput(10, 10, OrderTypes.BUY);
    const sellOrder = buildOrderInput(10, 10, OrderTypes.SELL);

    await request(app).post('/order/submit').send(buyOrder);
    await request(app).post('/order/submit').send(sellOrder);

    const transactions = await request(app).get('/transactions');

    expect(transactions.body).toMatchObject([
      buildOrderMatcher(
        {
          price: 10,
          amount: 0,
          type: OrderTypes.BUY,
        },
        OrderStatus.FILLED,
      ),
      buildOrderMatcher(
        {
          price: 10,
          amount: 0,
          type: OrderTypes.SELL,
        },
        OrderStatus.FILLED,
      ),
    ]);
  });

  it('if all orders are filled, orderbook should be empty', async () => {
    const buyOrder = buildOrderInput(10, 10, OrderTypes.BUY);
    const sellOrder = buildOrderInput(10, 10, OrderTypes.SELL);

    await request(app).post('/order/submit').send(buyOrder);
    await request(app).post('/order/submit').send(sellOrder);

    const orderbook = await request(app).get('/orderbook');

    expect(orderbook.body).toMatchObject(emptyOrderbook);
  });

  it('orderbook should be sorted by price for bids', async () => {
    const firstOrder = buildOrderInput(10, 10, OrderTypes.BUY);
    const secondOrder = buildOrderInput(5, 10, OrderTypes.BUY);
    const thirdOrder = buildOrderInput(15, 10, OrderTypes.BUY);

    await request(app).post('/order/submit').send(firstOrder);
    await request(app).post('/order/submit').send(secondOrder);
    await request(app).post('/order/submit').send(thirdOrder);

    const orderbook = await request(app).get('/orderbook');

    const firstOrderMatcher = buildOrderMatcher(firstOrder, OrderStatus.PENDING);
    const secondOrderMatcher = buildOrderMatcher(secondOrder, OrderStatus.PENDING);
    const thirdOrderMatcher = buildOrderMatcher(thirdOrder, OrderStatus.PENDING);

    expect(orderbook.body).toMatchObject(
      buildOrderbookMatcher([], [thirdOrderMatcher, firstOrderMatcher, secondOrderMatcher]),
    );
  });

  it('sell order should be filled, when there is a buyer, that wants to buy more than the amount offered', async () => {
    const buyOrder = buildOrderInput(10, 10, OrderTypes.BUY);
    const sellOrder = buildOrderInput(10, 5, OrderTypes.SELL);

    await request(app).post('/order/submit').send(buyOrder);
    await request(app).post('/order/submit').send(sellOrder);

    const orderbook = await request(app).get('/orderbook');

    const buyOrderAfterUpdateMatcher = buildOrderMatcher(
      {
        price: 10,
        amount: 5,
        type: OrderTypes.BUY,
      },
      OrderStatus.PARTIALLY_FILLED,
    );

    expect(orderbook.body).toMatchObject(buildOrderbookMatcher([], [buyOrderAfterUpdateMatcher]));
  });

  it('orderbook should be sorted by price for asks', async () => {
    const firstOrder = buildOrderInput(10, 10, OrderTypes.SELL);
    const secondOrder = buildOrderInput(5, 10, OrderTypes.SELL);
    const thirdOrder = buildOrderInput(15, 10, OrderTypes.SELL);

    await request(app).post('/order/submit').send(firstOrder);
    await request(app).post('/order/submit').send(secondOrder);
    await request(app).post('/order/submit').send(thirdOrder);

    const orderbook = await request(app).get('/orderbook');

    const firstOrderMatcher = buildOrderMatcher(firstOrder, OrderStatus.PENDING);
    const secondOrderMatcher = buildOrderMatcher(secondOrder, OrderStatus.PENDING);
    const thirdOrderMatcher = buildOrderMatcher(thirdOrder, OrderStatus.PENDING);

    expect(orderbook.body).toMatchObject(
      buildOrderbookMatcher([secondOrderMatcher, firstOrderMatcher, thirdOrderMatcher], []),
    );
  });

  it('if there is not enough stuff for sale, but price matches, buy offer should be partially filled', async () => {
    const firstSellOrder = buildOrderInput(10, 10, OrderTypes.SELL);
    const secondSellOrder = buildOrderInput(11, 10, OrderTypes.SELL);
    const thirdSellOrder = buildOrderInput(20, 10, OrderTypes.SELL);
    const buyOrder = buildOrderInput(15, 100, OrderTypes.BUY);

    await request(app).post('/order/submit').send(firstSellOrder);
    await request(app).post('/order/submit').send(secondSellOrder);
    await request(app).post('/order/submit').send(thirdSellOrder);
    await request(app).post('/order/submit').send(buyOrder);

    const orderbook = await request(app).get('/orderbook');

    const buyOrderPartiallyFilled = buildOrderInput(15, 80, OrderTypes.BUY);
    const buyOrderPartiallyFilledMatcher = buildOrderMatcher(buyOrderPartiallyFilled, OrderStatus.PARTIALLY_FILLED);
    const sellOrderHighestPriceMatcher = buildOrderMatcher(thirdSellOrder, OrderStatus.PENDING);

    expect(orderbook.body).toMatchObject(
      buildOrderbookMatcher([sellOrderHighestPriceMatcher], [buyOrderPartiallyFilledMatcher]),
    );
  });

  it('if there is not enough buyers, but price matches, sell offer should be partially filled', async () => {
    const firstBuyOrder = buildOrderInput(10, 10, OrderTypes.BUY);
    const secondBuyOrder = buildOrderInput(11, 10, OrderTypes.BUY);
    const thirdBuyOrder = buildOrderInput(1, 10, OrderTypes.BUY);
    const sellOrder = buildOrderInput(5, 100, OrderTypes.SELL);

    await request(app).post('/order/submit').send(firstBuyOrder);
    await request(app).post('/order/submit').send(secondBuyOrder);
    await request(app).post('/order/submit').send(thirdBuyOrder);
    await request(app).post('/order/submit').send(sellOrder);

    const orderbook = await request(app).get('/orderbook');

    const sellOrderPartiallyFilled = buildOrderInput(5, 80, OrderTypes.SELL);
    const sellOrderPartiallyFilledMatcher = buildOrderMatcher(sellOrderPartiallyFilled, OrderStatus.PARTIALLY_FILLED);
    const buyOrderLowestPriceMatcher = buildOrderMatcher(thirdBuyOrder, OrderStatus.PENDING);

    expect(orderbook.body).toMatchObject(
      buildOrderbookMatcher([sellOrderPartiallyFilledMatcher], [buyOrderLowestPriceMatcher]),
    );
  });

  it('should return bad request if price is missing in a new order', async () => {
    const response = await request(app).post('/order/submit').send({
      amount: 10,
      type: 'buy',
    });
    expect(response.status).toBe(400);
  });

  it('should return bad request if amount is missing in a new order', async () => {
    const response = await request(app).post('/order/submit').send({
      price: 10,
      type: 'buy',
    });
    expect(response.status).toBe(400);
  });

  it('should return bad request if operation type is wrong in a new order', async () => {
    const response = await request(app).post('/order/submit').send({
      amount: 10,
      price: 10,
      type: 'wrong type',
    });
    expect(response.status).toBe(400);
  });

  it('should return bad request if operation type is missing in a new order', async () => {
    const response = await request(app).post('/order/submit').send({
      amount: 10,
      price: 10,
    });
    expect(response.status).toBe(400);
  });
});

const emptyOrderbook = {
  asks: [],
  bids: [],
};

const buildOrderMatcher = (order: ValidInputOrder, status: OrderStatus): Order => {
  return {
    ...order,
    id: expect.any(String),
    timestamp: expect.any(Number),
    status,
  };
};

const buildOrderbookMatcher = (asks: Order[], bids: Order[]): Orderbook => {
  return {
    bids,
    asks,
  };
};

const buildOrderInput = (price: number, amount: number, type: OrderTypes): ValidInputOrder => ({
  price,
  amount,
  type,
});
