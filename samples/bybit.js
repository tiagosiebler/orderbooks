const { WebsocketClient, DefaultLogger } = require('@pxtrn/bybit-api');
const { OrderBooksStore, OrderBookLevel } = require('orderbooks');

const OrderBooks = new OrderBooksStore({ traceLog: true, checkTimestamps: false });

// connect to a websocket and relay orderbook events to handlers
DefaultLogger.silly = () => {};
const ws = new WebsocketClient({ livenet: true });
ws.on('update', message => {
  if (message.topic.toLowerCase().startsWith('orderbook')) {
    return handleOrderbookUpdate(message);
  }
});
ws.subscribe('orderBookL2_25.BTCUSD');

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

// Low level map of exchange properties to expected local properties
const mapBybitBookSlice = level => {
  return OrderBookLevel(level.symbol, +level.price, level.side, level.size);
};
