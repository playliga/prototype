const GameSettings = {
  // general settings
  BOT_VOICEPITCH_MAX                  : 125,
  BOT_VOICEPITCH_MIN                  : 80,
  BOT_WEAPONPREFS_PROBABILITY_RIFLE   : 3,
  BOT_WEAPONPREFS_PROBABILITY_SNIPER  : 1,
  GAMEFILES_BASEDIR                   : 'resources/gamefiles',
  SERVER_CVAR_MAXROUNDS               : 30,
  SERVER_CVAR_MAXROUNDS_OT            : 6,
  SERVER_CVAR_FREEZETIME              : 15,
  SQUAD_STARTERS_NUM                  : 5,

  // cs16 settings
  CS16_APPID                          : 10,
  CS16_BASEDIR                        : 'steamapps/common/Half-Life',
  CS16_BOT_CONFIG                     : 'botprofile.db',
  CS16_DELAY_GAMEOVER                 : 10000,
  CS16_DELAY_HALFTIME                 : 3000,
  CS16_DLL_BOTS                       : 'dlls/liga.dll',
  CS16_DLL_METAMOD                    : 'addons/metamod/dlls/metamod.dll',
  CS16_GAMEDIR                        : 'cstrike',
  CS16_HLDS_EXE                       : 'hlds.exe',
  CS16_LOGFILE                        : 'qconsole.log',
  CS16_SERVER_CONFIG_FILE             : 'liga.cfg',

  // csgo settings
  CSGO_APPID                          : 730,
  CSGO_BOT_CONFIG                     : 'botprofile.db',
  CSGO_BASEDIR                        : 'steamapps/common/Counter-Strike Global Offensive',
  CSGO_GAMEDIR                        : 'csgo',
  CSGO_GAMEMODES_FILE                 : 'gamemodes_liga.txt',
  CSGO_LANGUAGE_FILE                  : 'resource/csgo_english.txt',
  CSGO_LOGFILE                        : 'logs/liga.log',
  CSGO_SERVER_CONFIG_FILE             : 'cfg/liga.cfg',

  // rcon settings
  RCON_MAX_ATTEMPTS                   : 15,
  RCON_PASSWORD                       : 'liga',
  RCON_PORT                           : 27015,
};


export default GameSettings;
