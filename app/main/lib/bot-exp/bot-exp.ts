import { random, sampleSize } from 'lodash';
import { IterableObject } from 'shared/types';
import { StatModifiers } from 'shared/enums';
import probable from 'probable';
import Tiers from 'shared/tiers.json';


export interface Stats {
  skill: number;
  aggression: number;
  reactionTime: number;
  attackDelay: number;
  [x: string]: number;
}


export interface Rank {
  name: string;
  stats: Stats;
}


export default class BotExp {
  public stats: Stats;
  public gains: Stats | Record<string, number> = {};

  private static probTables: IterableObject<any[][]> = {
    skill: [
      [ 99, 1 ],
      [ 1, 3 ],
    ],
    aggression: [
      [ 99, 1 ],
      [ 1, 3 ],
    ],
    reactionTime: [
      [ 99, .01 ],
      [ 1, .05 ],
    ],
    attackDelay: [
      [ 99, .01 ],
      [ 1, .05 ],
    ]
  };

  constructor( stats: Stats ) {
    // shallow clone
    this.stats = { ...stats };
  }

  /**
   * Calculates the sum of the stats passed in as args. This
   * is useful when finding which rank the stats are in.
   */
  public static getSumOfStats( stats: Stats ) {
    return Object
      .keys( stats )
      .map( key => stats[ key ] )
      .reduce( ( total, current ) => total + current )
    ;
  }

  /**
   * Returns the previous rank.
   */
  public static getPrevRank( id: [ number, number ] ): Rank {
    const [ tdx, tpltdx ] = id;
    const tier = Tiers[ tdx ];

    // do we have a prev rank?
    if( tpltdx < tier.templates.length - 1 ) {
      return tier.templates[ tpltdx + 1 ];
    }

    // do we have a prev tier?
    if( tdx < Tiers.length - 1 ) {
      return Tiers[ tdx + 1 ].templates[ 0 ];
    }

    // found nothing.
    return null;
  }

  /**
   * Returns the next rank.
   */
  public static getNextRank( id: [ number, number ] ): Rank {
    const [ tdx, tpltdx ] = id;
    const tier = Tiers[ tdx ];

    // do we have a next rank?
    if( tpltdx > 0 ) {
      return tier.templates[ tpltdx - 1 ];
    }

    // do we have a next tier?
    if( tdx > 0 ) {
      const nexttier = Tiers[ tdx - 1 ];
      return nexttier.templates[ nexttier.templates.length - 1 ];
    }

    // found nothing
    return null;
  }

  public train() {
    const [ tdx, tpltdx ] = this.getTierId();
    const current = Tiers[ tdx ].templates[ tpltdx ] as Rank;

    // @note: the skill+aggression stats go up;
    //        reactiontime+attackdelay go down
    const unmaxxed = Object.keys( this.stats ).filter( key => {
      // if the modifier for this stat is to subtract it's not
      // maxxed out if its greater than the next stat value
      if( StatModifiers.SUBTRACT.includes( key ) ) {
        return this.stats[ key ] >= current.stats[ key ];
      }

      return this.stats[ key ] <= current.stats[ key ];
    });

    // pick a random set of stats to train
    const drills = sampleSize( unmaxxed, random( 1, unmaxxed.length ) );

    // train!
    drills.forEach( drill => {
      const probtable = probable.createTableFromSizes( BotExp.probTables[ drill ] );

      if( StatModifiers.SUBTRACT.includes( drill ) ) {
        const gains = probtable.roll();
        this.stats[ drill ] -= gains;
        this.gains[ drill ] = gains;
        return;
      }

      const gains = probtable.roll();
      this.stats[ drill ] += gains; // our gains add to our overall stats
      this.gains[ drill ] = gains;  // record our gains for historial purposes
    });
  }

  /**
   * Get the current tier id and rank id
   * based off instance's active stats.
   */
  public getTierId(): [ number, number ] {
    // we use the sum of the stats to
    // identify our tier and rank
    const sum_active = BotExp.getSumOfStats( this.stats );

    let found_tdx = -1;
    let found_tpltdx = -1;

    Tiers.forEach( ( tier, tdx ) => {
      tier.templates.forEach( ( template, tpltdx ) => {
        const sum_current = BotExp.getSumOfStats( template.stats );
        const hasprev = BotExp.getPrevRank([ tdx, tpltdx ]);
        const sum_prev = hasprev ? BotExp.getSumOfStats( hasprev.stats ) : 0;

        // are our stats better than our prev and lt/eq to our next rank?
        if( sum_active > sum_prev && sum_active <= sum_current ) {
          found_tdx = tdx;
          found_tpltdx = tpltdx;
          return;
        }
      });

      // bail early if we have a result
      if( found_tdx > -1 && found_tpltdx > -1 ) {
        return;
      }
    });

    return [ found_tdx, found_tpltdx ];
  }
}
