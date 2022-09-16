# IO Backend Coding Challenge

# Architecture/dev decisions

- I've changed the data structure for submitting orders, now it includes `type` field, which can be buy or sell. In my
  opinion it's way more readable to do it this way, instead of playing with minus values for amount
- I've used TreeSet for asks and bids, so the highest/lowest offers are always `O(1)` to find and inserting new offers
  is only `O(log n)`
- Refactored everything to TypeScript - I was not feeling safe to write code in JavaScript
- Filled orders are moved to transactions, which has a log of finalised transactions. This can be also listed using
  `GET transactions`
- To make everything more production ready, I've introduced a few useful tools like:
  - commit lint for linting commit messages, [https://www.conventionalcommits.org/](https://www.conventionalcommits.org/)
  - ESLint for TypeScript with AirBNB rules, for better types and issues checking during development
  - Husky for automatically checking stuff before pushing changes to repository
- The structure of files for Express was quite strange for me (`bin/www` file mostly), I've refactored it to include it
  simply in the `app.ts` + `helpers.ts`

# Potential issues/improvement points

- It was my first time working with Express, probably its configuration could be improved
- I'm not an expert about hosting containers, I've never had a requirement to setup it in AWS, so most probably
  the configuration of it could be better
- Having that much dev tools, that help to check common issues etc. is cool, however it significantly increases 
  number of dependencies, that could have vulnerabilities or other security risks. For financial related projects 
  this might be an issue
- Changing the architecture might be good idea, so it would be possible to scale horizontally (more explanations in Dockerfile)

# Task
Create an exchange matching engine API that receives new buy & sell orders and matches them against its local orderbook.

Inside of this project is a simple express skeleton template, all of the generic server setup is already done for you, you just need to add the logic.

Please fork this repo and make all the necessary changes to complete the tasks to a 'production ready' standard.

---

## Task 1: Order matching

Head to the `routes/index.js` file where you'll see an empty handler function for the `POST /order/submit` URL path. Inside of this function, implement the logic to accept buy and sell orders from the user which will either be matched against existing orders in the orderbook, added to the orderbook, or a combination of both.

[Investopedia: What are orders?](https://www.investopedia.com/terms/o/order.asp)

[Investopedia: What is an orderbook?](https://www.investopedia.com/terms/o/order-book.asp)

[Investopidia: Orderbook matching](https://www.investopedia.com/terms/m/matchingorders.asp)

The user of the API will submit orders in the form of a JSON POST such as:
```json
POST /order/submit

{
  "amount": 20,
  "price": 190
}
```

### Order matching mechanics

To understand order matching mechanics, we first have to understand the different order types: buy and sell. Buy orders, otherwise known as 'bids', are expressions to buy a certain asset at a given price. Sell orders, otherwise known as 'asks', are expressions to sell an asset at a given price.

Matching occurs when a buy order (bid) is submitted with a price that is greater than the lowest sell order (ask) within the orderbook, or if a sell order (ask) is submitted with a lower price than the highest buy order (bid) within the orderbook. A single order can be matched with multiple orders in the orderbook at the same time.

For example:

```
Initial orderbook:
[Order(price=200, amount=100), Order(price=210, amount=100)]

User submits:
Order(price=190, amount=-250)

Final orderbook:
[Order(price=190, amount=-50)]
```

Notice how the users submitted sell order matched with both of the existing buy orders in the orderbook, which reduced its available amount. Since there were not enough buy orders in the orderbook to fulfill the total value of the sell order, it was added into the orderbook to be matched in the future.


## Task 2: Input validation

Don't worry, you've done the hard part. The final tasks are to test your approach and code quality, rather than comprehension.

This task requires you to simply verify the users order inputs using tools that you would use in a production service.

Validations:
- Order price > 0
- Order amount > 100 or < -100

## Task 3: Production-ready

Again, pretty straightforward. We would like you to add the necessary unit tests to ensure code quality and 'containerize' this service into a docker application. Inside of your `Dockerfile` please add a comment that answers the following questions:

1. Briefly describe the cloud architecture that you would use to host this service in a scalable manner (> 3,000 requests per second). (0-300 words)
2. Assuming the service is deployed with the above configuration, describe the continuous integration pipeline that you would design for this service. (0-300 words)

---

## How to run the code

- Install with `yarn` or `npm install`.
- Run `npm run start`
- For linting run `npm run lint`
- For integration tests run `npm run test`

## 📝 Notes

- [Investopedia: What are orders?](https://www.investopedia.com/terms/o/order.asp)
- [Investopedia: What is an orderbook?](https://www.investopedia.com/terms/o/order-book.asp)
- [Investopidia: Orderbook matching](https://www.investopedia.com/terms/m/matchingorders.asp)
