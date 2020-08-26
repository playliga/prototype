const Application = {
  CALENDAR_LOOP_MAX_ITERATIONS      : 5,
  DB_CNX_LIMIT                      : 10000,
  DB_NAME                           : 'save0.sqlite',
  MATCHDAYS_LEAGUE                  : [ 5, 6, 7 ],        // fri, sat, sun
  MATCHDAYS_LEAGUECUP               : [ 1, 2 ],           // mon, tues
  MATCHDAYS_CHAMPLEAGUE             : [ 3, 4 ],           // wed, thurs
  OFFER_TEAM_RESPONSE_MINDAYS       : 1,
  OFFER_TEAM_RESPONSE_MAXDAYS       : 2,
  OFFER_PLAYER_ELIGIBLE_BUFFER_DAYS : 60,
  OFFER_PLAYER_RESPONSE_MINDAYS     : 1,
  OFFER_PLAYER_RESPONSE_MAXDAYS     : 1,
  PRESEASON_FIRST_YEAR              : 2019,               // the very first pre-season's year
  PRESEASON_LENGTH                  : 60,                 // when the regular season starts
  PRESEASON_SQUAD_DEADLINE_DAYS     : [ 30, 14, 7 ],      // when to start enforcing minimum squad depth
  PRESEASON_START_DAY               : 1,                  // pre-season start day
  PRESEASON_START_MONTH             : 6,                  // pre-season start month
};


export default Application;
