import { Tournament } from '../../league/types';
import adjectiveAnimal from 'adjective-animal';
import Score from '../../worldgen/score';
import Stage from '../stage';


export function generateScore( allowDraw = true ) {
  return Score(
    { tier: 1, id: 'foo' },
    { tier: 2, id: 'bar' },
    allowDraw
  );
}


export function generateGroupStageScores( tourneyObj: Tournament ) {
  const { matches } = tourneyObj;
  matches.forEach( matchObj => {
    tourneyObj.score( matchObj.id, generateScore() );
  });
}


export function generatePlayoffScores( tourneyObj: Tournament ) {
  tourneyObj.matches.forEach( match => {
    const result = generateScore( false );
    if( tourneyObj.unscorable( match.id, result ) === null ) {
      tourneyObj.score( match.id, result );
    }
  });
}


describe( 'global circuit stage', () => {
  const CUP_NAME = 'Global Circuit Stage';
  const NUM_COMPETITORS = 16;

  let stageObj: Stage;

  beforeEach( () => {
    // populate with competitors
    stageObj = new Stage( CUP_NAME, NUM_COMPETITORS, 4, false );

    for( let i = 0; i < NUM_COMPETITORS; i++ ) {
      stageObj.addCompetitor( i, adjectiveAnimal.generateName(), 1 );
    }

    stageObj.start();
  });

  it( 'adds a competitor', () => {
    const TEAM_NAME = 'compLexity Gaming';
    const stageObj = new Stage( CUP_NAME );
    stageObj.addCompetitor( 1337, TEAM_NAME, 1 );

    expect( stageObj.competitors ).toEqual(
      [{ id: 1337, name: TEAM_NAME, tier: 1 }]
    );
  });

  it( 'adds an array of competitors', () => {
    const TEAM_NAME = 'Rival';
    const TEAM_ARRAY = [
      { id: 1, name: 'compLexity Gaming', tier: 4 },
      { id: 2, name: 'Team 3D', tier: 4 },
      { id: 3, name: 'Evil Geniuses', tier: 4 }
    ];
    const stageObj = new Stage( CUP_NAME );
    stageObj.addCompetitor( 1337, TEAM_NAME, 1 );
    stageObj.addCompetitors( TEAM_ARRAY );

    expect( stageObj.competitors ).toEqual( [
      { id: 1337, name: TEAM_NAME, tier: 1 },
      ...TEAM_ARRAY
    ] );
  });

  it( 'starts the group stage', () => {
    expect( stageObj.groupObj ).toBeDefined();
    expect( stageObj.started ).toBeTruthy();
  });

  it( 'saves and restores match metadata', () => {
    const MAP = 'de_dust2';
    const [ match ] = stageObj.groupObj.matches;
    match.data = { map: MAP };

    const data = stageObj.save();
    const newstageObj = Stage.restore({ ...data });
    const [ newmatch ] = newstageObj.groupObj.matches;
    expect( newmatch.data.map === MAP );
  });

  it( 'start flag is toggled on', () => {
    stageObj.start();
    expect( stageObj.started ).toBeTruthy();
  });

  it( 'checks that all group stage matches are done', () => {
    stageObj.start();
    generateGroupStageScores( stageObj.groupObj );
    expect( stageObj.isDone() ).toBeTruthy();
    expect( stageObj.isGroupStageDone() ).toBeTruthy();
  });

  it( 'checks that playoffs are done', () => {
    stageObj.start();
    stageObj.playoffs = true;
    generateGroupStageScores( stageObj.groupObj );
    expect( stageObj.isDone() ).toBeFalsy();
    expect( stageObj.startPlayoffs() ).toBeTruthy();
    generatePlayoffScores( stageObj.duelObj );
    expect( stageObj.isDone() ).toBeTruthy();
  });

  it( 'sorts results into groups', () => {
    stageObj.start();
    generateGroupStageScores( stageObj.groupObj );

    // grab results and tourney data
    const results = stageObj.getGroupResults();
    const numGroups = stageObj.groupObj.sections().length;

    // number of items in results should match num of groups
    expect( results.length ).toEqual( numGroups );

    // top row of each group should be pos: 1
    results.forEach( group => expect( group[ 0 ].pos ).toEqual( 1 ) );
  });
});
