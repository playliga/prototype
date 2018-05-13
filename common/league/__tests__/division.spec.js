import adjectiveAnimal from 'adjective-animal';
import cuid from 'cuid';
import { chunk, random } from 'lodash';
import GroupStage from 'groupstage';
import { Division } from '../';

describe( 'division', () => {
  it( 'adds a competitor', () => {
    const COMP_NAME = 'compLexity Gaming';
    const div = new Division( 'Invite', 64 );
    div.addCompetitor( COMP_NAME );

    expect( div.competitors ).toEqual([
      { name: COMP_NAME }
    ]);
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

    expect( div.competitors ).toEqual([
      { name: COMP_NAME },
      ...COMP_ARRAY
    ]);
  });

  it( 'checks for all conferences be completed', () => {
    const SIZE = 256;
    const CONF_SIZE = 8;
    const divObj = new Division( 'Open', SIZE, CONF_SIZE );

    // add competitors
    for( let i = 0; i < SIZE; i++ ) {
      divObj.addCompetitor( adjectiveAnimal.generateName() );
    }

    // create conferences
    const conferences = chunk( SIZE, CONF_SIZE ).map( conf => ({
      id: cuid(),
      competitors: conf,
      groupObj: new GroupStage( conf.length, { groupSize: CONF_SIZE })
    }) );
    divObj.setConferences( conferences );

    // generate scores for all conferences
    conferences.forEach( ( conf ) => {
      const { groupObj } = conf;
      const { matches } = groupObj;

      matches.forEach( ( matchObj ) => {
        groupObj.score( matchObj.id, [ random( 16 ), random( 16 ) ]);
      });
    });

    // division should return true
    // when all conferences have completed their matches
    expect( divObj.isDone() ).toBeTruthy();
  });
});