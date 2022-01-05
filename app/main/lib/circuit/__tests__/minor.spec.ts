import adjectiveAnimal from 'adjective-animal';
import Minor from '../minor';
import { flatten, random } from 'lodash';
import { generateGroupStageScores, generatePlayoffScores } from './stage.spec';


function addStage( minorObj: Minor, stage: any ) {
  return minorObj.addStage( stage.name, stage.size, stage.groupSize, stage.playoffs || false );
}


function populateStage( stageObj: any, sdx: number, limit?: number ) {
  const total = limit || stageObj.size - stageObj.competitors.length;
  for( let i = 0; i < total; i++ ) {
    const uuid = sdx + random( 0, 255 );
    stageObj.addCompetitor( uuid, adjectiveAnimal.generateName() + uuid, 0 );
  }
}


describe( 'global circuit minor', () => {
  const NAME = 'Global Circuit: Minor';
  const DATA = {
    id: 'minor',
    name: 'Global Circuit: Minor',
    type: 'circuit:minor',
    stages: [
      {
        name: 'Open Qualifiers',
        meetTwice: false,
        size: 128,
        groupSize: 16,
        groupQualifyNum: 2
      },
      {
        name: 'Closed Qualifiers',
        meetTwice: false,
        size: 32,
        groupSize: 4,
        groupQualifyNum: 2
      },
      {
        name: 'Finals',
        meetTwice: false,
        size: 16,
        groupSize: 4,
        groupQualifyNum: 2,
        playoffs: true,
      },
    ]
  };
  let minorObj: Minor;

  beforeEach( () => {
    // create the stages
    minorObj = new Minor( NAME );
    DATA.stages.forEach( stage => addStage( minorObj, stage ) );

    // only populate open qualifiers
    populateStage( minorObj.stages[ 0 ], 0 );
  });

  it( 'starts the first stage', () => {
    expect( minorObj.start() ).toBeTruthy();
    expect( minorObj.started ).toBeTruthy();
    expect( minorObj.getCurrentStage().started ).toBeTruthy();
  });

  it( 'gets the latest stage that was started', () => {
    const [ firstStage ] = minorObj.stages;
    minorObj.start();
    expect( minorObj.getCurrentStage().name ).toEqual( firstStage.name );
  });

  it( 'does not start the next stage if current stage has pending matches', () => {
    minorObj.start();
    expect( minorObj.start() ).toBeFalsy();
  });

  it( 'starts the next stage after all current stage matches are completed', () => {
    // generate scores for the current stage
    minorObj.start();
    const currStage = minorObj.getCurrentStage();
    generateGroupStageScores( currStage.groupObj );

    // start the next stage
    minorObj.start();
    const [ , nextStage ] = minorObj.stages;
    expect( nextStage.started ).toBeTruthy();
  });

  it( 'moves open qualifier winners to closed qualifiers', () => {
    // generate scores for the current stage
    minorObj.start();
    const prevStage = minorObj.getCurrentStage();
    generateGroupStageScores( prevStage.groupObj );

    // start the next stage
    minorObj.start();
    const [ , nextStage ] = minorObj.stages;

    // grab the top two players from each group
    const winners = (
      flatten( prevStage.getGroupWinners() )
        .map( ctr => prevStage.getCompetitorBySeed( ctr.seed ) )
        .map( ctr => ctr.name )
    );

    // they should be moved to the next stage
    const nextStageCompetitors = nextStage.competitors.map( ctr => ctr.name );
    const prevStageWinners = expect.arrayContaining( winners );
    expect( nextStageCompetitors ).toEqual( prevStageWinners );
  });

  it( 'finishes all stages', () => {
    minorObj.stages.forEach( ( stage, sdx ) => {
      // populate if not the first stage
      if( sdx > 0 ) {
        const prevStage = minorObj.stages[ sdx - 1 ];
        populateStage( stage, sdx, flatten( prevStage.getGroupWinners() ).length );
      }

      // start and generate group stage scores
      minorObj.start();
      generateGroupStageScores( stage.groupObj );

      // generate playoffs scores
      if( !stage.isDone() && stage.startPlayoffs() ) {
        generatePlayoffScores( stage.duelObj );
      }
    });

    expect( minorObj.isDone() ).toBeTruthy();
  });
});
