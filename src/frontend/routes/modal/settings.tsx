/**
 * Configure application settings.
 *
 * @module
 */
import React from 'react';
import { cloneDeep, isNull, set } from 'lodash';
import { useLocation, useNavigate } from 'react-router-dom';
import { Constants, Util } from '@liga/shared';
import { cx } from '@liga/frontend/lib';
import { AppStateContext } from '@liga/frontend/redux';
import { useTranslation } from '@liga/frontend/hooks';
import { FaChevronRight, FaExclamationTriangle, FaFolderOpen } from 'react-icons/fa';

/** @enum */
enum Tab {
  GENERAL,
  MATCH_RULES,
  CALENDAR,
}

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const navigate = useNavigate();
  const location = useLocation();
  const t = useTranslation('windows');
  const { state } = React.useContext(AppStateContext);
  const [activeTab, setActiveTab] = React.useState(Tab.GENERAL);
  const [settings, setSettings] = React.useState(Constants.Settings);
  const [appStatus, setAppStatus] = React.useState<NodeJS.ErrnoException>();
  const [mapPool, setMapPool] = React.useState<Awaited<ReturnType<typeof api.mapPool.find>>>([]);

  // load settings
  React.useEffect(() => {
    if (!state.profile) {
      return;
    }

    setSettings(Util.loadSettings(state.profile.settings));
  }, [state.profile]);

  // validate game installation path
  React.useEffect(() => {
    api.app.status().then((status) => !!status && setAppStatus(JSON.parse(status)));

    // we also want to fetch a new map pool
    api.mapPool
      .find({
        where: {
          gameVersion: {
            slug: settings.general.game,
          },
        },
      })
      .then(setMapPool);
  }, [settings]);

  // handle settings updates
  const onSettingsUpdate = (path: string, value: unknown) => {
    const modified = cloneDeep(settings);
    set(modified, path, value);
    api.profiles.update({
      where: { id: state.profile.id },
      data: {
        settings: JSON.stringify(modified),
      },
    });
  };

  // steam and game path validation
  const steamPathError = React.useMemo(() => {
    if (!appStatus) {
      return;
    }
    const [, match] = appStatus.path.match(/(steam\.exe)/) || [];
    return match ? appStatus.path : '';
  }, [appStatus]);
  const gamePathError = React.useMemo(() => {
    if (!appStatus) {
      return;
    }
    const [, match] = appStatus.path.match(/((?:csgo|hl|hl2)\.exe)/) || [];
    return match ? appStatus.path : '';
  }, [appStatus]);

  return (
    <main>
      <header role="tablist" className="tabs-box tabs sticky top-0 left-0 rounded-none">
        {Object.keys(Tab)
          .filter((tabKey) => isNaN(Number(tabKey)))
          .map((tabKey: keyof typeof Tab) => (
            <a
              key={tabKey + '__tab'}
              role="tab"
              className={cx('tab capitalize', Tab[tabKey] === activeTab && 'tab-active')}
              onClick={() => setActiveTab(Tab[tabKey])}
            >
              {tabKey.replace('_', ' ').toLowerCase()}
            </a>
          ))}
      </header>
      <form className="form-ios h-full">
        {activeTab === Tab.GENERAL && (
          <fieldset>
            <section>
              <header>
                <p>{t('settings.gameTitle')}</p>
                {settings.general.game === Constants.Game.CS2 && (
                  <p className="text-warning">{t('settings.gameSubtitleCS2')}</p>
                )}
                {settings.general.game !== Constants.Game.CS2 && (
                  <p>{t('settings.gameSubtitle')}</p>
                )}
              </header>
              <article>
                <select
                  className="select"
                  onChange={(event) => onSettingsUpdate('general.game', event.target.value)}
                  value={settings.general.game}
                >
                  {Object.values(Constants.Game).map((game) => (
                    <option key={game} value={game}>
                      {game}
                    </option>
                  ))}
                </select>
              </article>
            </section>
            <section>
              <header>
                <p>{t('settings.simTitle')}</p>
              </header>
              <article>
                <select
                  className="select"
                  onChange={(event) =>
                    onSettingsUpdate('general.simulationMode', event.target.value)
                  }
                  value={settings.general.simulationMode}
                >
                  {Object.values(Constants.SimulationMode).map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </article>
            </section>
            <section>
              <header>
                <p>{t('settings.logLevelTitle')}</p>
              </header>
              <article>
                <select
                  className="select"
                  onChange={(event) => onSettingsUpdate('general.logLevel', event.target.value)}
                  value={settings.general.logLevel}
                >
                  {Object.values(Constants.LogLevel).map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </article>
            </section>
            <section>
              <header>
                <p>{t('settings.steamTitle')}</p>
                <p>
                  e.g.: <code>C:\Program Files\Steam</code>
                </p>
                {!!steamPathError && (
                  <span className="tooltip" data-tip={String(steamPathError)}>
                    <FaExclamationTriangle className="text-error" />
                  </span>
                )}
              </header>
              <article className="join">
                <input
                  readOnly
                  type="text"
                  className="input join-item bg-base-200 cursor-default text-sm"
                  value={settings.general.steamPath || ''}
                />
                <button
                  type="button"
                  className="btn join-item"
                  onClick={() =>
                    api.app
                      .dialog(Constants.WindowIdentifier.Modal, {
                        properties: ['openDirectory'],
                      })
                      .then(
                        (dialogData) =>
                          !dialogData.canceled &&
                          onSettingsUpdate('general.steamPath', dialogData.filePaths[0]),
                      )
                  }
                >
                  <FaFolderOpen />
                </button>
              </article>
            </section>
            <section>
              <header>
                <p>{t('settings.gamePathTitle')}</p>
                <p>{t('settings.gamePathSubtitle')}</p>
                {!!gamePathError && (
                  <span className="tooltip" data-tip={String(gamePathError)}>
                    <FaExclamationTriangle className="text-error" />
                  </span>
                )}
              </header>
              <article className="join">
                <input
                  readOnly
                  type="text"
                  className="input join-item bg-base-200 cursor-default text-sm"
                  value={settings.general.gamePath || ''}
                />
                <button
                  type="button"
                  className="btn join-item"
                  onClick={() =>
                    api.app
                      .dialog(Constants.WindowIdentifier.Modal, {
                        properties: ['openDirectory'],
                      })
                      .then(
                        (dialogData) =>
                          !dialogData.canceled &&
                          onSettingsUpdate('general.gamePath', dialogData.filePaths[0]),
                      )
                  }
                >
                  <FaFolderOpen />
                </button>
              </article>
            </section>
            <section>
              <header>
                <p>{t('settings.launchOptionsTitle')}</p>
                <p>{t('settings.launchOptionsSubtitle')}</p>
              </header>
              <article>
                <input
                  type="text"
                  className="input join-item bg-base-200 text-sm"
                  value={settings.general.gameLaunchOptions || ''}
                  onChange={(event) =>
                    onSettingsUpdate('general.gameLaunchOptions', event.target.value)
                  }
                />
              </article>
            </section>
            <section>
              <header>
                <p>{t('settings.botChatterTitle')}</p>
              </header>
              <article>
                <select
                  className="select"
                  onChange={(event) => onSettingsUpdate('general.botChatter', event.target.value)}
                  value={settings.general.botChatter}
                >
                  {Object.values(Constants.BotChatter).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </article>
            </section>
            <section>
              <header>
                <p>{t('settings.botDifficultyTitle')}</p>
              </header>
              <article>
                <select
                  className="select"
                  onChange={(event) =>
                    onSettingsUpdate(
                      'general.botDifficulty',
                      event.target.value === 'Default' ? null : event.target.value,
                    )
                  }
                  value={
                    isNull(settings.general.botDifficulty) ? '' : settings.general.botDifficulty
                  }
                >
                  <option value={null}>Default</option>
                  {Object.values(Constants.BotDifficulty).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </article>
            </section>
            <section>
              <header>
                <p>{t('settings.themeTitle')}</p>
              </header>
              <article>
                <select
                  className="select"
                  onChange={(event) => onSettingsUpdate('general.theme', event.target.value)}
                  value={settings.general.theme || Constants.ThemeType.SYSTEM}
                >
                  {Object.values(Constants.ThemeType).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </article>
            </section>
          </fieldset>
        )}
        {activeTab === Tab.MATCH_RULES && (
          <fieldset>
            <section>
              <header>
                <p>{t('shared.bombTimer')}</p>
              </header>
              <article>
                <select
                  className="select"
                  onChange={(event) => onSettingsUpdate('matchRules.bombTimer', event.target.value)}
                  value={settings.matchRules.bombTimer}
                >
                  {[35, 40, 45].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </article>
            </section>
            <section>
              <header>
                <p>{t('shared.maxRoundsTitle')}</p>
              </header>
              <article>
                <select
                  className="select"
                  onChange={(event) => onSettingsUpdate('matchRules.maxRounds', event.target.value)}
                  value={settings.matchRules.maxRounds}
                >
                  {[6, 12, 24, 30].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </article>
            </section>
            <section>
              <header>
                <p>{t('shared.startMoneyTitle')}</p>
              </header>
              <article>
                <select
                  className="select"
                  onChange={(event) =>
                    onSettingsUpdate('matchRules.startMoney', event.target.value)
                  }
                  value={settings.matchRules.startMoney}
                >
                  {[800, 10_000].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </article>
            </section>
            <section>
              <header>
                <p>{t('shared.freezeTimeTitle')}</p>
              </header>
              <article>
                <select
                  className="select"
                  onChange={(event) =>
                    onSettingsUpdate('matchRules.freezeTime', event.target.value)
                  }
                  value={settings.matchRules.freezeTime}
                >
                  {[7, 15].map((value) => (
                    <option key={value} value={value}>
                      {value}s
                    </option>
                  ))}
                </select>
              </article>
            </section>
            <section>
              <header>
                <p>{t('shared.mapOverrideTitle')}</p>
              </header>
              <article>
                <select
                  className="select"
                  onChange={(event) =>
                    onSettingsUpdate(
                      'matchRules.mapOverride',
                      event.target.value === 'none' ? null : event.target.value,
                    )
                  }
                  value={
                    isNull(settings.matchRules.mapOverride) ? '' : settings.matchRules.mapOverride
                  }
                >
                  <option value={null}>none</option>
                  {mapPool.map((map) => (
                    <option key={map.gameMap.name} value={map.gameMap.name}>
                      {map.gameMap.name}
                    </option>
                  ))}
                </select>
              </article>
            </section>
            <section>
              <header>
                <p>{t('shared.mapPool')}</p>
              </header>
              <article>
                <aside
                  className="text-muted flex h-10 w-full cursor-pointer items-center justify-end"
                  onClick={() =>
                    navigate('/map-pool', {
                      state: {
                        from: location.pathname,
                        label: t('shared.settings'),
                      } as RouteStateMapPool,
                    })
                  }
                >
                  <FaChevronRight />
                </aside>
              </article>
            </section>
            <section>
              <header>
                <p>{t('shared.overtimeTitle')}</p>
                <p>{t('shared.overtimeSubtitle')}</p>
              </header>
              <article>
                <input
                  type="checkbox"
                  className="toggle"
                  onChange={(event) =>
                    onSettingsUpdate('matchRules.overtime', event.target.checked)
                  }
                  checked={settings.matchRules.overtime}
                  value={String(settings.matchRules.overtime)}
                />
              </article>
            </section>
          </fieldset>
        )}
        {activeTab === Tab.CALENDAR && (
          <fieldset>
            <section>
              <header>
                <p>{t('settings.loopTitle')}</p>
              </header>
              <article className="stack-x join">
                <input
                  type="number"
                  min="1"
                  className="input join-item"
                  value={settings.calendar.maxIterations}
                  onChange={(event) =>
                    onSettingsUpdate('calendar.maxIterations', event.target.value)
                  }
                />
                <select
                  className="join-item select"
                  onChange={(event) => onSettingsUpdate('calendar.unit', event.target.value)}
                  value={settings.calendar.unit}
                >
                  {Object.values(Constants.CalendarUnit).map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </article>
            </section>
            <section>
              <header>
                <p>{t('settings.loopExitTitle')}</p>
                <p>{t('settings.loopExitSubtitle')}</p>
              </header>
              <article>
                <input
                  type="checkbox"
                  className="toggle"
                  onChange={(event) =>
                    onSettingsUpdate('calendar.ignoreExits', event.target.checked)
                  }
                  checked={settings.calendar.ignoreExits}
                  value={String(settings.calendar.ignoreExits)}
                />
              </article>
            </section>
          </fieldset>
        )}
      </form>
    </main>
  );
}
