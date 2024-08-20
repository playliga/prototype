/**
 * A match plugin.
 */
#include <sourcemod>
#include <sdktools>
#include <cstrike>

// set compiler options
#pragma semicolon 1;

// constants
const float LO3_INTERVAL          = 3.0;
const int   BUFFER_SIZE_SM        = 63;
const int   BUFFER_SIZE_MAX       = 2047;
const int   DELAY_WELCOME_MESSAGE = 5;
const int   LO3_LOOP_NUM          = 3;
const int   LO3_PRINT_NUM         = 4;
const int   TEAM_T                = 0;
const int   TEAM_CT               = 1;

// cvars
enum Cvars {
  DELAY_GAME_OVER,
  MAX_ROUNDS,
  OVERTIME_ENABLE,
  TEAM_NAME_T,
  TEAM_NAME_CT,
}
ConVar cvars[Cvars];

// variables
bool  live, halfTime, overTime      = false;
char  buffer[BUFFER_SIZE_MAX + 1]   = "";
char  hostname[BUFFER_SIZE_SM + 1]  = "";
char  modelsTs[][]                  = {"models/player/t_guerilla.mdl", "models/player/t_leet.mdl", "models/player/t_phoenix.mdl"};
char  modelsCTs[][]                 = {"models/player/ct_gign.mdl", "models/player/ct_gsg9.mdl", "models/player/ct_sas.mdl"};
int   reasonWinCTs[]                = {4, 5, 6, 7, 10, 11, 13, 16, 19};
int   reasonWinTs[]                 = {0, 3, 8, 12, 17, 18};
int   score[]                       = {0, 0};
int   scoreOverTime[]               = {0, 0};


/**
 * Plugin information.
 */
public Plugin myinfo = {
  name        = "LIGA Esports Manager",
  author      = "LIGA Esports Manager",
  description = "LIGA Esports Manager",
  version     = "1.0.0",
  url         = "https://lemonpole.github.io/liga-public/"
}

/**
 * Plugin initialization.
 *
 * @noreturn
 */
public void OnPluginStart() {
  RegConsoleCmd("ready", Command_ReadyUp, "Starts the match.");
  RegConsoleCmd("score", Command_Score, "Shows the score.");
  RegAdminCmd("mp_swapteams", Command_SwapTeams, ADMFLAG_SLAY, "Swaps the teams.");
  cvars[DELAY_GAME_OVER] = CreateConVar("liga_gameover_delay", "5");
  cvars[MAX_ROUNDS] = CreateConVar("liga_max_rounds", "30");
  cvars[OVERTIME_ENABLE] = CreateConVar("liga_overtime_enable", "0");
  cvars[TEAM_NAME_T] = CreateConVar("liga_teamname_t", "Terrorists");
  cvars[TEAM_NAME_CT] = CreateConVar("liga_teamname_ct", "Terrorists");

  // tidy the chat area by silencing these events
  HookEvent("player_connect_client", Event_TidyChat, EventHookMode_Pre);
  HookEvent("player_disconnect", Event_TidyChat, EventHookMode_Pre);
  HookEvent("player_team", Event_TidyChat, EventHookMode_Pre);
  HookEvent("server_cvar", Event_TidyChat, EventHookMode_Pre);
}

/**
 * Signifies that the player is fully in-game.
 *
 * @param id The index of the player that joined.
 */
public void OnClientPutInServer(int id) {
  if(StrEqual(hostname, "")) {
    new Handle:convar = FindConVar("hostname");
    GetConVarString(convar, hostname, sizeof(hostname));
  }

  if(!IsFakeClient(id)) {
    ServerCommand("exec liga-bots");
    CreateTimer(float(DELAY_WELCOME_MESSAGE), Timer_WelcomeMessage, id);
  }
}

/**
 * Called when the map is loaded.
 *
 * A good place to precache models, sounds, etc.
 */
public void OnMapStart() {
  for(int i = 0; i < sizeof(modelsTs); i++) {
    PrecacheModel(modelsTs[i], true);
    PrecacheModel(modelsCTs[i], true);
  }
}

/**
 * Triggered when the round is over.
 *
 * @param delay Time (in seconds) until new round starts.
 * @param reason Reason for round end.
 */
