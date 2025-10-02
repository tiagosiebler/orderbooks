import {
  DefaultLogger,
  isWsOrderbookEventV5,
  WebsocketClient,
  WSOrderbookEventV5,
} from 'bybit-api';
import {
  OrderBookLevel,
  OrderBookLevelState,
  OrderBooksStore,
} from 'orderbooks';
// import { OrderBookLevel, OrderBookLevelState, OrderBooksStore } from '../src';

const OrderBooks = new OrderBooksStore({
  traceLog: true,
  checkTimestamps: false,
});

// eslint-disable-next-line @typescript-eslint/no-empty-function
DefaultLogger.trace = () => {};

// connect to a websocket and relay orderbook events to handlers
const ws = new WebsocketClient({
  market: 'v5',
});

ws.on('update', (message) => {
  if (isWsOrderbookEventV5(message)) {
    // console.log('message', JSON.stringify(message, null, 2));
    handleOrderbookUpdate(message);
    return;
  }
});

ws.on('exception', (message) => {
  console.error(`bybit ws exception: `, message);
});

ws.subscribeV5(['orderbook.50.BTCUSDT'], 'spot');

// parse orderbook messages, detect snapshot vs delta, and format properties using OrderBookLevel
function handleOrderbookUpdate(message: WSOrderbookEventV5) {
  const { topic, type, data, cts } = message;
  const [topicKey, _depth, symbol] = topic.split('.');

  const bidsArray = data.b.map(([price, amount]) => {
    return OrderBookLevel(symbol, +price, 'Buy', +amount);
  });

  const asksArray = data.a.map(([price, amount]) => {
    return OrderBookLevel(symbol, +price, 'Sell', +amount);
  });

  const allBidsAndAsks = [...bidsArray, ...asksArray];

  if (type === 'snapshot') {
    // store inititial snapshot
    const storedOrderbook = OrderBooks.handleSnapshot(
      symbol,
      allBidsAndAsks,
      cts,
    );

    // log book state to screen
    storedOrderbook.print();
    return;
  }

  if (type === 'delta') {
    const upsertLevels: OrderBookLevelState[] = [];
    const deleteLevels: OrderBookLevelState[] = [];

    // Seperate "deletes" from "updates/inserts"
    allBidsAndAsks.forEach((level) => {
      const [_symbol, _price, _side, qty] = level;

      if (qty === 0) {
        deleteLevels.push(level);
      } else {
        upsertLevels.push(level);
      }
    });

    // Feed delta into orderbook store
    const storedOrderbook = OrderBooks.handleDelta(
      symbol,
      deleteLevels,
      upsertLevels,
      [],
      cts,
    );

    // log book state to screen
    storedOrderbook.print();
    return;
  }

  console.error('unhandled orderbook update type: ', type);
}
