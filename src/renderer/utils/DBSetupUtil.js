// http://sd-34470.dedibox.fr/csgo/botprofile.db
var PouchDB = require( 'pouchdb' );
var dbCountries = PouchDB( 'la-liga-countries' );
var dbTeams = PouchDB( 'la-liga-teams' );
var dbPlayers = PouchDB( 'la-liga-players' );

var promises = { countries: [], teams: [], players: [] };
var savedObjects = { countries: [], teams: [] };

function camelize( str ) {
  return str.replace( /(?:^\w|[A-Z]|\b\w)/g, function( letter, index ) {
    return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
  }).replace( /\s+/g, '' );
}

function BaseTeam( teamname ) {
  this._id = camelize( teamname );
  this.teamname = teamname;
  this.country = null;
  this.tag = null;
  this.squad = [];
}

function BasePlayer( username ) {
  this._id = camelize( username );
  this.username = username;
  this.teamId = null;
  this.transferValue = 0;
  this.skillTemplate = null;
  this.weaponTemplate = null;
}

var theObj = {
  doWork: function( countriesToFetch, teamArr ) {
    return new Promise( function( resolve, reject ) {
      // begin by fetching the country objects we need from the db
      countriesToFetch.map( function( country ) {
        promises.countries.push( dbCountries.get( country ).then( function( doc ) {
          savedObjects.countries[ doc._id ] = doc;
          return Promise.resolve();
        }) );
      });

      // continue only when the previous calls are fully done.
      Promise.all( promises.countries ).then( function() {
        for( var i = 0; i < teamArr.length; i++ ) {
          var teamObj = new BaseTeam( teamArr[ i ].name );
          teamObj.country = savedObjects.countries[ teamArr[ i ].country ];
          teamObj.tag = teamArr[ i ].tag;

          savedObjects.teams[ teamObj._id ] = teamObj; // not really saved but READY to be saved
          promises.players[ i ] = []; // hold current index promises

          for( var j = 0; j < teamArr[ i ].squad.length; j++ ) {
            var playerObj = new BasePlayer( teamArr[ i ].squad[ j ].username );
            playerObj.skillTemplate = teamArr[ i ].squad[ j ].skillTemplate;
            playerObj.weaponTemplate = teamArr[ i ].squad[ j ].weaponTemplate;
            playerObj.teamId = teamObj._id;
            playerObj.country = teamObj.country;
            
            // give player his market value depending on skill level
            switch( playerObj.skillTemplate ) {
              case 'Elite':
                playerObj.transferValue = 250000000;
                break;
              case 'Expert':
                playerObj.transferValue = 200000000;
                break;
              case 'VeryHard':
                playerObj.transferValue = 150000000;
                break;
              case 'Hard':
                playerObj.transferValue = 100000000;
                break;
              case 'Tough':
                playerObj.transferValue = 50000000;
                break;
              case 'Normal':
                playerObj.transferValue = 1000000;
                break;
              case 'Fair':
                playerObj.transferValue = 500000;
                break;
              case 'Easy':
                playerObj.transferValue = 100000;
                break;
            }
            
            promises.players[ i ].push( dbPlayers.put( playerObj ).then( function( res ) {
              return dbPlayers.get( res.id );
            }).catch( ( function( playerId, err ) {
              return Promise.reject( 'Could not save player: ' + playerId );
            }).bind( null, playerObj._id )) );
          }

          promises.teams.push( Promise.all( promises.players[ i ] ).then( function( squad ) {
            var teamObj = savedObjects.teams[ squad[ 0 ].teamId ];
            teamObj.squad = squad;

            return dbTeams.put( teamObj );
          }).catch( function( err ) {
            return Promise.reject( err );
          }) );
        }

        Promise.all( promises.teams ).then( function() {
          resolve();
        }).catch( function( err ) {
          reject( err );
        });
      });
    });
  }
};

module.exports = theObj;
