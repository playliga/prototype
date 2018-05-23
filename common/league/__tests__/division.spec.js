// @flow
import adjectiveAnimal from 'adjective-animal';
import cuid from 'cuid';
import { chunk, random } from 'lodash';
import GroupStage from 'groupstage';
import { Division, Competitor } from '../';

export function generateGroupStageScores( conferences: Array<Conference> ) {
  // generate scores for each conference
  conferences.forEach( ( conf ) => {
    const { groupObj } = conf;
    const { matches } = groupObj;

    matches.forEach( ( matchObj ) => {
      groupObj.score( matchObj.id, [ random( 16 ), random( 16 ) ] );
    });
  });
}

export function generatePlayoffScores( promotionConferences: Array<PromotionConference> ) {
  // generate scores for each conference
  promotionConferences.forEach( ( conf: PromotionConference ) => {
    const { duelObj } = conf;
    const { matches } = duelObj;

    // for each match simulate a best-of-N
    const BEST_OF = 5;
    const WIN_AMT = 3;

    matches.forEach( ( matchObj ) => {
      let aFinalScore = 0;
      let bFinalScore = 0;

      // TODO: possibly make class for simulator engine
      for( let i = 0; i < BEST_OF; i++ ) {
        // assign scores and check if they are tied
        let aScore = random( 16 );
        let bScore = random( 16 );

        // if they are tied, keep trying until they aren't...
        while( aScore === bScore ) {
          aScore = random( 16 );
          bScore = random( 16 );
        }

        // whoever won this round gets a point
        aFinalScore = aScore > bScore ? aFinalScore + 1 : aFinalScore;
        bFinalScore = bScore > aScore ? bFinalScore + 1 : bFinalScore;

        // whoever reaches WIN_AMT wins
        if( aFinalScore === WIN_AMT || bFinalScore === WIN_AMT ) {
          break;
        }
      }

      // submit the scores
      // but only if they are scoreable. see: https://goo.gl/ym2n8e
      if( duelObj.unscorable( matchObj.id, [ aFinalScore, bFinalScore ] ) === null ) {
        duelObj.score( matchObj.id, [ aFinalScore, bFinalScore ] );
      }
    });
  });
}

describe( 'division', () => {
  const SIZE = 256;
  const CONF_SIZE = 8;

  let divObj;
  let conferences;

  beforeEach( () => {
    // reinstatiate division
    divObj = new Division( 'Open', SIZE, CONF_SIZE );

    // add competitors
    for( let i = 0; i < SIZE; i++ ) {
      divObj.addCompetitor( adjectiveAnimal.generateName() );
    }

    // create conferences
    conferences = chunk( divObj.competitors, CONF_SIZE ).map( conf => ({
      id: cuid(),
      competitors: conf,
      groupObj: new GroupStage( conf.length, { groupSize: CONF_SIZE })
    }) );

    divObj.setConferences( conferences );
  });

  it( 'adds a competitor', () => {
    const COMP_NAME = 'compLexity Gaming';
    const div = new Division( 'Invite', 64 );
    div.addCompetitor( COMP_NAME );

    expect( div.competitors ).toEqual( [
      { name: COMP_NAME }
    ] );
  });

  it( 'adds an array of competitors', () => {
    const COMP_NAME = 'Rival';
    const COMP_ARRAY = [
      { name: 'compLexity Gaming' },
      { name: 'Team 3D' },
      { name: 'Evil Geniuses' }
    ];
    const div = new Division( 'Invite', 64 );
    div.addCompetitor( COMP_NAME );
    div.addCompetitors( COMP_ARRAY.map( item => item.name ) );

    expect( div.competitors ).toEqual( [
      { name: COMP_NAME },
      ...COMP_ARRAY
    ] );
  });

  it( 'ensures that division group stage is not done when conferences have oustanding matches left', () => {
    expect( divObj.isGroupStageDone() ).toBeFalsy();
  });

  it( 'generates random scores for all conferences and ensures that division group stage is done', () => {
    // generate scores for all conferences
    generateGroupStageScores( conferences );

    // division should return true
    // when all conferences have completed their matches
    expect( divObj.isGroupStageDone() ).toBeTruthy();
  });

  it( 'does not start post-season if there are outstanding conference matches left', () => {
    expect( divObj.startPostSeason() ).toBeFalsy();
  });

  it( "gets a competitor's group info", () => {
    // override one of the randomly generated competitors with our own
    const NAME = 'dahang';
    const CONF_NUM = random( divObj.conferences.length );
    const SEED_NUM = random( CONF_SIZE );
    divObj.conferences[ CONF_NUM ].competitors[ SEED_NUM ] = new Competitor( NAME );

    expect( divObj.getCompetitorGroupObj( NAME ) ).not.toBeNull();
  });

  it( "returns null if a competitor's group info is not found", () => {
    expect( divObj.getCompetitorGroupObj( 'rapha' ) ).toBeNull();
  });

  it( 'returns a competitor name by seed and conference number', () => {
    const CONF_NUM = random( divObj.conferences.length );
    const INDEX = random( CONF_SIZE );

    // override one of the randomly generated competitors with our own
    const NAME = 'cooller';
    const competitorObj = new Competitor( NAME );
    divObj.conferences[ CONF_NUM ].competitors[ INDEX ] = competitorObj;

    // pad the index number to emulate the seed numbers which are 1-based
    expect( divObj.getCompetitorName( CONF_NUM, INDEX + 1 ) ).toEqual( competitorObj );
  });

  it( 'generates random scores for groupstage and promotion playoffs. ensures that division is all done.', () => {
    // generate group stage scores for all conferences
    generateGroupStageScores( conferences );

    // only continue if post season can be started
    expect( divObj.startPostSeason() ).toBeTruthy();

    // generate scores for all promotion conference playoffs
    const { promotionConferences } = divObj;
    generatePlayoffScores( promotionConferences );

    // division should be all done
    expect( divObj.isDone() ).toBeTruthy();
  });

  it( 'ensures that division is not entirely done if there are still promotion playoffs to play', () => {
    // generate group stage scores for all conferences
    generateGroupStageScores( conferences );

    // only continue if post season can be started
    // kind of a dupe for the post-season unit tests but whatever
    expect( divObj.startPostSeason() ).toBeTruthy();
    expect( divObj.isDone() ).toBeFalsy();
  });

  it( 'compiles list of winners and promotion winners when division is done', () => {
    // generate group stage scores for all conferences
    generateGroupStageScores( conferences );

    // only continue if post season can be started
    // kind of a dupe for the post-season unit tests but whatever
    expect( divObj.startPostSeason() ).toBeTruthy();

    // generate scores for all promotion conference playoffs
    const { promotionConferences } = divObj;
    generatePlayoffScores( promotionConferences );

    // all games should be done. duelObj.p === final round num.
    // duelObj.p = 2^(p-1) = number of games in *FIRST* round. ie:
    // 16 players = 8 games first round = 2^(p-1) = 8 = 2^(4-1) = 8
    // p = 4 = final round

    // before continuing ensure division is entirely done
    expect( divObj.isDone() ).toBeTruthy();
    expect( divObj.endPostSeason() ).toBeTruthy();

    // conference winners should equal the same amount of conferences
    expect( divObj.conferenceWinners.length ).toEqual( divObj.conferences.length );

    // promotion winners should equal the same amount of promotion coneferences
    expect( divObj.promotionWinners.length ).toEqual( divObj.promotionConferences.length );
  });
});