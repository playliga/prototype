import adjectiveAnimal from 'adjective-animal';
import League from '../league';

describe( 'league', () => {
  it( 'DEBUG: sample use-case', () => {
    // each division is a groupstage instance
    const O_SIZE = 256;
    const IM_SIZE = 128;
    const M_SIZE = 64;
    const P_SIZE = 32;
    const I_SIZE = 16;
    const leagueObj = new League( 'CAL' );
    leagueObj.addDivision( 'Open', O_SIZE, 8 );
    leagueObj.addDivision( 'Intermediate', IM_SIZE, 16 );
    leagueObj.addDivision( 'Main', M_SIZE, 16 );
    leagueObj.addDivision( 'Premier', P_SIZE, 16 );
    leagueObj.addDivision( 'Invite', I_SIZE, 16 );

    // we aggregate the teams until start is called which is when
    // the groupstage object is instantiated
    const divOpen = leagueObj.getDivision( 'Open' );
    for( let i = 0; i < O_SIZE; i++ ) {
      divOpen.addCompetitor( adjectiveAnimal.generateName() );
    }

    const divIM = leagueObj.getDivision( 'Intermediate' );
    for( let i = 0; i < IM_SIZE; i++ ) {
      divIM.addCompetitor( adjectiveAnimal.generateName() );
    }

    const divM = leagueObj.getDivision( 'Main' );
    for( let i = 0; i < M_SIZE; i++ ) {
      divM.addCompetitor( adjectiveAnimal.generateName() );
    }

    const divP = leagueObj.getDivision( 'Premier' );
    for( let i = 0; i < P_SIZE; i++ ) {
      divP.addCompetitor( adjectiveAnimal.generateName() );
    }

    const divI = leagueObj.getDivision( 'Invite' );
    for( let i = 0; i < I_SIZE; i++ ) {
      divI.addCompetitor( adjectiveAnimal.generateName() );
    }

    // keep a copy of the groupstage object and store into memory
    // groupstage lib makes each competitor face *all* others in same group.
    // split each division into "conferences" where each competitor only plays N matches
    leagueObj.start();
  });
});