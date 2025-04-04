import { OrderBook, OrderBookOptions } from './OrderBook';
import { OrderBookLevelState } from './OrderBookLevel';

/**
 * Store for multi-symbol orderbooks, grouped into one book (OrderBook) per symbol
 *
 * `ExtraStateType` is optional extra state you may want to store with each orderbook level, completely optional. Inject a union type if desired.
 * @class OrderBooksStore
 */
export class OrderBooksStore<ExtraStateType = unknown> {
  books: Record<string, OrderBook<ExtraStateType>> = {};
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
   * Get the current orderbook store for a symbol. Automatically initialised (empty), if none exists yet.
   * @param {string} symbol
   * @returns {OrderBook} created for symbol if not already tracked
   */
  public getBook(symbol: string): OrderBook<ExtraStateType> {
    if (this.books[symbol]) {
      return this.books[symbol];
    }

    this.books[symbol] = new OrderBook<ExtraStateType>(symbol, {
      checkTimestamps: this.shouldCheckTimestamp,
      maxDepth: this.maxDepth,
    });

    return this.books[symbol];
  }

  /**
   * @public Store/replace existing orderbook state in-memory
   *
   * @param {string} symbol
   * @param {Array} data current orderbook snapshot represented as array, where each child element is a level in the orderbook
   * @param {number} timestamp
   * @returns {OrderBook} store instance that handled this event
   */
  public handleSnapshot(
    symbol: string,
    data: OrderBookLevelState[],
    timestamp: number = Date.now(),
  ): OrderBook<ExtraStateType> {
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
   * @returns {OrderBook} store instance that handled this event
   */
  public handleDelta(
    symbol: string,
    deleteLevels: OrderBookLevelState[] | undefined,
    updateLevels: OrderBookLevelState[] | undefined,
    insertLevels: OrderBookLevelState[] | undefined,
    timestamp: number = Date.now(),
  ): OrderBook<ExtraStateType> {
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

  /**
   * Calculate expected slippage for a market order of a given size for a specific symbol
   * @param {string} symbol - The trading symbol
   * @param {number} orderSize - The size of the order in base units
   * @param {string} side - 'Buy' or 'Sell' side of the order
   * @returns {{ executionPrice: number, slippagePercent: number, slippageBasisPoints: number } | null} - The expected execution price and slippage
   */
  public calculateSlippage(
    symbol: string,
    orderSize: number,
    side: 'Buy' | 'Sell',
  ) {
    return this.getBook(symbol).calculateSlippage(orderSize, side);
  }
}
