const Binance = require('node-binance-api');
const binance = new Binance().options({});

const { OrderBooksStore, OrderBookLevel } = require('../lib');

const OrderBooks = new OrderBooksStore({ traceLog: true, checkTimestamps: false, maxDepth: 50 });

// connect to a websocket and relay orderbook events to handlers
const symbol = 'BTCUSDT';
binance.websockets.depth([symbol], depth => {
  console.clear();
  if (depth.e == 'depthUpdate') {
    return handleOrderbookUpdate(depth);
  }
  debugger;
  console.log('unknown event type: ', depth);
});

// get initial book snapshot
binance.depth(symbol).then(results => {
  // combine bids and asks
  const { bids, asks } = results;

  const bidsArray = Object.keys(bids).map(price => {
    return OrderBookLevel(symbol, +price, 'Buy', +bids[price])
  });

  const asksArray = Object.keys(asks).map(price => {
    return OrderBookLevel(symbol, +price, 'Sell', +asks[price])
  });

  // store inititial snapshot
  OrderBooks.handleSnapshot(
    symbol,
    [...bidsArray, ...asksArray],
    new Date().getTime()
  ).print();
});

// process delta update event from websocket
const handleOrderbookUpdate = depth => {
  let { e:eventType, E:eventTime, s:symbol, u:updateId, b:bidDepth, a:askDepth } = depth;
  const deleteLevels = [];
  const upsertLevels = [];

  bidDepth.forEach(([ price, amount ]) => {
    assignLevel(OrderBookLevel(symbol, +price, 'Buy', +amount), upsertLevels, deleteLevels);
  });
  askDepth.forEach(([ price, amount ]) => {
    assignLevel(OrderBookLevel(symbol, +price, 'Sell', +amount), upsertLevels, deleteLevels);
  });

  // upsert/insert is automatically decided using price as primary key.
  // Binance has these mixed, so let the book handler decide
  const insertLevels = [];

  return OrderBooks.handleDelta(
    symbol,
    deleteLevels,
    upsertLevels,
    insertLevels,
    eventTime
  ).print();
};

// utility method to decide if a delta level is an upsert or deletion
const assignLevel = (level, updateArray, deleteArray) => {
  const qtyIndex = 3;
  if (level[qtyIndex]) {
    updateArray.push(level);
  } else {
    deleteArray.push(level);
  }
};
