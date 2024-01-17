import {
  getContextFromWsKey,
  isWsPartialBookDepthEventFormatted,
  MainClient,
  OrderBookResponse,
  WebsocketClient,
} from 'binance';
// import { OrderBookLevel, OrderBooksStore } from '../src';
import { OrderBookLevel, OrderBooksStore } from 'orderbooks';

const binanceWs = new WebsocketClient({
  beautify: true,
});
const binanceRest = new MainClient();

const OrderBooks = new OrderBooksStore({
  traceLog: true,
  checkTimestamps: false,
  maxDepth: 40,
});

// This example just dumps full snapshots into the orderbook store
function handleOrderbookSnapshot(symbol: string, snapshot: OrderBookResponse) {
  // combine bids and asks
  const { bids, asks } = snapshot;

  const bidsArray = bids.map(([price, amount]) => {
    return OrderBookLevel(symbol, +price, 'Buy', +amount);
  });

  const asksArray = asks.map(([price, amount]) => {
    return OrderBookLevel(symbol, +price, 'Sell', +amount);
  });

  // store inititial snapshot
  const storedOrderbook = OrderBooks.handleSnapshot(
    symbol,
    [...bidsArray, ...asksArray],
    snapshot.lastUpdateId,
  );

  // log book state to screen
  storedOrderbook.print();
}

// connect to a websocket and relay orderbook events to handlers
const symbol = 'BTCUSDT';

binanceWs.on('error', (msg) => {
  console.error(new Date(), `Binance WS Error`, msg);
});

binanceWs.on('open', (data) => {
  console.log(
    new Date(),
    'Binance WS connection opened open:',
    data.wsKey,
    data.ws.target.url,
  );
});
binanceWs.on('reply', (data) => {
  console.log(
    new Date(),
    'Binance WS log reply: ',
    JSON.stringify(data, null, 2),
  );
});
binanceWs.on('reconnecting', (data) => {
  console.log(
    new Date(),
    'Binance WS ws automatically reconnecting.... ',
    data?.wsKey,
  );
});
binanceWs.on('reconnected', (data) => {
  console.log(new Date(), 'Binance WS ws has reconnected ', data?.wsKey);
});

binanceWs.on('formattedMessage', (data) => {
  // https://github.com/tiagosiebler/binance/blob/master/examples/ws-public-spot-orderbook.ts#L34
  if (isWsPartialBookDepthEventFormatted(data)) {
    const context = getContextFromWsKey(data.wsKey);

    if (!context?.symbol) {
      throw new Error(`Failed to extract context from event?`);
    }

    console.clear();
    handleOrderbookSnapshot(context.symbol.toUpperCase(), data);
    return;
  }
});

async function startOrderbookMonitoring() {
  try {
    const snapshot = await binanceRest.getOrderBook({
      symbol,
    });

    handleOrderbookSnapshot(symbol.toUpperCase(), snapshot);
  } catch (e) {
    console.error(`Failed to fetch orderbook snapshot via REST API`, e);
    throw e;
  }

  binanceWs.subscribePartialBookDepths(symbol, 20, 100, 'spot');
}

startOrderbookMonitoring();
