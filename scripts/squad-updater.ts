import path from 'path';
import dedent from 'dedent';
import Database from '../app/main/lib/database';
import { ScraperFactory } from '../app/main/lib/scraper-factory';


// module-level variables and functions
const ROOTPATH = path.join( __dirname, '../' );
const THISPATH = __dirname;
const DBPATH = path.join( ROOTPATH, 'resources/databases' );
const DBINSTANCE = new Database( DBPATH );


// establish db connection and
// execute code once established
const cnx = DBINSTANCE.connect();
cnx.then( run );


async function run() {
  // scrape liquipedia for top-tier teams
  const lqscraper = new ScraperFactory(
    path.join( THISPATH, 'cache' ),
    'liquipedia-csgo-esea'
  );

  const season = 32;
  const regions = [ 'Europe', 'North_America' ];
  const tiers = [ 'Premier', 'Advanced', 'Main' ];

  regions.forEach( region => {
    tiers.forEach( async tier => {
      const url = `ESEA/Season_${season}/${tier}/${region}`;
      const data = await lqscraper.generate( url ) as any[];
      const output = dedent`
        --------------------------
        season: ${season}
        region: ${region}
        division: ${tier}
        num. teams: ${data.length}
        --------------------------
      `;
      console.log( output );
    });
  });
}
