import { OrderBookLevelState } from './OrderBookLevel';

const EnumLevelProperty = Object.freeze({
  symbol: 0,
  price: 1,
  side: 2,
  qty: 3,
  extraState: 4,
});

export interface OrderBookOptions {
  checkTimestamps?: boolean;
  maxDepth?: number;
  /** Whether to console.log when a snapshot or delta is processed */
  traceLog?: boolean;
}

/**
 * Storage helper to store/track/manipulate the current state of an symbol's orderbook
 * @class OrderBook
 */
export default class OrderBook {
  symbol: string;
  book: OrderBookLevelState<undefined>[];
  shouldCheckTimestamps: boolean;
  lastUpdateTimestamp: number;
  maxDepth: number;

  constructor(symbol: string, options: OrderBookOptions = {}) {
    this.symbol = symbol;
    this.book = [];

    this.shouldCheckTimestamps = options.checkTimestamps === true;
    this.lastUpdateTimestamp = new Date().getTime();
    this.maxDepth = options.maxDepth || 250;
  }

  /**
   * @public Process orderbook snapshot, replacing existing book in memory
   * @param {OrderBookLevelState[]} current orderbook snapshot represented as array, where each child element is a level in the orderbook
   * @param {number} timestamp
   */
  public handleSnapshot<ExtraStateType = unknown>(
    data: OrderBookLevelState<ExtraStateType>[],
    timestamp: number = Date.now(),
  ): this {
    this.checkTimestamp(timestamp);
    this.book = data;
    return this.trimToMaxDepth().sort().trackDidUpdate(timestamp);
  }

  /**
   * @public Process orderbook delta change, either deleting, updating or inserting level data into the existing book. Price is used on each level to find existing index in tracked book state.
   *
   * @param {Array} [deleteDelta=[]] levels to delete
   * @param {Array} [updateDelta=[]] levels to update
   * @param {Array} [insertDelta=[]] levels to insert
   * @param {number} timestamp
   */
  public handleDelta(
    deleteDelta: OrderBookLevelState[] = [],
    updateDelta: OrderBookLevelState[] = [],
    insertDelta: OrderBookLevelState[] = [],
    timestamp: number = Date.now(),
  ): this {
    this.checkTimestamp(timestamp);

    deleteDelta.forEach((level) => {
      const existingIndex = this.findIndexForSlice(level);
      if (existingIndex !== -1) {
        this.book.splice(existingIndex, 1);
      }
    });

    updateDelta.forEach((level) => {
      const existingIndex = this.findIndexForSlice(level);
      if (existingIndex !== -1) {
        this.replaceLevelAtIndex(existingIndex, level);
      } else {
        this.insertLevel(level);
      }
    });

    insertDelta.forEach((level) => {
      const existingIndex = this.findIndexForSlice(level);
      if (existingIndex !== -1) {
        this.replaceLevelAtIndex(existingIndex, level);
      }
      this.insertLevel(level);
    });

    return this.trimToMaxDepth().sort().trackDidUpdate(timestamp);
  }

  /**
   * @private replace item at index, mutating existing book store
   */
  private replaceLevelAtIndex(i: number, level: OrderBookLevelState): this {
    this.book.splice(i, 1, level);
    return this;
  }

  /**
   * @private insert item, mutating existing book store
   */
  private insertLevel(level: OrderBookLevelState): this {
    this.book.push(level);
    return this;
  }

  /**
   * @private find index of level in book, using "price" property as primary key
   * @param {object} level
   * @returns {number} index of level in book, if found, else -1
   */
  private findIndexForSlice(level: OrderBookLevelState): number {
    return this.book.findIndex(
      (e) => e[EnumLevelProperty.price] === level[EnumLevelProperty.price],
    );
  }

