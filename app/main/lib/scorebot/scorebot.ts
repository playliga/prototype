import events from 'events';
import is from 'electron-is';
import { Tail } from 'tail';


/**
 * Based off:
 * - https://github.com/CSGO-Analysis/hltv-scorebot/blob/master/Scorebot.js
 * - https://github.com/OpenSourceLAN/better-srcds-log-parser
 */

export const GameEvents = {
  SAY: 'say',
};


const RegexTypes = {
  SAY_REGEX: new RegExp( /(?:.)+(?:say|say_team)(?:.)+"(.*)"$/ ),
  STEAM_REGEX: new RegExp( /<(STEAM_\d+:\d+:\d+|BOT|Console)>/ ),
  TEAM_REGEX: new RegExp( /["<]?(CT|TERRORIST|Spectator|Unassigned)[">]?/ ),
};


export class Scorebot extends events.EventEmitter {
  private tail: Tail;

  public constructor( logpath: string ) {
    super();

    // `fs.watchFile` is required on windows, otherwise
    // the logs won't be streamed in realtime
    let useWatchFile = false;

    if( is.windows() ) {
      useWatchFile = true;
    }

    // start tailing the provided file
    this.tail = new Tail( logpath, { useWatchFile });

    // bind `this` to the event handler to
    // call our own class's emit functions
    this.tail.on( 'line', this.onLine.bind( this ) );
  }

  public unwatch() {
    this.tail.unwatch();
  }

  private onLine( data: string ) {
    // kill event
    // Mark<6><BOT><CT>" [-417 1742 -127] killed "Jerry<3><BOT><TERRORIST>" [-416 169 65] with "scar20

    // say event:
    // LIMÓNPOLE<2><STEAM_1:0:4517681><TERRORIST>" say ".ready"
    // res = data.match( `${STEAM_REGEX.source}${TEAM_REGEX.source}${SAY_REGEX.source}` );

    // user joins (only one w/ steamid)
    // "LIMÓNPOLE<2><STEAM_1:0:4517681><>" entered the game

    // figure out what type of event this is
    let regexmatch = null;

    for( let i = 0; i < Object.keys( GameEvents ).length; i++ ) {
      regexmatch = data.match( RegexTypes.SAY_REGEX );

      if( regexmatch ) {
        this.emit( GameEvents.SAY, regexmatch[ 1 ] );
        break;
      }
    }
  }
}
