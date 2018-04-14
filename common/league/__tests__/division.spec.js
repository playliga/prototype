import Division from '../division';

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
});