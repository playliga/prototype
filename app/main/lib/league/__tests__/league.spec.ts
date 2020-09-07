import { find } from 'lodash';
import adjectiveAnimal from 'adjective-animal';
import { League, Division, Competitor } from '..';
import { generateGroupStageScores, generatePlayoffScores } from './division.spec';


/**
  * Promotional playoffs exists for all divs below Invite (Array.length - 1).
  * Taking a look at the EPL and the Championship's promotion format:
  *
  * EPL: 15% move down (20 players, 3 move down = 15%)
  * Championship: 12.5% (24 players, 3 move up = 12.5%)
  *
  * That means:
  * OPEN Division
  * = 256 competitors, 32 conferences, 8 competitors each
  * = 38 move up (256 * 15% = 38.4)
  *   = 32 automatic promotion (1st place)
  *   = 6 promotion playoff winners (see below)
  *
  *   Promotion Playoffs
  *   = 96 qualify for playoffs (3 from each conference(2nd, 3rd, 4th) * 32 conferences)
  *   = 6 playoff brackets (96/6 = 16 competitors per bracket)
  *
  * INTERMEDIATE Division
  * = 128 competitors, 16 conferences, 8 competitors each
  * = 19 move up (128 * 15% = 19.2)
  *   = 16 automatic promotion (1st place)
  *   = 3 promotion playoff winners (see below)
  *
  *   Promotion Playoffs
  *   = 48 qualify for playoffs (3 from each conference(2nd, 3rd, 4th) * 16 conferences)
  *   = 3 playoff brackets (48/3 = 16 competitors per bracket)
  *
  * MAIN Division
  * = 64 competitors, 8 conferences, 8 competitors each
  * = 10 move up (64 * 15% = 9.6)
  *   = 8 automatic promotion (1st place)
  *   = 2 promotion playoff winners (see below)
  *
  *   Promotion Playoffs
  *   = 24 qualify for playoffs (3 from each conference(2nd, 3rd, 4th) * 8 conferences)
  *   = 2 playoff brackets (24/2 = 12 competitors per bracket)
  *
  * PREMIER Division
  * = 32 competitors, 4 conferences, 8 competitors each
  * = 5 move up (32 * 15% = 4.8)
  *   = 4 automatic promotion (1st place)
  *   = 1 promotion playoff winner (see below)
  *
  *   Promotion Playoffs
  *   = 12 qualify for playoffs (3 from each conference(2nd, 3rd, 4th) * 4 conferences)
  *   = 1 playoff bracket
**/
describe( 'league', () => {
  const LEAGUE_NAME = 'CAL';
  const DIVISIONS = [
    { name: 'Open', size: 100, confSize: 20 },
    { name: 'Intermediate', size: 60, confSize: 20 },
    { name: 'Main', size: 20, confSize: 20 },
    { name: 'Premier', size: 20, confSize: 20 },
    { name: 'Invite', size: 20, confSize: 20 }
  ];

  // used for division tests
  const RAND_DIV_NAME = 'Random Division';
  const RAND_DIV_SIZE = 60;
  const RAND_DIV_CONF_SIZE = 20;

  let leagueObj: League;

  beforeEach( () => {
    // initialize league
    leagueObj = new League( LEAGUE_NAME );

    // populate the league with divisions and competitors
    DIVISIONS.forEach( ( div ) => {
      const divObj = leagueObj.addDivision( div.name, div.size, div.confSize );

      for( let i = 0; i < div.size; i++ ) {
        divObj.addCompetitor( i, adjectiveAnimal.generateName() );
      }
    });
  });

  it( 'adds a division and returns it', () => {
    const divObj = leagueObj.addDivision( RAND_DIV_NAME, RAND_DIV_SIZE, RAND_DIV_CONF_SIZE );
    expect( divObj ).toBeInstanceOf( Division );
  });

  it( 'gets a division by name', () => {
    const divObj = leagueObj.addDivision( RAND_DIV_NAME, RAND_DIV_SIZE, RAND_DIV_CONF_SIZE );
    expect( leagueObj.getDivision( RAND_DIV_NAME ) ).toEqual( divObj );
  });

  it( 'gets division by competitor id', () => {
    // start the league
    leagueObj.start();

    // get a competitor name from the last division
    const divObj = leagueObj.getDivision( 'Open' );
    const competitor = divObj.competitors[ divObj.competitors.length - 1 ];

    // now try to find that competitor's division by name
    const result = leagueObj.getDivisionByCompetitorId( competitor.id );
    expect( result.name ).toEqual( divObj.name );
  });

  it( 'start flag is toggled after starting the league', () => {
    leagueObj.start();
    expect( leagueObj.started ).toBeTruthy();
  });

  it( 'checks that all division\'s group stage matches are done', () => {
    // start the league
    leagueObj.start();

    // generate group stage scores for each division
    leagueObj.divisions.forEach( ( division: Division ) => {
      const divObj = leagueObj.getDivision( division.name ) as Division;
      generateGroupStageScores( divObj.conferences );
    });

    expect( leagueObj.isGroupStageDone() ).toBeTruthy();
  });

  it( 'does not start the promotion playoffs if there are pending group stage matches in any division', () => {
    leagueObj.start();

    // no group stage matches have been played
    expect( leagueObj.isGroupStageDone() ).toBeFalsy();
    expect( leagueObj.startPostSeason() ).toBeFalsy();
  });

  it( 'checks that a division\'s promotion playoffs are done', () => {
    // start the league
    leagueObj.start();

    // generate group stage scores for each division
    leagueObj.divisions.forEach( ( division: Division ) => {
      const divObj = leagueObj.getDivision( division.name ) as Division;
      generateGroupStageScores( divObj.conferences );
    });

    // start post-season if all group stages are done
    if( leagueObj.isGroupStageDone() ) {
      leagueObj.startPostSeason();
    }

    // generate playoff scores for each division
    leagueObj.divisions.forEach( ( division: Division ) => {
      const divObj = leagueObj.getDivision( division.name ) as Division;
      generatePlayoffScores( divObj.promotionConferences );
    });

    expect( leagueObj.isDone() ).toBeTruthy();
  });

  it( 'is not done if a division still has promotion playoffs to play', () => {
    leagueObj.start();

    // generate group stage scores for each division
    leagueObj.divisions.forEach( ( division: Division ) => {
      const divObj = leagueObj.getDivision( division.name ) as Division;
      generateGroupStageScores( divObj.conferences );
    });

    // start post-season if all group stages are done
    if( leagueObj.isGroupStageDone() ) {
      leagueObj.startPostSeason();
    }

    // since no playoff matches have been played league is not done
    expect( leagueObj.isDone() ).toBeFalsy();
  });

  it( 'does not end post-season if a division still has promotion playoffs to play.', () => {
    leagueObj.start();

    // generate group stage scores for each division
    leagueObj.divisions.forEach( ( division: Division ) => {
      const divObj = leagueObj.getDivision( division.name ) as Division;
      generateGroupStageScores( divObj.conferences );
    });

    // start post-season if all group stages are done
    if( leagueObj.isGroupStageDone() ) {
      leagueObj.startPostSeason();
    }

    // since no playoff matches have been played league is not done
    expect( leagueObj.endPostSeason() ).toBeFalsy();
  });

  it( 'ends the season with promotions and relegations and ensures competitor sizes match', () => {
    // start the league
    leagueObj.start();

    // generate group stage scores
    leagueObj.divisions.forEach( ( division: Division ) => {
      const divObj = leagueObj.getDivision( division.name ) as Division;
      const { conferences } = divObj;

      generateGroupStageScores( conferences );
    });

    // start the league's post-season if all group stage matches are done
    if( leagueObj.isGroupStageDone() ) {
      leagueObj.startPostSeason();
    }

    // loop through each division and generate playoff scores
    leagueObj.divisions.forEach( ( division: Division ) => {
      const divObj = leagueObj.getDivision( division.name ) as Division;

      // now generate the playoff scores
      generatePlayoffScores( divObj.promotionConferences );
    });

    // if league's post-season is done compile list of winners
    if( leagueObj.isDone() ) {
      leagueObj.endPostSeason();
    }

    leagueObj.end();

    // post-season division competitor size must match the existing ones
    DIVISIONS.forEach( ( division, index: number ) => {
      expect( leagueObj.postSeasonDivisions[ index ].competitors.length ).toEqual( division.size );
    });
  });

  it( 'verifies competitors were moved accordingly for promotion and relegations', () => {
    // start the league
    leagueObj.start();

    // generate group stage scores
    leagueObj.divisions.forEach( ( division: Division ) => {
      const divObj = leagueObj.getDivision( division.name ) as Division;
      const { conferences } = divObj;

      generateGroupStageScores( conferences );
    });

    // start the league's post-season if all group stage matches are done
    if( leagueObj.isGroupStageDone() ) {
      leagueObj.startPostSeason();
    }

    // loop through each division and generate playoff scores
    leagueObj.divisions.forEach( ( division: Division ) => {
      const divObj = leagueObj.getDivision( division.name ) as Division;

      // now generate the playoff scores
      generatePlayoffScores( divObj.promotionConferences );
    });

    // if league's post-season is done compile list of winners
    if( leagueObj.isDone() ) {
      leagueObj.endPostSeason();
    }

    leagueObj.end();

    // collect relegations and promotions from neighboring divisions
    const [ prevDivision,, nextDivision,, ] = leagueObj.divisions;
    const promotedFromPrev = [ ...prevDivision.conferenceWinners, ...prevDivision.promotionWinners ];
    const relegatedFromNext = nextDivision.relegationBottomfeeders;

    // promoted and relegated from neighboring divisions should exist in the current post-season
    const currentPostSeasonDivision = leagueObj.postSeasonDivisions[ 1 ];
    promotedFromPrev.forEach( ( comp: Competitor ) => {
      expect(
        find( currentPostSeasonDivision.competitors, ( item: Competitor ) => item.name === comp.name )
      ).not.toBe( undefined );
    });

    relegatedFromNext.forEach( ( comp: Competitor ) => {
      expect(
        find( currentPostSeasonDivision.competitors, ( item: Competitor ) => item.name === comp.name )
      ).not.toBe( undefined );
    });
  });
});
