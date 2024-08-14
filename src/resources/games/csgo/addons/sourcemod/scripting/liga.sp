/**
 * A match plugin.
 */
#include <sourcemod>

// set compiler options
#pragma semicolon 1;

// constants
const int BUFFER_SIZE_SM        = 63;
const int BUFFER_SIZE_MAX       = 2047;
const int DELAY_GAME_OVER       = 10;
const int DELAY_WELCOME_MESSAGE = 5;

// variables
char buffer[BUFFER_SIZE_MAX + 1]  = "";
char hostname[BUFFER_SIZE_SM + 1] = "";

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
  HookEventEx("cs_win_panel_match", Event_GameOver);
  RegConsoleCmd("ready", Command_ReadyUp, "Starts the match.");
}

/**
 * Handles the game over event.
 *
 * @param event The event handler.
 * @param name The name of the event.
 * @param dontBroadcast Whether to broadcast the event.
 */
public void Event_GameOver(Event event, const char[] name, bool dontBroadcast) {
  say("SHUTTING DOWN SERVER IN %ds", DELAY_GAME_OVER);
  CreateTimer(float(DELAY_GAME_OVER), Timer_GameOver);
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
 * Ready up command handler.
 *
 * @param id The index of the player that joined.
 * @param args The command arguments.
 */
public Action Command_ReadyUp(int id, int args) {
  ServerCommand("mp_warmup_end");
  return Plugin_Continue;
}

/**
 * Exits the game once the game is over.
 */
public Action Timer_GameOver(Handle timer) {
  ServerCommand("exit");
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
  return Plugin_Continue;
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
