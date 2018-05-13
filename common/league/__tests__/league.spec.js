import adjectiveAnimal from 'adjective-animal';
import { random } from 'lodash';
import League from '../league';

describe( 'league', () => {
  it( 'DEBUG: sample use-case', () => {
    // each division is a groupstage instance
    const leagueObj = new League( 'CAL' );
    const divisions = [
      { name: 'Open', size: 256, confSize: 8 },
      { name: 'Intermediate', size: 128, confSize: 8 },
      { name: 'Main', size: 64, confSize: 8 },
      { name: 'Premier', size: 32, confSize: 8 },
      { name: 'Invite', size: 16, confSize: 16 }
    ];

    divisions.forEach( ( div ) => {
      const divObj = leagueObj.addDivision( div.name, div.size, div.confSize );

      for( let i = 0; i < div.size; i++ ) {
        divObj.addCompetitor( adjectiveAnimal.generateName() );
      }
    });

    leagueObj.start();

    // loop through each division and randomly generate scores
    // note that each division has conferences
    divisions.forEach( ( division ) => {
      const divObj = leagueObj.getDivision( division.name );
      const { conferences } = divObj;

      conferences.forEach( ( conf ) => {
        const { groupObj } = conf;
        const { matches } = groupObj;

        matches.forEach( ( matchObj ) => {
          groupObj.score( matchObj.id, [ random( 16 ), random( 16 ) ]);
        });
      });
    });

    /**
    * All matches should be done by now (groupObj.isDone()).
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
  });
});