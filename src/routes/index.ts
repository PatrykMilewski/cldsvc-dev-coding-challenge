import { Router } from 'express';

export const router = Router();

/*
  let orderbook = { }

  Hint: the data structure used for the orderbook can dramatically
        impact efficiency.
*/

enum OrderTypes {
  FILLED = 'FILLED', // order matched entirely
  PARTIALLY_FILLED = 'PARTIALLY_FILLED', // order matched entirely
  REJECTED = 'REJECTED', // order matched entirely
  PENDING = 'PENDING', // order matched entirely
}

// eslint-disable-next-line no-unused-vars
router.post('/order/submit', (req, res, next) => {
  res.send({ message: 'Not implemented' });

  /*
    TODO
    - If the new order is a buy, then match with the other sell orders
    - If the new order is a sell, then match with the other buy orders

    Response format:
    {
      'id': '3f8ecd64-f37e-11eb-9a03-0242ac130003'
      'amount': ...,
      'price': ...,
      'status' 'FILLED' or 'PARTIALLY_FILLED' or 'REJECTED' or 'PENDING'
    }
  */
});

// eslint-disable-next-line no-unused-vars
router.get('/orderbook', (req, res, next) => {
  res.send({ message: 'Not implemented' });

  /*
    TODO
    - Return entire orderbook

    Response format:
    {
      'asks': [
        { 'price': ..., 'amount': ... },
        ...
      ],
      'bids': [
        { 'price': ..., 'amount': ... },
        ...
      ]
    }
  */
});
