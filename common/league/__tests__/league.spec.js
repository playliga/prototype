import adjectiveAnimal from 'adjective-animal';
import { random } from 'lodash';
import League from '../league';

describe( 'league', () => {
  it( 'DEBUG: sample use-case', () => {
    // each division is a groupstage instance
    const leagueObj = new League( 'CAL' );
    const divisions = [
      { name: 'Open', size: 256, confSize: 8 },
      { name: 'Intermediate', size: 128, confSize: 16 },
      { name: 'Main', size: 64, confSize: 16 },
      { name: 'Premier', size: 32, confSize: 16 },
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
  });
});