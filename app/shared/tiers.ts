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
    difficulty: 3,
    stats: [
      {
        name: 'Expert',
        skill: 90,
      },
      {
        name: 'Elite',
        skill: 100,
      }
    ]
  },
  {
    name: 'Advanced',
    order: 3,
    difficulty: 2,
    stats: [{
      name: 'VeryHard',
      skill: 75,
    }],
  },
  {
    name: 'Main',
    order: 2,
    difficulty: 2,
    stats: [
      {
        name: 'Tough',
        skill: 60,
      },
      {
        name: 'Hard',
        skill: 75,
      }
    ]
  },
  {
    name: 'Intermediate',
    order: 1,
    difficulty: 1,
    stats: [
      {
        name: 'Fair',
        skill: 25,
      },
      {
        name: 'Normal',
        skill: 50,
      }
    ],
  },
  {
    name: 'Open',
    order: 0,
    difficulty: 0,
    stats: [{
      name: 'Easy',
      skill: 1,
    }]
  }
];
