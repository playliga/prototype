import { snooze } from 'shared/util';
import ItemLoop from '..';


const MAX_ITERATIONS = 10;
const INIT_PAYLOAD = [{ type: 'foo' }];

let theloop: ItemLoop.ItemLoop;


describe( 'item loop', () => {
  beforeEach( () => {
    theloop = new ItemLoop.ItemLoop();
    theloop.register( 'init', () => Promise.resolve( INIT_PAYLOAD ) );
  });

  it( 'passes along data from the init middleware', () => {
    theloop.register( 'foo', data => {
      expect( data ).toEqual( INIT_PAYLOAD[ 0 ] );
      return Promise.resolve();
    });
    return theloop.start( MAX_ITERATIONS );
  });

  it( 'executes the end middleware', async () => {
    let someval = 0;

    theloop.register( 'end', () => {
      someval += 1;
      return Promise.resolve();
    });

    await theloop.start( MAX_ITERATIONS );
    expect( someval ).toEqual( MAX_ITERATIONS );
  });

  it( 'stops execution if middleware returns false', async () => {
    let someval = 0;

    theloop.register( 'foo', () => {
      someval += 1;
      return Promise.resolve( false );
    });

    await theloop.start( MAX_ITERATIONS );
    expect( someval ).toEqual( 1 );
  });

  it( 'does not stop execution if `skip_bail` is set to true', async () => {
    let someval = 0;

    theloop.register( 'foo', () => {
      someval += 1;
      return Promise.resolve( false );
    });

    await theloop.start( MAX_ITERATIONS, true );
    expect( someval ).toEqual( MAX_ITERATIONS );
  });

  it( 'executes unnamed middleware', async () => {
    let someval = 0;

    theloop.register( null, () => {
      someval += 1;
      return Promise.resolve();
    });

    await theloop.start( MAX_ITERATIONS );
    expect( someval ).toEqual( MAX_ITERATIONS );
  });

  it( 'stops execution if called', async () => {
    // bump timeout since we're snoozing
    // for a few secs during this test
    jest.setTimeout( 10000 );

    // stop the loop in 2s
    setTimeout( () => theloop.stop(), 2000 );

    // run the loop
    let someval = 0;

    theloop.register( 'foo', () => {
      someval++;
      return snooze( 500 );
    });

    await theloop.start( MAX_ITERATIONS );

    // our tracked val should be less than the max iterations
    expect( someval ).toBeLessThan( MAX_ITERATIONS );
  });
});
