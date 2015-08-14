var fs = remote.require( 'fs' );
var fileDataPromises = [];

fileDataPromises.push( new Promise( function( resolve, reject ) {
  fs.readFile( 'resources/app/renderer/static/data/na_main_teams.json', 'utf8', function( err, data ) {
    if( err ) reject( err );
    else resolve( data );
  });
}) );

Promise.all( fileDataPromises ).then( function( data ) { });
