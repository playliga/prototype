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
    order: 4,
    stats: {
      skill: 100,
    },
  },
  {
    name: 'Advanced',
    order: 3,
    stats: {
      skill: 75,
    },
  },
  {
    name: 'Main',
    order: 2,
    stats: {
      skill: 50,
    }
  },
  {
    name: 'Intermediate',
    order: 1,
    stats: {
      skill: 25,
    },
  },
  {
    name: 'Open',
    order: 0,
    stats: {
      skill: 1,
    }
  }
];
