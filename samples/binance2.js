const api = require('binance');
const { OrderBooksStore, OrderBookLevel } = require('../src');

const binanceWS = new api.BinanceWS(true);
const binanceRest = new api.BinanceRest({
  disableBeautification: false,
  handleDrift: true
});

const OrderBooks = new OrderBooksStore({ traceLog: true, checkTimestamps: false, maxDepth: 40 });

// connect to a websocket and relay orderbook events to handlers
const symbol = 'BTCUSDT';
binanceWS.onDepthLevelUpdate(symbol, 20, depth => {
  console.clear();
  return handleOrderbookSnapshot(symbol, depth);
});

// get initial book snapshot
binanceRest.depth(symbol).then(results => handleOrderbookSnapshot(symbol, results));

// This binance module only provides full snapshots
const handleOrderbookSnapshot = (symbol, snapshot) => {
  // combine bids and asks
  const { bids, asks } = snapshot;

  const bidsArray = bids.map(([price, amount]) => {
    return OrderBookLevel(symbol, +price, 'Buy', +amount);
  });

  const asksArray = asks.map(([price, amount]) => {
    return OrderBookLevel(symbol, +price, 'Sell', +amount);
  });

  // store inititial snapshot
  OrderBooks.handleSnapshot(
    symbol,
    [...bidsArray, ...asksArray],
    new Date().getTime()
  ).print();
}