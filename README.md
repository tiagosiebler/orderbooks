# OrderBooks Store [![npm version](https://img.shields.io/npm/v/orderbooks.svg)][1] [![npm size](https://img.shields.io/bundlephobia/min/orderbooks.svg)][1] [![npm downloads](https://img.shields.io/npm/dt/orderbooks.svg)][1]

[![CodeFactor](https://www.codefactor.io/repository/github/tiagosiebler/orderbooks/badge)](https://www.codefactor.io/repository/github/tiagosiebler/orderbooks)

[1]: https://www.npmjs.com/package/orderbooks

A minimal set of utilities for handling orderbook snapshots and delta updates, with bybit examples.

## Issues & Discussion

- Issues? Check the [issues tab](https://github.com/tiagosiebler/orderbooks/issues).
- Discuss & collaborate with other node devs? Join our [Node.js Algo Traders](https://t.me/nodetraders) engineering community on telegram.

## Documentation

- [TSDoc Documentation (generated using typedoc via npm module)](https://tsdocs.dev/docs/orderbooks)

<!-- template_related_projects -->

## Related projects

Check out my related JavaScript/TypeScript/Node.js projects:

- Try my REST API & WebSocket SDKs:
  - [Bybit-api Node.js SDK](https://www.npmjs.com/package/bybit-api)
  - [Okx-api Node.js SDK](https://www.npmjs.com/package/okx-api)
  - [Binance Node.js SDK](https://www.npmjs.com/package/binance)
  - [Gateio-api Node.js SDK](https://www.npmjs.com/package/gateio-api)
  - [Bitget-api Node.js SDK](https://www.npmjs.com/package/bitget-api)
  - [Kucoin-api Node.js SDK](https://www.npmjs.com/package/kucoin-api)
  - [Coinbase-api Node.js SDK](https://www.npmjs.com/package/coinbase-api)
  - [Bitmart-api Node.js SDK](https://www.npmjs.com/package/bitmart-api)
- Try my misc utilities:
  - [OrderBooks Node.js](https://www.npmjs.com/package/orderbooks)
  - [Crypto Exchange Account State Cache](https://www.npmjs.com/package/accountstate)
- Check out my examples:
  - [awesome-crypto-examples Node.js](https://github.com/tiagosiebler/awesome-crypto-examples)
  <!-- template_related_projects_end -->



## Project Contributions

Contributions are very welcome, I will review any incoming pull requests. See the issues tab for todo items.

## Features

- Handle snapshot and delta orderbook events.
- Track multiple symbol orderbooks.
- Easily access best bid/ask prices.
- Conveniently access the difference between the best bid and ask prices, with the spread represented in basis point units.
- Easily keep orderbook depth trimmed to max depth.
- Tiny module with 0 external dependencies.

## Installation

```
npm install -save orderbooks
```

## Usage

### Tracking

- Import books store & level

```javascript
const { OrderBooksStore, OrderBookLevel } = require('orderbooks');
```

- Create instance of orderbooks store, to store multiple order books for a broker

```javascript
// all options are optional
const options = {
  // output traces on any events sent handled by book
  traceLog: true,

  // check current timestamp > last timestamp, else deny processing event
  checkTimestamps: false,

  // max size of orderbook (e.g 50 == 25 bids & 25 asks). Defaults to 250.
  maxDepth: 50,
};

const OrderBooks = new OrderBooksStore(options);
```

- Feed snapshot and delta updates into OrderBooks.handle() methods.

## Examples

See the [./samples/](./samples/) folder for more.

### Real Example - Binance

See [./samples/binance.ts](./samples/binance.ts)

### Real Example - Bybit

- Import modules
- Prepare OrderBooks store instance
- Connect to OrderBooks websockets
- Map event properties to expected key:value pairs
- Feed mapped snapshot and delta events into OrderBooks.handle() methods

See [./samples/bybit.ts](./samples/bybit.ts)

Example output with `print()` calls to output book state to console:

```
---------- BTCUSD ask:bid 9240:9239.5 & spread: 0.01%
┌─────────┬──────────┬────────┬────────┬─────────┐
│ (index) │  symbol  │ price  │  side  │   qty   │
├─────────┼──────────┼────────┼────────┼─────────┤
│    0    │ 'BTCUSD' │  9252  │ 'Sell' │ 132623  │
│    1    │ 'BTCUSD' │ 9251.5 │ 'Sell' │  82221  │
│    2    │ 'BTCUSD' │  9251  │ 'Sell' │  34974  │
│    3    │ 'BTCUSD' │ 9250.5 │ 'Sell' │  12842  │
│    4    │ 'BTCUSD' │  9250  │ 'Sell' │ 550687  │
│    5    │ 'BTCUSD' │ 9249.5 │ 'Sell' │  63371  │
│    6    │ 'BTCUSD' │  9249  │ 'Sell' │ 200127  │
│    7    │ 'BTCUSD' │ 9248.5 │ 'Sell' │ 129099  │
│    8    │ 'BTCUSD' │  9248  │ 'Sell' │ 209061  │
│    9    │ 'BTCUSD' │ 9247.5 │ 'Sell' │  30722  │
│   10    │ 'BTCUSD' │  9247  │ 'Sell' │ 165469  │
│   11    │ 'BTCUSD' │ 9246.5 │ 'Sell' │  97780  │
│   12    │ 'BTCUSD' │  9246  │ 'Sell' │  95342  │
│   13    │ 'BTCUSD' │ 9245.5 │ 'Sell' │  41319  │
│   14    │ 'BTCUSD' │  9245  │ 'Sell' │ 227242  │
│   15    │ 'BTCUSD' │ 9244.5 │ 'Sell' │ 167586  │
│   16    │ 'BTCUSD' │  9244  │ 'Sell' │ 237029  │
│   17    │ 'BTCUSD' │ 9243.5 │ 'Sell' │ 103426  │
│   18    │ 'BTCUSD' │  9243  │ 'Sell' │ 126357  │
│   19    │ 'BTCUSD' │ 9242.5 │ 'Sell' │ 165034  │
│   20    │ 'BTCUSD' │  9242  │ 'Sell' │ 264286  │
│   21    │ 'BTCUSD' │ 9241.5 │ 'Sell' │ 261200  │
│   22    │ 'BTCUSD' │  9241  │ 'Sell' │ 233533  │
│   23    │ 'BTCUSD' │ 9240.5 │ 'Sell' │ 399512  │
│   24    │ 'BTCUSD' │  9240  │ 'Sell' │ 1397987 │
│   25    │ 'BTCUSD' │ 9239.5 │ 'Buy'  │  1132   │
│   26    │ 'BTCUSD' │  9239  │ 'Buy'  │ 234214  │
│   27    │ 'BTCUSD' │ 9238.5 │ 'Buy'  │  58320  │
│   28    │ 'BTCUSD' │  9238  │ 'Buy'  │  17094  │
│   29    │ 'BTCUSD' │ 9237.5 │ 'Buy'  │  50980  │
│   30    │ 'BTCUSD' │  9237  │ 'Buy'  │  13449  │
│   31    │ 'BTCUSD' │ 9236.5 │ 'Buy'  │  2608   │
│   32    │ 'BTCUSD' │  9236  │ 'Buy'  │  53742  │
│   33    │ 'BTCUSD' │ 9235.5 │ 'Buy'  │ 106681  │
│   34    │ 'BTCUSD' │  9235  │ 'Buy'  │  48653  │
│   35    │ 'BTCUSD' │ 9234.5 │ 'Buy'  │  76188  │
│   36    │ 'BTCUSD' │  9234  │ 'Buy'  │ 215664  │
│   37    │ 'BTCUSD' │ 9233.5 │ 'Buy'  │ 169265  │
│   38    │ 'BTCUSD' │  9233  │ 'Buy'  │  30296  │
│   39    │ 'BTCUSD' │ 9232.5 │ 'Buy'  │ 196676  │
│   40    │ 'BTCUSD' │  9232  │ 'Buy'  │  82840  │
│   41    │ 'BTCUSD' │ 9231.5 │ 'Buy'  │ 105854  │
│   42    │ 'BTCUSD' │  9231  │ 'Buy'  │  1671   │
│   43    │ 'BTCUSD' │ 9230.5 │ 'Buy'  │  25909  │
│   44    │ 'BTCUSD' │  9230  │ 'Buy'  │ 146198  │
│   45    │ 'BTCUSD' │ 9229.5 │ 'Buy'  │  95941  │
│   46    │ 'BTCUSD' │  9229  │ 'Buy'  │  61212  │
│   47    │ 'BTCUSD' │ 9228.5 │ 'Buy'  │  76966  │
│   48    │ 'BTCUSD' │  9228  │ 'Buy'  │  93996  │
│   49    │ 'BTCUSD' │ 9227.5 │ 'Buy'  │  44058  │
└─────────┴──────────┴────────┴────────┴─────────┘
```

## Accessing State

Access orderbook state using the OrderBooksStore.

```javascript
const btcOrderBook = OrderBooks.getBook('BTCUSD');

// Get an array dump of the current orderbook state (similar to what you see on exchange websites)
const btcOrderBookState = btcOrderBook.getBookState();
console.log('Current book state: ', JSON.stringify(btcOrderBookState));

const bestBid = btcOrderBook.getBestBid();
// bestBid = 9239.5

const secondBestBid = btcOrderBook.getBestBid(1);
// secondBestBid = 9239

const bestAsk = btcOrderBook.getBestAsk();
// bestAsk = 9040

const secondBestAsk = btcOrderBook.getBestAsk(1);
// secondBestAsk = 9040.5

const currentSpread = btcORderBook.getSpreadPercent();
// currentSpread = 0.01
```

## Utility Methods

The following ultity methods are exposed for each book:

```javascript
const btcOrderBook = OrderBooks.getBook('BTCUSD');

// console.log current orderbook state
btcOrderBook.print();

// clear current orderbook to free memory
btcOrderBook.reset();
```

<!-- template_contributions -->

## Contributions & Thanks

Have my projects helped you? Share the love, there are many ways you can show your thanks:

- Star & share my projects.
- Are my projects useful? Sponsor me on Github and support my effort to maintain & improve them: https://github.com/sponsors/tiagosiebler
- Have an interesting project? Get in touch & invite me to it.
- Or buy me all the coffee:
  - ETH(ERC20): `0xA3Bda8BecaB4DCdA539Dc16F9C54a592553Be06C` <!-- metamask -->

<!-- template_contributions_end -->

<!-- template_star_history -->

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=tiagosiebler/bybit-api,tiagosiebler/okx-api,tiagosiebler/binance,tiagosiebler/bitget-api,tiagosiebler/bitmart-api,tiagosiebler/gateio-api,tiagosiebler/kucoin-api,tiagosiebler/coinbase-api,tiagosiebler/orderbooks,tiagosiebler/accountstate,tiagosiebler/awesome-crypto-examples&type=Date)](https://star-history.com/#tiagosiebler/bybit-api&tiagosiebler/okx-api&tiagosiebler/binance&tiagosiebler/bitget-api&tiagosiebler/bitmart-api&tiagosiebler/gateio-api&tiagosiebler/kucoin-api&tiagosiebler/coinbase-api&tiagosiebler/orderbooks&tiagosiebler/accountstate&tiagosiebler/awesome-crypto-examples&Date)

<!-- template_star_history_end -->
