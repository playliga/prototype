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
    templates: [
      {
        name: 'Expert',
        stats: {
          skill: 90,
        }
      },
      {
        name: 'Elite',
        stats: {
          skill: 100,
        }
      }
    ]
  },
  {
    name: 'Advanced',
    order: 3,
    difficulty: 2,
    templates: [{
      name: 'VeryHard',
      stats: {
        skill: 75,
      }
    }],
  },
  {
    name: 'Main',
    order: 2,
    difficulty: 2,
    templates: [
      {
        name: 'Tough',
        stats: {
          skill: 60,
        }
      },
      {
        name: 'Hard',
        stats: {
          skill: 75,
        }
      }
    ]
  },
  {
    name: 'Intermediate',
    order: 1,
    difficulty: 1,
    templates: [
      {
        name: 'Fair',
        stats: {
          skill: 25,
        }
      },
      {
        name: 'Normal',
        stats: {
          skill: 50,
        }
      }
    ],
  },
  {
    name: 'Open',
    order: 0,
    difficulty: 0,
    templates: [{
      name: 'Easy',
      stats: {
        skill: 1,
      }
    }]
  }
];
