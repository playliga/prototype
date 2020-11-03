// @note: multiplier: useful when generating scores
//
// @note: order: useful when rendering in graphs
//        and lower divisions should come first.

/**
 * Multipliers are every other prime number with
 * the exception of the bottom division:
 *
 * - 3, [5], 7, [11], 13, [17], 19, [23]
 */

export default [
  {
    name: 'Premier',
    multiplier: 23,
    order: 4,
  },
  {
    name: 'Advanced',
    multiplier: 17,
    order: 3,
  },
  {
    name: 'Main',
    multiplier: 11,
    order: 2,
  },
  {
    name: 'Intermediate',
    multiplier: 5,
    order: 1,
  },
  {
    name: 'Open',
    multiplier: 1,
    order: 0,
  }
];
