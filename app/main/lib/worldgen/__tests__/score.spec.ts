import Score from '../score';


let teams: any[];


describe( 'score simulator', () => {
  beforeAll( () => {
    teams = [
      { tier: 0, id: 'PREMIER' },
      { tier: 1, id: 'ADVANCED' },
      { tier: 2, id: 'MAIN' },
      { tier: 3, id: 'INTERMEDIATE' },
      { tier: 4, id: 'OPEN' },
    ];
  });

  it( 'generates scores', () => {
    teams.forEach( team_a => {
      const others = teams.filter( team_b => team_b.id !== team_a.id );
      others.forEach( team_b => {
        const result = Score( team_a, team_b );
        expect( Array.isArray( result ) ).toBeTruthy();
        expect( result ).toContain( 16 );
      });
    });
  });

  it( 'does not allow draws', () => {
    teams.forEach( team_a => {
      const others = teams.filter( team_b => team_b.id !== team_a.id );
      others.forEach( team_b => {
        const result = Score( team_a, team_b );
        expect( result[ 0 ] ).not.toBe( result[ 1 ] );
      });
    });
  });

  it( 'generates scores (allows draws)', () => {
    teams.forEach( team_a => {
      const others = teams.filter( team_b => team_b.id !== team_a.id );
      others.forEach( team_b => {
        const result = Score( team_a, team_b, true );
        expect( Array.isArray( result ) ).toBeTruthy();
      });
    });
  });

  it( 'considers player tier levels', () => {
    teams.forEach( team_a => {
      const others = teams.filter( team_b => team_b.id !== team_a.id );
      team_a.Players = new Array( 5 ).fill({ tier: team_a.tier });
      others.forEach( team_b => {
        team_b.Players = new Array( 5 ).fill({ tier: team_b.tier });
        const result = Score( team_a, team_b, true );
        expect( Array.isArray( result ) ).toBeTruthy();
      });
    });
  });
});
