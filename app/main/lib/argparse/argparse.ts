import minimist from 'minimist';


const OPTS = {
  boolean: [ 'dev-console', 'sim-games' ],
};


let Argparse: minimist.ParsedArgs;


if( !Argparse ) {
  Argparse = minimist( process.argv.slice( 2 ), OPTS );
}


export default Argparse;
