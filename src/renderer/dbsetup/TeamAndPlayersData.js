var request = require( 'request' );
var cheerio = require( 'cheerio' );

var PouchDB = require('pouchdb');
var dbTeams = PouchDB('la-liga-teams');
var dbPlayers = PouchDB('la-liga-players');

// create array of regions and their division urls
var BASE_URL = 'https://play.esea.net';
var DIVISION_URL = BASE_URL + '/index.php?s=league&d=standings&division_id=';
var regions = {
  'na': [ '2490', '2491' ], // professional, premier, ..., open
  'eu': [ '2485', '2505' ]
};

// helper functions
function wget( url ) {
  return new Promise( function( resolve, reject ) {
    request( url, function( error, response, data ) {
      if( !error && response.statusCode == 200 ) resolve( data );
      else reject( error );
    });
  });
}

function camelize( str ) {
  return str.replace( /(?:^\w|[A-Z]|\b\w)/g, function( letter, index ) {
    return ( index == 0 ) ? letter.toLowerCase() : letter.toUpperCase();
  }).replace( /\s+/g, '' );
}

function extractTeamURLs( data ) {
  // extract team url and return array
  var $ = cheerio.load( data );
  var teamListElem = $( '#league-standings table tr[class*="row"]' );
  var teamDivisionString = $( '#league-standings section.division h1' ).html();
  var divisionString = teamDivisionString.split( 'CS:GO' );
  var outputArr = [];

  teamListElem.each( function( counter, el ) {
    var teamContainer = $( this ).children( 'td:nth-child(2)' );
    var teamURL = teamContainer.children( 'a:nth-child(2)' ).attr( 'href' );

    outputArr.push({
      division: divisionString[ 1 ].trim(),
      placement: counter,
      url: teamURL.replace( /\./g, '&period[' )
    });
  });

  return outputArr;
}

function extractTeamInfo( teamData, data ) {
  var $ = cheerio.load( data );
  var profileElem = $( '#teams-profile hr + section' );
  var profileInfoElem = profileElem.children( 'div#profile-info' );
  var profileRosterElem = profileElem.children( 'div#profile-column-right' ).children( 'div.row1' );
  var teamnameElem = profileElem.children( 'div#profile-header' ).children( 'h1' );

  var teamObj = {
    _id: camelize( teamnameElem.text() ),
    name: teamnameElem.text(),
    tag: profileInfoElem.children( 'div.content' ).children( 'div.data' ).html(),
    countryCode: undefined,
    division: teamData.division,
    skillTemplate: undefined,
    squad: []
  };

  // Professional = Elite
  // Premier = Expert, Very Hard
  // Main = Hard, Tough
  // Intermediate = Normal, Fair
  // Open = Easy
  switch( teamObj.division ) {
    case 'Professional':
      teamObj.skillTemplate = 'Elite';
    break;
    case 'Premier':
      teamObj.skillTemplate = ( ( teamData.placement < 3 ) ? 'Expert' : 'Very Hard' );
    break;
    case 'Main':
      teamObj.skillTemplate = ( ( teamData.placement < 3 ) ? 'Hard' : 'Tough' );
    break;
    case 'Intermediate':
      teamObj.skillTemplate = ( ( teamData.placement < 3 ) ? 'Normal' : 'Fair' );
    break;
    case 'Amateur':
      teamObj.skillTemplate = 'Easy';
    break;
  }

  profileRosterElem.each( function( counter, el ) {
    var countryElem = $( this ).children( 'a' ).children( 'img' );
    var nameElem = $( this ).children( 'a:nth-child(3)' );

    var index = countryElem.attr( 'src' ).indexOf( '.gif' );
    var countryCode = countryElem.attr( 'src' ).substring( index - 2, index );
    
    // Inherit first player's country code as the team's
    if( counter === 0 ) {
      teamObj.countryCode = countryCode;
    } 

    teamObj.squad.push({
      _id: camelize( nameElem.text() ),
      username: nameElem.text(),
      countryCode: countryCode,
      teamId: teamObj._id,
      transferValue: 0, // TODO
      skillTemplate: teamObj.skillTemplate,
      weaponTemplate: ( ( counter % 4 === 0 ) ? 'Sniper' : 'Rifle' )
    });
  });
  
  return teamObj;
}

function uniqueURLs( arr ) {
  var unique = [];
  var parsed = [];

  arr.forEach( function( obj, index ) {
    if( parsed.indexOf( obj.url ) < 0 ) {
      unique.push( obj );
      parsed.push( obj.url );
    }
  });

  arr.length = 0;
  for( var i = 0; i < unique.length; i++ ) {
    arr.push( unique[ i ] );
  }

  return arr;
}

// TODO: use maps/reduce functions which are like indexes; will GREATLY reduce load times
function find( db, identifier, val ) {
  return db.query( function( doc, emit ) { emit( doc[ identifier ] ); }, {
    key: val,
    include_docs: true
  });
}

var DBSetupUtil = {
  doSave: function( teamArr ) {
    return new Promise( function( resolve, reject ) {
      var squadSaved = [];
      var teamUpdated = [];

      // save each teams squad
      teamArr.forEach( function( rawTeamObj, currentTeam ) {
        squadSaved[ currentTeam ] = dbPlayers.bulkDocs( rawTeamObj.squad );
      });

      // once all squads are in the db we can continue
      Promise.all( squadSaved ).then( function() {
        // update each teams squad with their respective squad from the db
        teamArr.forEach( function( rawTeamObj, currentTeam ) {
          teamUpdated[ currentTeam ] = find( dbPlayers, 'teamId', rawTeamObj._id ).then( function( res ) {
            rawTeamObj.squad = res.rows;
            return Promise.resolve();
          });
        });

        // finally, once every teams squad has been updated we can save to the db
        Promise.all( teamUpdated ).then( function() {
          dbTeams.bulkDocs( teamArr ).then( function() {
            resolve();
          });
        });
      });
    });
  }
};

// loop through each region and its divisions
// extract team list for each division and squads for each team
module.exports = {
  init: function() {
    for( var region in regions ) {
      regions[ region ].forEach( function( division_id, currentRegion ) {
        // extract team urls for current division
        var teamsPromise = wget( DIVISION_URL + division_id ).then( function( data ) {
          return Promise.resolve( extractTeamURLs( data ) );
        });
        
        // collect info from each team url such as name, squad, tag, etc
        teamsPromise.then( function( teamURLs ) {
          // remove any duplicates (post-season/pre-season)
          var teamsFetched = [];
          teamURLs = uniqueURLs( teamURLs );
          
          // each team url is fetched and added to an array of promises
          teamURLs.forEach( function( teamData, currentURL ) {
            teamsFetched[ currentURL ] = wget( BASE_URL + teamData.url ).then( function( data ) {
              return Promise.resolve( extractTeamInfo( teamData, data ) );
            });
          });
          
          // once all the teams for this current division are fetched we can save them to the database
          Promise.all( teamsFetched ).then( function( teamsArr ) {
            return DBSetupUtil.doSave( teamsArr );
          }).then( function() {
            console.log( 'division #' + division_id + ': teams saved...' );
          });
        });
      });
    }
  }
};
