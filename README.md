# OrderBooks Store

A minimal set of utilities for handling orderbook snapshots and delta updates, with bybit examples.

## Contributions & Thanks
If you found this project interesting or useful, create accounts with my referral links:
- [Bybit](https://www.bybit.com/en-US/register?affiliate_id=9410&language=en-US&group_id=0&group_type=1)
- [Binance](https://www.binance.com/en/register?ref=20983262)

Or feed my coffee addiction using any of these:
- BTC: `1C6GWZL1XW3jrjpPTS863XtZiXL1aTK7Jk`
- ETH (ERC20): `0xd773d8e6a50758e1ada699bb6c4f98bb4abf82da`

## Project Contributions
Contributions are very welcome, I will review any incoming pull requests. See the issues tab for todo items.

## Features
- Handle snapshot and delta orderbook events.
- Track multiple symbol orderbooks.
- Easily access best bid/ask prices.
- Easily access spread percent between bid/ask price.
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
const traceLog = true;
const OrderBooks = new OrderBooksStore(traceLog);
```
- Feed snapshot and delta updates into OrderBooks.handle() methods.

## Real Example - Bybit
- Import modules
- Prepare OrderBooks store instance
- Connect to OrderBooks websockets
- Map event properties to expected key:value pairs
- Feed mapped snapshot and delta events into OrderBooks.handle() methods

```javascript
const { OrderBooksStore, OrderBookLevel } = require('orderbooks');
const { WebsocketClient, DefaultLogger } = require('@pxtrn/bybit-api');
DefaultLogger.silly = () => {};

const OrderBooks = new OrderBooksStore({ traceLog: true, checkTimestamps: false });

// Low level map of exchange properties to expected local properties
const mapBybitBookSlice = level => {
  return OrderBookLevel(level.symbol, +level.price, level.side, level.size);
};

// parse orderbook messages, detect snapshot vs delta, and format properties using OrderBookLevel
const handleOrderbookUpdate = message => {
  const { topic, type, data, timestamp_e6 } = message;
  const [ topicKey, symbol ] = topic.split('.');

  if (type == 'snapshot') {
    return OrderBooks.handleSnapshot(symbol, data.map(mapBybitBookSlice), timestamp_e6 / 1000, message).print();
  }

  if (type == 'delta') {
    const deleteLevels = data.delete.map(mapBybitBookSlice);
    const updateLevels = data.update.map(mapBybitBookSlice);
    const insertLevels = data.insert.map(mapBybitBookSlice);
    return OrderBooks.handleDelta(
      symbol,
      deleteLevels,
      updateLevels,
      insertLevels,
      timestamp_e6 / 1000
    ).print();
  }

  console.error('unhandled orderbook update type: ', type);
}

const ws = new WebsocketClient({ livenet: true });
ws.on('update', message => {
  if (message.topic.toLowerCase().startsWith('orderbook')) {
    return handleOrderbookUpdate(message);
  }
});

ws.subscribe('orderBookL2_25.BTCUSD');
```

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

### Accessing State
Access orderbook state using the OrderBooksStore.

```javascript
const btcOrderBook = OrderBooks.getBook('BTCUSD');

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