type Symbol = string;
type Price = number;
type Side = 'Buy' | 'Sell';
type Quantity = number;

export type OrderBookLevelState<T = unknown> = [
  Symbol,
  Price,
  Side,
  Quantity,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (T[] | any)?,
];

/**
 * One level in orderbook
 * @param {string} symbol
 * @param {number} price
 * @param {string} [side='Buy'|'Sell']
 * @param {number} qty asset at this level
 */
export function OrderBookLevel<T>(
  symbol: string,
  price: number,
  side: Side,
  qty: Quantity,
  ...extraState: T[]
) {
  const level: OrderBookLevelState<T> = [symbol, price, side, qty, undefined];
  if (extraState.length) {
    level.push(extraState);
  }
  return level;
}
