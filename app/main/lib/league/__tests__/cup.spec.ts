import { Tournament, Match } from '../types';
import adjectiveAnimal from 'adjective-animal';
import Score from '../../worldgen/score';
import Cup from '../cup';


function generateScore() {
  return Score(
    { tier: 1, id: 'foo' },
    { tier: 2, id: 'bar' }
  );
}


function generateMatchScore( match: Match, duelObj: Tournament ) {
  const result = generateScore();
  const reason = duelObj.unscorable( match.id, result );

  if( !reason ) {
    duelObj.score( match.id, result );
  }
}


function generateRoundScores( duelObj: Tournament ) {
  duelObj.rounds().forEach( rnd => {
    rnd.forEach( m => generateMatchScore( m, duelObj ) );
  });
}


describe( 'cup', () => {
  const CUP_NAME = 'Cup Competition';
  const NUM_COMPETITORS = 16;

  let cupobj: Cup;

  beforeEach( () => {
    // populate cup with competitors
    cupobj = new Cup( CUP_NAME );

    for( let i = 0; i < NUM_COMPETITORS; i++ ) {
      cupobj.addCompetitor( i, adjectiveAnimal.generateName() );
    }

    cupobj.start();
  });

  it( 'adds a competitor', () => {
    const TEAM_NAME = 'compLexity Gaming';
    const cupobj = new Cup( CUP_NAME );
    cupobj.addCompetitor( 1337, TEAM_NAME );

    expect( cupobj.competitors ).toEqual(
      [{ id: 1337, name: TEAM_NAME }]
    );
  });

  it( 'adds an array of competitors', () => {
    const TEAM_NAME = 'Rival';
    const TEAM_ARRAY = [
      { id: 1, name: 'compLexity Gaming' },
      { id: 2, name: 'Team 3D' },
      { id: 3, name: 'Evil Geniuses' }
    ];
    const cupobj = new Cup( CUP_NAME );
    cupobj.addCompetitor( 1337, TEAM_NAME );
    cupobj.addCompetitors( TEAM_ARRAY );

    expect( cupobj.competitors ).toEqual( [
      { id: 1337, name: TEAM_NAME },
      ...TEAM_ARRAY
    ] );
  });

  it( 'starts the cup', () => {
    expect( cupobj.duelObj ).toBeDefined();
    expect( cupobj.started ).toBeTruthy();
  });

  it( 'saves and restores match metadata', () => {
    const MAP = 'de_dust2';
    const [ match ] = cupobj.duelObj.matches;
    match.data = { map: MAP };

    const data = cupobj.save();
    const newcupobj = Cup.restore({ ...data });
    const [ newmatch ] = newcupobj.duelObj.matches;
    expect( newmatch.data.map === MAP );
  });

  it( 'finishes a cup', () => {
    generateRoundScores( cupobj.duelObj );
    expect( cupobj.duelObj.isDone() ).toBeTruthy();
    expect( cupobj.duelObj.currentRound() ).toBeUndefined();
  });

  it( 'iterates thru rounds and generates scores', () => {
    const { duelObj } = cupobj;
    const numrounds = duelObj.rounds().length;

    // numrounds.length === 4 rounds
    let round = duelObj.currentRound();

    for( let i = 0; i < numrounds; i++ ) {
      round.forEach( m => generateMatchScore( m, duelObj ) );
      round = duelObj.currentRound();
    }

    expect( duelObj.currentRound() ).toBeUndefined();
    expect( duelObj.isDone() ).toBeTruthy();
  });
});
