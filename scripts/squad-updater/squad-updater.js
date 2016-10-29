const BASE_URL = 'https://play.esea.net';
const DIVISION_URL = `${BASE_URL}/index.php?s=league&d=standings&division_id=`;
const REGIONS = {
  na: [ '2490', '2491' ], // professional, premier, ..., open
  eu: [ '2485', '2505' ]
};

/*
* Couple of things to do here:
* 1. Loop through each region and its divisions. Visit each division page
* and extract all of the team URLs.
*   a. Save a copy of each page to cache so that we are not spamming the server
*   b. Allow overidding of caching function to visit page directly instead
*   c. Next time function is ran, check cache instead.
*
* 2. Visit each team's page and extract the necessary information such as
* country, rosters, team name, etc.
*/
function init() {
  console.log( 'ready to go!' );
}

export default {
  init
};
