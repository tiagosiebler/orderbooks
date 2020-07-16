const EnumLevelProperty = Object.freeze({
  symbol: 0,
  price: 1,
  side: 2,
  qty: 3,
  extraState: 4
});

/**
 * Storage helper to store/track/manipulate the current state of an orderbook, for a specific symbol
 * @class SymbolOrderBook
 */
class SymbolOrderBook {
  constructor(symbol = 'BTCUSDT', options = {}) {
    this.symbol = symbol;
    this.book = [];

    this.shouldCheckTimestamps = options.checkTimestamps;
    this.lastUpdateTimestamp = new Date().getTime();
    this.maxDepth = options.maxDepth || 250;
  }

  /**
   * @public Process orderbook snapshot, replacing existing book in memory
   *
   * @param {Array} current orderbook snapshot represented as array, where each child element is a level in the orderbook
   * @param {number} timestamp
   */
  handleSnapshot(data, timestamp) {
    this.checkTimestamp();
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
  handleDelta(deleteDelta = [], updateDelta = [], insertDelta = [], timestamp) {
    this.checkTimestamp();

    deleteDelta.forEach(level => {
      const existingIndex = this.findIndexForSlice(level);
      if (existingIndex != -1) {
        this.book.splice(existingIndex, 1);
      }
    });

    updateDelta.forEach(level => {
      const existingIndex = this.findIndexForSlice(level);
      if (existingIndex != -1) {
        this.replaceLevelAtIndex(existingIndex, level);
      } else {
        this.insertLevel(level);
      }
    });

    insertDelta.forEach(level => {
      const existingIndex = this.findIndexForSlice(level);
      if (existingIndex != -1) {
        this.replaceLevelAtIndex(existingIndex, level);
      }
      this.insertLevel(level);
    });

    return this.trimToMaxDepth().sort().trackDidUpdate(timestamp);
  }

  /**
   * @private replace item at index, mutating existing book store
   *
   * @param {number} index
   * @param {object} book level to replace existing level at index
   */
  replaceLevelAtIndex(i, level) {
    this.book.splice(i, 1, level);
    return this;
  }

  /**
   * @private insert item, mutating existing book store
   * @param {number} level
   */
  insertLevel(level) {
    this.book.push(level);
    return this;
  }

  /**
   * @private find index of level in book, using "price" property as primary key
   * @param {object} level
   * @returns {number} index of level in book, if found, else -1
   */
  findIndexForSlice(level) {
    return this.book.findIndex(e => e[EnumLevelProperty.price] == level[EnumLevelProperty.price]);
  }

  /**
   * @public throw error if current timestamp is older than last updated timestamp
   * @param {number} timestamp
   */
  checkTimestamp(timestamp) {
    if (!this.shouldCheckTimestamps) {
      return false;
    }
    if (this.lastUpdateTimestamp > timestamp) {
      throw new Error(`Received data older than last tick: ${{lastUpdate: this.lastUpdateTimestamp, currentUpdate: timestamp}}`);
    }
  }

  /**
   * @private sort orderbook in place, lowest price last, highest price first
   */
  sort() {
    // sorts with lowest price last, highest price first
    this.book.sort((a, b) => b[EnumLevelProperty.price] - a[EnumLevelProperty.price]);
    return this;
  }

  /**
   * @private trim orderbook in place to max depth, evenly across both sides
   */
  trimToMaxDepth() {
    const book = this.book;
    const maxDepth = this.maxDepth;
    if (book.length <= maxDepth) {
      return this;
    }

    const count = book.reduce((acc, level) => {
      if (level[EnumLevelProperty.side] == 'Sell') {
        acc.sells++;
        return acc;
      }
      acc.buys++;
      return acc;
    }, { buys: 0, sells: 0 });

    const maxPerSide = +(maxDepth / 2).toFixed(0);

    const buysToTrim = count.buys - maxPerSide;
    const sellsToTrim = count.sells - maxPerSide;

    this
      .sort()
      .trimSideCount(buysToTrim, false)
      .trimSideCount(sellsToTrim, true);

    return this;
  }

  /**
   * @private trim edges of orderbook to total
   *
   * @param {number} [totalToTrim=0]
   * @param {boolean} shouldTrimTop - if true, trim from array beginning (top = sells) else from array end (bottom = buys)
   */
  trimSideCount(totalToTrim = 0, shouldTrimTop) {
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

  /**
   * @private update last updated timestamp
   * @param {number} timestamp
   */
  trackDidUpdate(timestamp = new Date().getTime()) {
    this.lastUpdateTimestamp = timestamp;
    return this;
  }

  /**
   * @public dump orderbook state to console
   */
  print() {
    console.log(`---------- ${this.symbol} ask:bid ${this.getBestAsk()}:${this.getBestBid()} & spread: ${this.getSpreadPercent().toFixed(5)}%`);
    console.table(this.book);
    return this;
  }

  /**
   * @public empty current orderbook store to free memory
   */
  reset() {
    this.book = [];
    return this;
  }

  /**
   * @public get lowest sell order
   * @param {number} [n=0] offset from array centre (should be positive)
   * @returns {number} lowest seller price
   */
  getBestAsk(n = 0) {
    const sellSide = this.book.filter(e => e[EnumLevelProperty.side] == 'Sell');
    const index = sellSide.length - 1 - n;
    const bottomSell = sellSide[Math.abs(index)];
    return bottomSell && bottomSell[EnumLevelProperty.price];
  }

  /**
   * @public get highest buy order price
   * @param {number} [n=0] offset from array centre (should be positive)
   * @returns {number} highest buyer price
   */
  getBestBid(n = 0) {
    const buySide = this.book.filter(e => e[EnumLevelProperty.side] == 'Buy');
    const topBuy = buySide[Math.abs(n)];
    return topBuy && topBuy[EnumLevelProperty.price];
  }

  /**
   * @public get current bid/ask spread percentage
   * @param {number} [n=0] offset from centre of book
   * @returns {number} percentage spread between best bid & ask
   */
  getSpreadPercent(n = 0) {
    const ask = this.getBestAsk(n);
    const bid = this.getBestBid(n);
    return (1 - (bid / ask)) * 100;
  }
}

module.exports = SymbolOrderBook;