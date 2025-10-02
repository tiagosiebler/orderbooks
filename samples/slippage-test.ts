import {
  DefaultLogger,
  WebsocketClient
} from 'bybit-api';
import {
  OrderBookLevel,
  OrderBookLevelState,
  OrderBooksStore,
} from '../src';

// Create orderbook store with appropriate options
const OrderBooks = new OrderBooksStore({
  traceLog: true, // Set to true to see orderbook updates
  checkTimestamps: false,
  maxDepth: 500, // Ensure we have enough depth for testing
});

// Disable verbose logging from the Bybit client
DefaultLogger.trace = () => {};

// Connect to websocket and relay orderbook events to handlers
const ws = new WebsocketClient({
  market: 'v5',
});

// Flag to track if we've received the initial snapshot
let hasReceivedSnapshot = false;

// The symbol we're tracking
const SYMBOL = 'BTCUSDT';

ws.on('update', (message: any) => {
  // Check if this is an orderbook message
  if (message.topic && message.topic.startsWith('orderbook.') && (message.type === 'snapshot' || message.type === 'delta')) {
    handleOrderbookUpdate(message);
  }
});

ws.on('response', (response) => {
  console.log('Received response:', response);
});

ws.on('exception', (message) => {
  console.error(`Bybit WS error:`, message);
});

// Subscribe to the orderbook for BTCUSDT (50 levels depth)
ws.subscribeV5([`orderbook.500.${SYMBOL}`], 'linear');

// Parse orderbook messages and update our local orderbook
function handleOrderbookUpdate(message: any) {
  const { topic, type, data, ts } = message;
  const segments = topic.split('.');
  // The format is usually orderbook.DEPTH.SYMBOL
  const symbol = segments.length > 2 ? segments[2] : SYMBOL;
  
  console.log(`Received ${type} for ${symbol}`);

  if (!data || (!data.b && !data.a)) {
    console.error('Invalid orderbook data structure:', data);
    return;
  }

  const bidsArray = Array.isArray(data.b) ? data.b.map(([price, amount]: [string, string]) => {
    return OrderBookLevel(symbol, +price, 'Buy', +amount);
  }) : [];

  const asksArray = Array.isArray(data.a) ? data.a.map(([price, amount]: [string, string]) => {
    return OrderBookLevel(symbol, +price, 'Sell', +amount);
  }) : [];

  const allBidsAndAsks = [...bidsArray, ...asksArray];
  
  console.log(`Processing ${bidsArray.length} bids and ${asksArray.length} asks`);

  if (type === 'snapshot') {
    // Store initial snapshot
    OrderBooks.handleSnapshot(
      symbol,
      allBidsAndAsks,
      ts || Date.now(),
    );
    
    hasReceivedSnapshot = true;
    console.log(`Stored initial orderbook snapshot for ${symbol}`);
    
    return;
  }

  if (type === 'delta') {
    const upsertLevels: OrderBookLevelState[] = [];
    const deleteLevels: OrderBookLevelState[] = [];

    // Separate "deletes" from "updates/inserts"
    allBidsAndAsks.forEach((level) => {
      const [_symbol, _price, _side, qty] = level;

      if (qty === 0) {
        deleteLevels.push(level);
      } else {
        upsertLevels.push(level);
      }
    });

    // Feed delta into orderbook store
    OrderBooks.handleDelta(
      symbol,
      deleteLevels,
      upsertLevels,
      [],
      ts || Date.now(),
    );

    console.log(`Updated orderbook: deleted ${deleteLevels.length} levels, upserted ${upsertLevels.length} levels`);
    return;
  }

  console.error('Unhandled orderbook update type:', type);
}

// Calculate and display slippage for various order sizes after waiting for the orderbook to fill
setTimeout(() => {
  if (!hasReceivedSnapshot) {
    console.error('No orderbook snapshot received yet. Try again later.');
    process.exit(1);
  }
  
  // Get the current book state for analysis
  const book = OrderBooks.getBook(SYMBOL);
  const bookState = book.getBookState();
  
  console.log(`Current orderbook has ${bookState.length} levels`);
  
  // Display orderbook summary
  console.log('\n========== ORDERBOOK SUMMARY ==========');
  console.log(`Symbol: ${SYMBOL}`);
  console.log(`Best Bid: ${book.getBestBid()}`);
  console.log(`Best Ask: ${book.getBestAsk()}`);
  console.log(`Spread: ${book.getSpreadBasisPoints()?.toFixed(2)} basis points`);
  console.log('=======================================\n');
  
  // Test order sizes (in BTC)
  const testOrderSizes = [0.01, 0.05, 0.1, 0.5, 1, 5, 100];
  
  // Calculate slippage for buy orders of different sizes
  console.log('===== BUY ORDER SLIPPAGE =====');
  testOrderSizes.forEach(size => {
    try {
      const slippage = book.getEstimatedSlippage(size, 'Buy');
      if (slippage) {
        console.log(`Order Size: ${size} BTC`);
        console.log(`Execution Price: ${slippage.executionPrice.toFixed(2)} USDT`);
        console.log(`Slippage: ${slippage.slippagePercent.toFixed(4)}% (${slippage.slippageBasisPoints.toFixed(2)} bps)`);
        console.log('----------------------------');
      }
    } catch (error) {
      console.log(`Order Size: ${size} BTC - ${error.message}`);
      console.log('----------------------------');
    }
  });
  
  // Calculate slippage for sell orders of different sizes
  console.log('\n===== SELL ORDER SLIPPAGE =====');
  testOrderSizes.forEach(size => {
    try {
      const slippage = book.getEstimatedSlippage(size, 'Sell');
      if (slippage) {
        console.log(`Order Size: ${size} BTC`);
        console.log(`Execution Price: ${slippage.executionPrice.toFixed(2)} USDT`);
        console.log(`Slippage: ${slippage.slippagePercent.toFixed(4)}% (${slippage.slippageBasisPoints.toFixed(2)} bps)`);
        console.log('----------------------------');
      }
    } catch (error) {
      console.log(`Order Size: ${size} BTC - ${error.message}`);
      console.log('----------------------------');
    }
  });
  
  // Close the websocket connection and exit
  console.log('\nTest complete, exiting...');
  // Just exit the process, the WebSocket will close automatically
  process.exit(0);
  
}, 15000); // Wait 15 seconds for the orderbook to fill with data

console.log(`Connecting to Bybit and subscribing to ${SYMBOL} orderbook...`);
console.log('Waiting 15 seconds to collect orderbook data...'); 