public Action CS_OnTerminateRound(float &delay, CSRoundEndReason &reason) {
  // bail if game is not live
  if(!live) {
    return Plugin_Continue;
  }

  // grab the winner of this round
  int winner = 0;

  for (int i = 0; i < sizeof(reasonWinTs); i++) {
    if (reasonWinTs[i] == view_as<int>(reason)) {
      winner = TEAM_T;
      break;
    }
  }

  for (int i = 0; i < sizeof(reasonWinCTs); i++) {
    if (reasonWinCTs[i] == view_as<int>(reason)) {
      winner = TEAM_CT;
      break;
    }
  }

  // invert score if past half-time
  if(halfTime) {
    score[1 - winner]++;
    scoreOverTime[1 - winner] += overTime ? 1 : 0;
  } else {
    score[winner]++;
    scoreOverTime[winner] += overTime ? 1 : 0;
  }

  // grab team scores
  int scoreTs = getScore(TEAM_T);
  int scoreCTs = getScore(TEAM_CT);

  // grab round information
  int roundsTotal = getArraySum(overTime ? scoreOverTime : score, sizeof(score));
  int roundsHalfTime = cvars[MAX_ROUNDS].IntValue / 2;
  int roundsClinch = cvars[MAX_ROUNDS].IntValue / 2 + 1;
  bool roundsLast = scoreTs == roundsClinch - 1 || scoreCTs == roundsClinch - 1;

  // report score
  sayScore(roundsLast ? "GAME POINT" : "ROUND OVER");

  // handle half-time
  if(roundsTotal == roundsHalfTime) {
    halfTime = true;
    live = false;
    ServerCommand("exec liga-halftime.cfg");
    say("HALFTIME");
    say("TO START THE SECOND-HALF TYPE: .ready");
    return Plugin_Continue;
  }

  // handle overtime
  if(
    roundsTotal == cvars[MAX_ROUNDS].IntValue &&
    cvars[OVERTIME_ENABLE].BoolValue &&
    scoreTs == scoreCTs
  ) {
    halfTime = true;
    live = false;
    overTime = true;
    // @todo: override max rounds
    ServerCommand("exec liga-halftime.cfg");
    say("OVERTIME");
    say("TO START OVERTIME TYPE: .ready");
    return Plugin_Continue;
  }

  // game is over
  if(
    roundsTotal == cvars[MAX_ROUNDS].IntValue ||
    scoreTs == roundsClinch ||
    scoreCTs == roundsClinch
  ) {
    say("GAME OVER");
    say("SHUTTING DOWN SERVER IN %ds...", cvars[DELAY_GAME_OVER].IntValue);
    CreateTimer(float(cvars[DELAY_GAME_OVER].IntValue), Timer_GameOver);
  }

  return Plugin_Continue;
}

/**
 * Ready up command handler.
 *
 * @param id The index of the player that joined.
 * @param args The command arguments.
 */
public Action Command_ReadyUp(int id, int args) {
  // bail if we're already live
  if(live) {
    return Plugin_Continue;
  }

  live = true;
  ServerCommand("competitive");
  CreateTimer(LO3_INTERVAL, Timer_LO3, _, LO3_LOOP_NUM);
  return Plugin_Continue;
}

/**
 * Score command handler.
 *
 * @param id The index of the player that joined.
 * @param args The command arguments.
 */
public Action Command_Score(int id, int args) {
  // bail if game is not live
  if(!live && !halfTime && !overTime) {
    return Plugin_Continue;
  }

  sayScore();
  return Plugin_Continue;
}

/**
 * Swaps the teams.
 *
 * @param id The index of the player that joined.
 * @param args The command arguments.
 */
public Action Command_SwapTeams(int id, int args) {
  for(int client = 0; client < MaxClients; client++) {
    if(client <= 0 || !IsClientInGame(client) || IsClientSourceTV(client) || IsClientReplay(client)) {
      continue;
    }

    int team = GetClientTeam(client);

    if(team == CS_TEAM_T) {
      CS_SwitchTeam(client, CS_TEAM_CT);
      SetEntityModel(client, modelsCTs[GetRandomInt(0, sizeof(modelsCTs) - 1)]);
    } else if(team == CS_TEAM_CT) {
      CS_SwitchTeam(client, CS_TEAM_T);
      SetEntityModel(client, modelsTs[GetRandomInt(0, sizeof(modelsTs) - 1)]);
    }
  }

  return Plugin_Continue;
}

