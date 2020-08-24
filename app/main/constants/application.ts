const Application = {
  CALENDAR_LOOP_MAX_ITERATIONS: 5,
  DB_CNX_LIMIT: 10000,
  DB_NAME: 'save0.sqlite',
  MATCHDAYS_LEAGUE: [ 5, 6, 7 ],          // fri, sat, sun
  MATCHDAYS_LEAGUECUP: [ 1, 2 ],          // mon, tues
  MATCHDAYS_CHAMPLEAGUE: [ 3, 4 ],        // wed, thurs
  OFFER_TEAM_RESPONSE_MINDAYS: 1,
  OFFER_TEAM_RESPONSE_MAXDAYS: 2,
  OFFER_PLAYER_ELIGIBLE_BUFFER_DAYS: 60,
  OFFER_PLAYER_RESPONSE_MINDAYS: 1,
  OFFER_PLAYER_RESPONSE_MAXDAYS: 1,
};


export default Application;
