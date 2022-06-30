import OrderBook, { OrderBookOptions } from './OrderBook';
import { OrderBookLevelState } from './OrderBookLevel';

/**
 * Store for multi-symbol orderbooks, grouped into one book (OrderBook) per symbol
 * @class OrderBooksStore
 */
export class OrderBooksStore {
  books: Record<string, OrderBook> = {};
  traceLog: boolean;
  shouldCheckTimestamp: boolean;
  maxDepth: number;

  constructor(options?: OrderBookOptions) {
    this.books = {};
    this.traceLog = options?.traceLog === true;
    this.shouldCheckTimestamp = options?.checkTimestamps === true;
    this.maxDepth = options?.maxDepth || 250;
  }

  /**
   * @param {string} symbol
   * @returns {OrderBook} created for symbol if not already tracked
   */
  public getBook(symbol: string): OrderBook {
    if (this.books[symbol]) {
      return this.books[symbol];
    }

    this.books[symbol] = new OrderBook(symbol, {
      checkTimestamps: this.shouldCheckTimestamp,
      maxDepth: this.maxDepth,
    });

    return this.books[symbol];
  }

  /**
   * @public Store/replace existing orderbook state in-memory
   *
   * @param {string} symbol
   * @param {Array} current orderbook snapshot represented as array, where each child element is a level in the orderbook
   * @param {number} timestamp
   * @returns {OrderBook} that handled this event
   */
  public handleSnapshot(
    symbol: string,
    data: OrderBookLevelState,
    timestamp: number = Date.now(),
  ): OrderBook {
    if (this.traceLog) {
      console.log('handleSnapshot ', symbol, timestamp);
    }
    return this.getBook(symbol).handleSnapshot(data, timestamp);
  }

  /**
   * @public Update existing orderbook state in-memory
   *
   * @param {string} symbol
   * @param {Array} deleteLevels - array with levels to delete
   * @param {Array} updateLevels - array with levels to update
   * @param {Array} insertLevels - array with levels to insert
   * @param {number} timestamp
   * @returns {OrderBook} that handled this event
   */
  public handleDelta(
    symbol: string,
    deleteLevels: OrderBookLevelState[] | undefined,
    updateLevels: OrderBookLevelState[] | undefined,
    insertLevels: OrderBookLevelState[] | undefined,
    timestamp: number = Date.now(),
  ): OrderBook {
    if (this.traceLog) {
      console.log('handleDelta ', symbol, timestamp);
    }
    return this.getBook(symbol).handleDelta(
      deleteLevels,
      updateLevels,
      insertLevels,
      timestamp,
    );
  }
}
