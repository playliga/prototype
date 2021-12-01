const Application = {
  APP_LOGO_FILENAME                 : 'icon.png',
  CALENDAR_LOOP_MAX_ITERATIONS      : 15,
  DEMO_MODE                         : true,
  DB_CNX_LIMIT                      : 10000,
  DB_NAME                           : 'save0.sqlite',
  LOGGING_LEVEL                     : 'error',
  MAP_POOL                          : [ 'de_dust2', 'de_inferno', 'de_mirage', 'de_nuke', 'de_overpass', 'de_train', 'de_vertigo' ],
  MATCHDAYS_LEAGUE                  : [ 5, 6, 7 ],        // fri, sat, sun
  MATCHDAYS_LEAGUECUP               : [ 1, 2 ],           // mon, tues
  MATCHDAYS_CHAMPLEAGUE             : [ 3, 4 ],           // wed, thurs
  OFFER_TEAM_RESPONSE_MINDAYS       : 1,
  OFFER_TEAM_RESPONSE_MAXDAYS       : 2,
  OFFER_PLAYER_ELIGIBLE_BUFFER_DAYS : 60,
  OFFER_PLAYER_RESPONSE_MINDAYS     : 1,
  OFFER_PLAYER_RESPONSE_MAXDAYS     : 1,
  OFFER_USER_BASE_PROBABILITY       : 5,                  // chance of sending the user a transfer offer
  OFFER_USER_SELLING_MODIFIER       : 5,                  // affects chances of an offer if the user is selling their player
  OFFER_USER_SAME_TIER_MODIFIER     : 5,                  // affects chances of an offer if the user's player is the same tier
  OFFER_USER_HIGH_TIER_MODIFIER     : 10,                 // affects chances of an offer if the user's player is a higher tier
  OFFER_USER_SQUAD_MODIFIER         : -10,                // affects chances of an offer if the buying team already has enough players in their squad
  OFFER_USER_TOP_TALENT_MODIFIER    : 60,                 // chance of looking for the user's highest skilled player
  PRESEASON_AUTOADD_COMP            : 3,                  // when to auto-add the user to a competition
  PRESEASON_AUTOADD_SQUAD           : 5,                  // when to auto-add players to user's team
  PRESEASON_COMP_DEADLINE_DAYS      : [ 14, 7 ],          // when to start asking to join a competition
  PRESEASON_FIRST_YEAR              : 2019,               // the very first pre-season's year
  PRESEASON_LENGTH                  : 60,                 // when the regular season starts
  PRESEASON_PREV_END_DAYS           : 5,                  // how many days before pre-season does the prev season end
  PRESEASON_SQUAD_DEADLINE_DAYS     : [ 30, 14, 7 ],      // when to start enforcing minimum squad depth
  PRESEASON_START_DAY               : 1,                  // pre-season start day
  PRESEASON_START_MONTH             : 6,                  // pre-season start month
  SIM_MODE_DEFAULT                  : 'default',
  SIM_MODE_ALWAYS_WIN               : 'always_win',
  SIM_MODE_ALWAYS_LOSE              : 'always_lose',
  SQUAD_MIN_LENGTH                  : 5,
  TRAINING_ELIGIBLE_BUFFER_DAYS     : 7,                  // default: can only train every 7 days
};


export default Application;
