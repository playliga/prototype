/*
* A match plugin.
*/
#include <amxmodx>

// set compiler options
#pragma semicolon                     1

// constants
#define PLUGIN_NAME                   "LIGA Esports Manager"
#define PLUGIN_VERSION                "1.0.0"
#define PLUGIN_AUTHOR                 "LIGA Esports Manager"
#define DELAY_WELCOME_MESSAGE         5
#define DELAY_GAME_OVER               5
#define LO3_LOOP_NUM                  3
#define LO3_MODIFIER                  3
#define LO3_PRINT_NUM                 4
#define BUFFER_SIZE_XS                31
#define BUFFER_SIZE_SM                63
#define BUFFER_SIZE_MD                127
#define BUFFER_SIZE_LG                255
#define BUFFER_SIZE_XL                511
#define BUFFER_SIZE_2XL               1023
#define BUFFER_SIZE_MAX               2047
#define TEAM_T                        0
#define TEAM_CT                       1

// cvars
enum cvars {
  MAX_ROUNDS,
  OVERTIME_ENABLE,
  TEAM_NAME_T,
  TEAM_NAME_CT,
}

// variables
new g_cvars[cvars];
new g_buffer_md[BUFFER_SIZE_MD + 1]   = "";
new g_buffer[BUFFER_SIZE_MAX + 1]     = "";
new g_half_time, g_live, g_over_time  = false;
new g_hostname[BUFFER_SIZE_SM + 1]    = "";
new g_score[2], g_over_time_score[2]  = {0, 0};

/*
* Plugin initialization.
*/
public plugin_init() {
  register_plugin(PLUGIN_NAME, PLUGIN_VERSION, PLUGIN_AUTHOR);
  register_clcmd("say .ready", "command_ready", 0, "- Starts the match.");
  register_clcmd("say .score", "command_score", 0, "- Shows the score.");
  register_concmd("liga_announce", "command_announce", 0, "<message> - Announces a message to all players.");
  register_event("SendAudio", "event_end_round", "a", "2=%!MRAD_terwin", "2=%!MRAD_ctwin", "2=%!MRAD_rounddraw");

  g_cvars[MAX_ROUNDS] = register_cvar("liga_max_rounds", "30");
  g_cvars[OVERTIME_ENABLE] = register_cvar("liga_overtime_enable", "0");
  g_cvars[TEAM_NAME_T] = register_cvar("liga_teamname_t", "Terrorists");
  g_cvars[TEAM_NAME_CT] = register_cvar("liga_teamname_ct", "Counter-Terrorists");
}

/*
* Called when a client joins the game.
*
* @param id The index of the player that joined.
*/
public client_putinserver(id) {
  if(equal(g_hostname, "")) {
    get_cvar_string("hostname", g_hostname, BUFFER_SIZE_SM);
  }

  if(is_user_bot(id)) {
    return PLUGIN_HANDLED;
  }

  set_task(float(DELAY_WELCOME_MESSAGE), "task_welcome_message", id);
  return PLUGIN_HANDLED;
}

/*
* Announces a message.
*
* This is simply a wrapper for `client_print`.
*/
public command_announce() {
  read_args(g_buffer, BUFFER_SIZE_MAX);
  remove_quotes(g_buffer);
  say(g_buffer);
  return PLUGIN_HANDLED;
}

/*
* Ready up command handler.
*/
public command_ready() {
  // bail if we're already live
  if(g_live) {
    return PLUGIN_CONTINUE;
  }

  g_live = true;
  server_cmd("competitive");

  // run the lo3 task
  //
  // doing it this way because the standard lo3 config will
  // cause the client to lockup due to excessive waits
  // when used from within in a listenserver
  for(new i = 0; i < LO3_LOOP_NUM; i++) {
    set_task(float(LO3_MODIFIER * i), "task_lo3", i + 1);
  }

  return PLUGIN_CONTINUE;
}

/*
* Score command handler.
*/
public command_score() {
  // bail if game is not live
  if(!g_live && !g_half_time && !g_over_time) {
    return PLUGIN_CONTINUE;
  }

  client_print_score();
  return PLUGIN_CONTINUE;
}

