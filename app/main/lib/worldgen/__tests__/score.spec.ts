import Score from '../score';


let team1: any;
let team2: any;


describe( 'score simulator', () => {
  beforeAll( () => {
    team1 = { tier: 1, id: 123 };
    team2 = { tier: 2, id: 345 };
  });

  it( 'generates scores', () => {
    const ITERATIONS = 50;

    for( let i = 0; i < ITERATIONS; i++ ) {
      const result = Score( team1, team2 );
      expect( Array.isArray( result ) ).toBeTruthy();
      expect( result ).toContain( 16 );
    }
  });

  it( 'generates scores (allows draws)', () => {
    const ITERATIONS = 50;

    for( let i = 0; i < ITERATIONS; i++ ) {
      const result = Score( team1, team2, true );
      expect( Array.isArray( result ) ).toBeTruthy();
    }
  });

  it( 'considers player tier levels', () => {
    const ITERATIONS = 50;

    // append team
    team1.Players = new Array( 5 ).fill({ tier: team1.tier });
    team2.Players = new Array( 5 ).fill({ tier: team2.tier });

    for( let i = 0; i < ITERATIONS; i++ ) {
      const result = Score( team1, team2 );
      expect( Array.isArray( result ) ).toBeTruthy();
    }
  });
});
