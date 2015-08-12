var fs = remote.require( 'fs' );
var fileDataPromises = [];

fileDataPromises.push( new Promise( function( resolve, reject ) {
  fs.readFile( 'resources/app/static/data/na_main_teams.json', 'utf8', function( err, data ) {
    if( err ) reject( err );
    else resolve( data );
  });
}) );

Promise.all( fileDataPromises ).then( function( data ) {
  var teamArr = data[ 0 ].split( "\n" );
  teamArr.pop(); // last item is always empty...
});
