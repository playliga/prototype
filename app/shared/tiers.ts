/**
 * Certain stats are better when you
 * subtract instead of add to them.
 */

export const statModifiers = {
  SUBTRACT: [ 'reactionTime', 'attackDelay' ],
};


/**
 * @note: order: useful when rendering in graphs
 *        and lower divisions should come first.
 *
 * @note: multiplier: used when simming games and
 *        calculating prob-weights for the team.
 *        this number is x5 (or squad size).
 */

const Tiers = [
  {
    name: 'Premier',
    order: 4,
    difficulty: 3,
    templates: [
      {
        name: 'Elite',
        multiplier: 20,         // 20x5=100
        stats: {
          skill: 100,
          aggression: 100,
          reactionTime: 0.2,
          attackDelay: 0,
        }
      },
      {
        name: 'Expert',
        multiplier: 18,
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
      multiplier: 10,           // 10x5=50
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
        multiplier: 5,          // 5x5=25
        stats: {
          skill: 75,
          aggression: 75,
          reactionTime: 0.25,
          attackDelay: 0,
        }
      },
      {
        name: 'Tough',
        multiplier: 4,
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
        multiplier: 2,          // 2x5=10
        stats: {
          skill: 50,
          aggression: 50,
          reactionTime: 0.4,
          attackDelay: 0.7,
        }
      },
      {
        name: 'Fair',
        multiplier: 2,
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
      multiplier: 1,
      stats: {
        skill: 1,
        aggression: 20,
        reactionTime: 0.5,
        attackDelay: 1.5,
      }
    }]
  }
];


export default Tiers;
