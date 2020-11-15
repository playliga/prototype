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
        name: 'Elite',
        stats: {
          skill: 100,
          aggression: 100,
          reactionTime: 0.2,
          attackDelay: 0,
        }
      },
      {
        name: 'Expert',
        stats: {
          skill: 90,
          aggression: 90,
          reactionTime: 0.2,
          attackDelay: 0,
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
        skill: 80,
        aggression: 80,
        reactionTime: 0.25,
        attackDelay: 0
      }
    }],
  },
  {
    name: 'Main',
    order: 2,
    difficulty: 2,
    templates: [
      {
        name: 'Hard',
        stats: {
          skill: 75,
          aggression: 75,
          reactionTime: 0.25,
          attackDelay: 0,
        }
      },
      {
        name: 'Tough',
        stats: {
          skill: 60,
          aggression: 60,
          reactionTime: 0.3,
          attackDelay: 0.35,
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
        name: 'Normal',
        stats: {
          skill: 50,
          aggression: 50,
          reactionTime: 0.4,
          attackDelay: 0.7,
        }
      },
      {
        name: 'Fair',
        stats: {
          skill: 25,
          aggression: 30,
          reactionTime: 0.4,
          attackDelay: 1.0,
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
        aggression: 20,
        reactionTime: 0.5,
        attackDelay: 1.5,
      }
    }]
  }
];
