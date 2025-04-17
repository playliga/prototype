/**
 * Configure application settings.
 *
 * @module
 */
import React from 'react';
import cx from 'classnames';
import { cloneDeep, isNull, set } from 'lodash';
import { Constants, Util } from '@liga/shared';
import { AppStateContext } from '@liga/frontend/redux';
import { useTranslation } from '@liga/frontend/hooks';
import { FaExclamationTriangle, FaFolderOpen } from 'react-icons/fa';

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
  const t = useTranslation('windows');
  const { state } = React.useContext(AppStateContext);
  const [activeTab, setActiveTab] = React.useState(Tab.GENERAL);
  const [settings, setSettings] = React.useState(Constants.Settings);
  const [appStatus, setAppStatus] = React.useState<NodeJS.ErrnoException>();

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
      <header role="tablist" className="tabs-boxed tabs sticky left-0 top-0">
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
                <h3>{t('settings.gameTitle')}</h3>
                {settings.general.game === Constants.Game.CS2 && (
                  <p className="text-warning">{t('settings.gameSubtitleCS2')}</p>
                )}
                {settings.general.game !== Constants.Game.CS2 && (
                  <p>{t('settings.gameSubtitle')}</p>
                )}
              </header>
              <article>
                <select
                  className="select w-full"
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
                <h3>{t('settings.simTitle')}</h3>
              </header>
              <article>
                <select
                  className="select w-full"
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
                <h3>{t('settings.logLevelTitle')}</h3>
              </header>
              <article>
                <select
                  className="select w-full"
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
                <h3>{t('settings.steamTitle')}</h3>
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
                  className="input join-item w-full cursor-default bg-base-200 text-sm"
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
                <h3>{t('settings.gamePathTitle')}</h3>
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
                  className="input join-item w-full cursor-default bg-base-200 text-sm"
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
                <h3>{t('settings.launchOptionsTitle')}</h3>
                <p>{t('settings.launchOptionsSubtitle')}</p>
              </header>
              <article>
                <input
                  type="text"
                  className="input join-item w-full bg-base-200 text-sm"
                  value={settings.general.gameLaunchOptions || ''}
                  onChange={(event) =>
                    onSettingsUpdate('general.gameLaunchOptions', event.target.value)
                  }
                />
              </article>
            </section>
            <section>
              <header>
                <h3>{t('settings.botChatterTitle')}</h3>
              </header>
              <article>
                <select
                  className="select w-full"
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
                <h3>{t('settings.botDifficultyTitle')}</h3>
              </header>
              <article>
                <select
                  className="select w-full"
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
                <h3>{t('settings.themeTitle')}</h3>
              </header>
              <article>
                <select
                  className="select w-full"
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
                <h3>{t('shared.maxRoundsTitle')}</h3>
              </header>
              <article>
                <select
                  className="select w-full"
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
                <h3>{t('shared.startMoneyTitle')}</h3>
              </header>
              <article>
                <select
                  className="select w-full"
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
                <h3>{t('shared.freezeTimeTitle')}</h3>
              </header>
              <article>
                <select
                  className="select w-full"
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
                <h3>{t('shared.mapOverrideTitle')}</h3>
              </header>
              <article>
                <select
                  className="select w-full"
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
                  {Constants.MapPool.map((map) => (
                    <option key={map} value={map}>
                      {map}
                    </option>
                  ))}
                </select>
              </article>
            </section>
            <section>
              <header>
                <h3>{t('shared.overtimeTitle')}</h3>
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
                <h3>{t('settings.loopTitle')}</h3>
              </header>
              <article className="stack-x join">
                <input
                  type="number"
                  min="1"
                  className="input join-item w-full"
                  value={settings.calendar.maxIterations}
                  onChange={(event) =>
                    onSettingsUpdate('calendar.maxIterations', event.target.value)
                  }
                />
                <select
                  className="join-item select w-full"
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
                <h3>{t('settings.loopExitTitle')}</h3>
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