  /**
   * @public throw error if current timestamp is older than last updated timestamp
   * @param {number} timestamp
   */
  public checkTimestamp(timestamp: number) {
    if (!this.shouldCheckTimestamps) {
      return false;
    }
    if (this.lastUpdateTimestamp > timestamp) {
      throw new Error(
        `Received data older than last tick: ${{
          lastUpdate: this.lastUpdateTimestamp,
          currentUpdate: timestamp,
        }}`,
      );
    }
  }

  /** Sort orderbook in memory, lowest price last, highest price first */
  private sort(): this {
    // sorts with lowest price last, highest price first
    this.book.sort(
      (a, b) => b[EnumLevelProperty.price] - a[EnumLevelProperty.price],
    );
    return this;
  }

  /** trim orderbook in place to max depth, evenly across both sides */
  private trimToMaxDepth(): this {
    const book = this.book;
    const maxDepth = this.maxDepth;
    if (book.length <= maxDepth) {
      return this;
    }

    const count = book.reduce(
      (acc, level) => {
        if (level[EnumLevelProperty.side] === 'Sell') {
          acc.sells++;
          return acc;
        }
        acc.buys++;
        return acc;
      },
      { buys: 0, sells: 0 },
    );

    const maxPerSide = +(maxDepth / 2).toFixed(0);

    const buysToTrim = count.buys - maxPerSide;
    const sellsToTrim = count.sells - maxPerSide;

    this.sort()
      .trimSideCount(buysToTrim, false)
      .trimSideCount(sellsToTrim, true);

    return this;
  }

  /**
   * Trim edges of orderbook to total target
   *
   * @param {number} [totalToTrim=0]
   * @param {boolean} shouldTrimTop - if true, trim from array beginning (top = sells) else from array end (bottom = buys)
   */
  private trimSideCount(
    totalToTrim: number = 0,
    shouldTrimTop?: boolean,
  ): this {
    if (totalToTrim <= 0) {
      return this;
    }

    const book = this.book;
    if (shouldTrimTop) {
      book.splice(0, totalToTrim);
      return this;
    }

    book.splice(book.length - totalToTrim - 1, totalToTrim);
    return this;
  }

  /** Track last updated timestamp */
  private trackDidUpdate(timestamp: number = new Date().getTime()): this {
    this.lastUpdateTimestamp = timestamp;
    return this;
  }

  /** dump orderbook state to console */
  public print() {
    // console.clear();
    console.log(
      `---------- ${
        this.symbol
      } ask:bid ${this.getBestAsk()}:${this.getBestBid()} & spread: ${this.getSpreadPercent()?.toFixed(
        5,
      )}%`,
    );
    console.table(this.book);
    return this;
  }

  /** empty current orderbook store to free memory */
  public reset() {
    this.book = [];
    return this;
  }

  /**
   * get lowest sell order
   * @param {number} [offset=0] offset from array centre (should be positive)
   * @returns {number} lowest seller price
   */
  public getBestAsk(offset: number = 0): number | null {
    const sellSide = this.book.filter(
      (e) => e[EnumLevelProperty.side] === 'Sell',
    );
    const index = sellSide.length - 1 - offset;
    const bottomSell = sellSide[Math.abs(index)];
    return bottomSell ? bottomSell[EnumLevelProperty.price] : null;
  }

  /**
   * get highest buy order price
   * @param {number} [offset=0] offset from array centre (should be positive)
   * @returns {number} highest buyer price
   */
  public getBestBid(offset: number = 0): number | null {
    const buySide = this.book.filter(
      (e) => e[EnumLevelProperty.side] === 'Buy',
    );
    const topBuy = buySide[Math.abs(offset)];
    return topBuy ? topBuy[EnumLevelProperty.price] : null;
  }

  /**
   * get current bid/ask spread percentage
   * @param {number} [n=0] offset from centre of book
   * @returns {number} percentage spread between best bid & ask
   */
  public getSpreadPercent(n = 0): number | null {
    const ask = this.getBestAsk(n);
    const bid = this.getBestBid(n);

    if (!bid || !ask) {
      return null;
    }
    return (1 - bid / ask) * 100;
  }
}
