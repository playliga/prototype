const Application = {
  CALENDAR_LOOP_MAX_ITERATIONS      : 15,
  DEMO_MODE                         : true,
  DB_CNX_LIMIT                      : 10000,
  DB_NAME                           : 'save0.sqlite',
  MAP_POOL                          : [ 'de_dust2', 'de_inferno', 'de_mirage', 'de_nuke', 'de_overpass', 'de_train', 'de_vertigo' ],
  MATCHDAYS_LEAGUE                  : [ 5, 6, 7 ],        // fri, sat, sun
  MATCHDAYS_LEAGUECUP               : [ 1, 2 ],           // mon, tues
  MATCHDAYS_CHAMPLEAGUE             : [ 3, 4 ],           // wed, thurs
  OFFER_TEAM_RESPONSE_MINDAYS       : 1,
  OFFER_TEAM_RESPONSE_MAXDAYS       : 2,
  OFFER_PLAYER_ELIGIBLE_BUFFER_DAYS : 60,
  OFFER_PLAYER_RESPONSE_MINDAYS     : 1,
  OFFER_PLAYER_RESPONSE_MAXDAYS     : 1,
  PRESEASON_AUTOADD_COMP            : 3,                  // when to auto-add the user to a competition
  PRESEASON_AUTOADD_SQUAD           : 5,                  // when to auto-add players to user's team
  PRESEASON_COMP_DEADLINE_DAYS      : [ 14, 7 ],          // when to start asking to join a competition
  PRESEASON_FIRST_YEAR              : 2019,               // the very first pre-season's year
  PRESEASON_LENGTH                  : 60,                 // when the regular season starts
  PRESEASON_PREV_END_DAYS           : 5,                  // how many days before pre-season does the prev season end
  PRESEASON_SQUAD_DEADLINE_DAYS     : [ 30, 14, 7 ],      // when to start enforcing minimum squad depth
  PRESEASON_START_DAY               : 1,                  // pre-season start day
  PRESEASON_START_MONTH             : 6,                  // pre-season start month
  SQUAD_MIN_LENGTH                  : 5,
};


export default Application;
