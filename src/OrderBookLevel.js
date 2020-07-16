/**
 * One level in orderbook
 * @param {string} symbol
 * @param {number} price
 * @param {string} [side='Buy'|'Sell']
 * @param {number} qty asset at this level
 */
const OrderBookLevel = (symbol, price, side, qty, ...extraState) => {
  const level = [symbol, price, side, qty];
  if (extraState.length) {
    level.push(extraState);
  }
  return level;
}

module.exports = OrderBookLevel;