/**
 * Filters out extraneous chat messages.
 *
 * @param event         The event handle.
 * @param name          String containing the name of the event.
 * @param dontBroadcast True if event was not broadcast to clients, false otherwise.
 */
public Action Event_TidyChat(Event event, const char[] name, bool dontBroadcast) {
  event.BroadcastDisabled = true;
  return Plugin_Continue;
}

/**
 * Handles the game over event by simulating
 * CS:GO's game over event log message.
 *
 * @param timer The timer handler.
 */
public Action Timer_GameOver(Handle timer) {
  // using echo here because the logging functions
  // somehow do not get logged to `qconsole.log`
  GetCurrentMap(buffer, BUFFER_SIZE_MAX);
  ServerCommand("echo Game Over: competitive  %s score %d:%d", buffer, getScore(TEAM_T), getScore(TEAM_CT));

  // shut the server down
  ServerCommand("exit");
  return Plugin_Continue;
}

/**
 * Live on three restart timer.
 *
 * @param timer The timer handler.
 */
public Action Timer_LO3(Handle timer) {
  static int i = 0;
  ServerCommand("mp_restartgame 1");
  say("RESTART %d", i + 1);
  sayX(LO3_PRINT_NUM, "* * * %d * * *", i + 1);

  if(i == LO3_LOOP_NUM - 1) {
    i = 0;
    sayX(LO3_PRINT_NUM + 1, "* * * ---LIVE--- * * *");
    return Plugin_Stop;
  }

  i++;
  return Plugin_Continue;
}

/**
 * Displays the welcome message.
 *
 * @param timer The timer handler.
 * @param id The index of the player that joined.
 */
public Action Timer_WelcomeMessage(Handle timer, int id) {
  say("TO START THE MATCH TYPE: .ready");
  say("ONCE LIVE TO CHECK THE SCORE TYPE: .score");
  return Plugin_Continue;
}

/**
 * Gets the sum of an array of integers.
 *
 * @param data The array of integers.
 * @param size The size of the array.
 * @return The sum.
 */
int getArraySum(int[] data, int size) {
  int sum = 0;

  for(int i = 0; i < size; i++) {
    sum += data[i];
  }

  return sum;
}

/**
 * Gets a team's score depending on the stage of the game.
 *
 * @param id The team enum id.
 */
int getScore(int id) {
  return overTime
    ? scoreOverTime[id]
    : score[id]
  ;
}

/**
 * Emulates the chat behavior from `rcon say` where the
 * server's hostname is prefixed before the message.
 *
 * @param message The message to print.
 */
public void say(const char[] message, any ...) {
  VFormat(buffer, sizeof(buffer), message, 2);
  PrintToChatAll("<%s> %s", hostname, buffer);
}

/**
 * Prints the score to the client.
 *
 * @param prefix Whether to print a prefix.
 */
void sayScore(char[] prefix = "") {
  char nameTs[BUFFER_SIZE_MAX + 1];
  char nameCTs[BUFFER_SIZE_MAX + 1];
  int score_t = getScore(TEAM_T);
  int score_ct = getScore(TEAM_CT);

  cvars[TEAM_NAME_T].GetString(nameTs, BUFFER_SIZE_MAX);
  cvars[TEAM_NAME_CT].GetString(nameCTs, BUFFER_SIZE_MAX);

  if(strlen(prefix) > 0) {
    say("%s | %s %d - %d %s", prefix, nameTs, score_t, score_ct, nameCTs);
    return;
  }

  say("%s %d - %d %s", nameTs, score_t, score_ct, nameCTs);
}

/**
 * Prints a message to chat x-amount of times.
 *
 * @param x The number of times to print the message.
 * @param message The message to print.
 */
public void sayX(int x, const char[] message, any ...) {
  VFormat(buffer, sizeof(buffer), message, 3);
  for(int i = 0; i < x; i++) {
    say(buffer);
  }
}
