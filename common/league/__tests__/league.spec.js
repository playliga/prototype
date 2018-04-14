import League from '../league';

describe( 'league', () => {
  it( 'DEBUG: sample use-case', () => {
    // each division is a groupstage instance
    const leagueObj = new League( 'my league' );
    leagueObj.addDivision( 'Open', 256 );
    leagueObj.addDivision( 'Intermediate', 128 );
    leagueObj.addDivision( 'Main', 64 );
    leagueObj.addDivision( 'Premier', 32 );
    leagueObj.addDivision( 'Invite', 16 );

    // we aggregate the teams until start is called which is when
    // the groupstage object is instantiated
    const divOpen = leagueObj.getDivision( 'Open' );
    divOpen.addCompetitor( 'SK Gaming' );
    divOpen.addCompetitors([ 'Team 3D', 'Forza E-Sports', '...', 'Paradox Gaming' ]);

    // keep a copy of the groupstage object and store into memory
    // groupstage lib makes each competitor face *all* others in same group.
    // split each division into "conferences" where each competitor only plays N matches
    leagueObj.start();
  });
});