/*
* Triggered when the end round radio signal is played.
*/
public event_end_round() {
  // bail if we're not live
  if(!g_live) {
    return PLUGIN_CONTINUE;
  }

  // grab the winner of this round
  new winner = 0;
  read_data(2, g_buffer, BUFFER_SIZE_MAX);

  if(containi(g_buffer, "ter") != -1) {
    winner = TEAM_T;
  } else if(containi(g_buffer, "ct") != -1) {
    winner = TEAM_CT;
  }

  // invert score if past half-time
  if(g_half_time) {
    g_score[1 - winner]++;
    g_over_time_score[1 - winner] += g_over_time ? 1 : 0;
  } else {
    g_score[winner]++;
    g_over_time_score[winner] += g_over_time ? 1 : 0;
  }

  // grab team scores
  new score_t = get_score(TEAM_T);
  new score_ct = get_score(TEAM_CT);

  // grab round information
  new rounds_total = get_sum_of_array(g_over_time ? g_over_time_score : g_score, 2);
  new rounds_half_time = get_pcvar_num(g_cvars[MAX_ROUNDS]) / 2;
  new rounds_clinch = get_pcvar_num(g_cvars[MAX_ROUNDS]) / 2 + 1;
  new rounds_last = score_t == rounds_clinch - 1 || score_ct == rounds_clinch - 1;

  // report score
  client_print_score(rounds_last ? "GAME POINT" : "ROUND OVER");

  // handle half-time
  if(rounds_total == rounds_half_time) {
    g_half_time = true;
    g_live = false;
    server_cmd("exec liga-halftime.cfg");
    say("HALFTIME");
    say("TO START THE SECOND-HALF TYPE: .ready");
    return PLUGIN_CONTINUE;
  }

  // handle overtime
  if(
    rounds_total == get_pcvar_num(g_cvars[MAX_ROUNDS]) &&
    get_pcvar_num(g_cvars[OVERTIME_ENABLE]) &&
    score_t == score_ct
  ) {
    g_half_time = false;
    g_live = false;
    g_over_time = true;
    // @todo: override max rounds
    server_cmd("exec liga-halftime.cfg");
    say("OVERTIME");
    say("TO START OVERTIME TYPE: .ready");
    return PLUGIN_CONTINUE;
  }

  // game is over
  if(
    rounds_total == get_pcvar_num(g_cvars[MAX_ROUNDS]) ||
    score_t == rounds_clinch ||
    score_ct == rounds_clinch
  ) {
    say("GAME OVER");
    say("SHUTTING DOWN SERVER IN %ds...", DELAY_GAME_OVER);
    server_cmd("bot_quota 0");
    set_task(float(DELAY_GAME_OVER), "task_game_over");
  }

  return PLUGIN_CONTINUE;
}

/*
* Handles the game over event by simulating
* CS:GO's game over event log message.
*/
public task_game_over() {
  // using echo here because the logging functions
  // somehow do not get logged to `qconsole.log`
  get_mapname(g_buffer_md, BUFFER_SIZE_MD);
  server_cmd("echo Game Over: competitive  %s score %d:%d", g_buffer_md, get_score(TEAM_T), get_score(TEAM_CT));

  // shut the server down
  server_cmd("exit");
}

/*
* Live on three restart task.
*
* @param num The current restart number.
*/
public task_lo3(num) {
  server_cmd("sv_restartround 1");
  say("RESTART %d", num);
  client_print_x(LO3_PRINT_NUM, "* * * %d * * *", num);

  if(num == LO3_LOOP_NUM) {
    client_print_x(LO3_PRINT_NUM + 1, "* * * ---LIVE--- * * *");
  }
}

/*
* Displays the welcome message.
*
* @param id The index of the player to send the message to.
*/
public task_welcome_message(id) {
  say("TO START THE MATCH TYPE: .ready");
  say("ONCE LIVE TO CHECK THE SCORE TYPE: .score");
}

/*
* Prints the score to the client.
*
* @param prefix Whether to print a prefix.
*/
client_print_score(prefix[] = "") {
  new score_t = get_score(TEAM_T);
  new score_ct = get_score(TEAM_CT);

  if(strlen(prefix) > 0) {
    say("%s | %s %d - %d %s", prefix, get_name(TEAM_NAME_T), score_t, score_ct, get_name(TEAM_NAME_CT));
    return;
  }

  say("%s %d - %d %s", get_name(TEAM_NAME_T), score_t, score_ct, get_name(TEAM_NAME_CT));
}

/*
* Prints a message to client's chat x-amount of times.
*
* @param x The number of times to print the message.
* @param message The message to print.
*/
client_print_x(x, message[], any:...) {
  vformat(g_buffer, BUFFER_SIZE_MAX, message, 3);
  for(new i = 0; i < x; i++) {
    say(g_buffer);
  }
}

/*
* Gets the team name defined as a cvar.
*
* @param id The team enum id.
*/
get_name(cvars:id) {
  get_pcvar_string(g_cvars[id], g_buffer_md, BUFFER_SIZE_MD);
  return g_buffer_md;
}

/*
* Gets a team's score depending on the stage of the game.
*
* @param id The team enum id.
*/
get_score(id) {
  return g_over_time
    ? g_over_time_score[id]
    : g_score[id]
  ;
}

/*
* Gets the sum of an array of integers.
*
* @param data The array of integers.
* @param size The size of the array.
* @return The sum.
*/
get_sum_of_array(data[], size) {
  new i, sum;

  for(i = 0; i < size; i++) {
    sum += data[i];
  }

  return sum;
}

/*
* Emulates the chat behavior from `rcon say` where the
* server's hostname is prefixed before the message.
*
* @param message The message to print.
*/
say(message[], any:...) {
  vformat(g_buffer, BUFFER_SIZE_MAX, message, 2);
  client_print(0, print_chat, "<%s> %s", g_hostname, g_buffer);
}
