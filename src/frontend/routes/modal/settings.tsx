/**
 * Configure application settings.
 *
 * @module
 */
import React from 'react';
import { cloneDeep, isNull, set } from 'lodash';
import { Constants } from '@liga/shared';
import { FaExclamationTriangle, FaFolderOpen } from 'react-icons/fa';

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const [settings, setSettings] = React.useState(Constants.Settings);
  const [profile, setProfile] = React.useState<Awaited<ReturnType<typeof api.profiles.current>>>();
  const [steamPathError, setSteamPathError] = React.useState<unknown>();

  // grab required data on first load
  React.useEffect(() => {
    api.profiles.current().then(setProfile);
  }, []);

  // load settings
  React.useEffect(() => {
    if (!profile) {
      return;
    }

    setSettings(JSON.parse(profile.settings));
  }, [profile]);

  // validate game installation path
  React.useEffect(() => {
    if (!settings.general.steamPath) {
      return;
    }

    api.app.status().then(setSteamPathError);
  }, [settings]);

  // handle settings updates
  const onSettingsUpdate = (path: string, value: unknown) => {
    const modified = cloneDeep(settings);
    set(modified, path, value);
    setSettings(modified);
    api.profiles.update({
      where: { id: profile.id },
      data: {
        settings: JSON.stringify(modified),
      },
    });
  };

  return (
    <form className="form-ios h-full">
      <fieldset>
        <legend>General</legend>
        <section>
          <header>
            <h3>Game</h3>
            <p>This will launch the selected game when playing matches.</p>
          </header>
          <article>
            <select
              className="select w-full"
              onChange={(event) => onSettingsUpdate('general.game', event.target.value)}
              value={settings.general.game}
            >
              {Object.values(Constants.Game).map((game) => (
                <option key={game} value={game} disabled={game === Constants.Game.CSS}>
                  {game}
                </option>
              ))}
            </select>
          </article>
        </section>
        <section>
          <header>
            <h3>Simulation Mode</h3>
          </header>
          <article>
            <select
              className="select w-full"
              onChange={(event) => onSettingsUpdate('general.simulationMode', event.target.value)}
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
            <h3>Log Level</h3>
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
            <h3>Steam Path</h3>
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
      </fieldset>
      <fieldset>
        <legend>Match Rules</legend>
        <section>
          <header>
            <h3>Max Rounds</h3>
          </header>
          <article>
            <select
              className="select w-full"
              onChange={(event) => onSettingsUpdate('matchRules.maxRounds', event.target.value)}
              value={settings.matchRules.maxRounds}
            >
              {[6, 12, 30].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </article>
        </section>
        <section>
          <header>
            <h3>Freeze Time</h3>
          </header>
          <article>
            <select
              className="select w-full"
              onChange={(event) => onSettingsUpdate('matchRules.freezeTime', event.target.value)}
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
            <h3>Map Override</h3>
          </header>
          <article>
            <select
              className="select w-full"
              onChange={(event) => onSettingsUpdate('matchRules.mapOverride', event.target.value)}
              value={isNull(settings.matchRules.mapOverride) ? '' : settings.matchRules.mapOverride}
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
      </fieldset>
      <fieldset>
        <legend>Calendar</legend>
        <section>
          <header>
            <h3>Loop Until</h3>
          </header>
          <article className="stack-x join">
            <input
              type="number"
              min="1"
              className="input join-item w-full"
              value={settings.calendar.maxIterations}
              onChange={(event) => onSettingsUpdate('calendar.maxIterations', event.target.value)}
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
            <h3>Ignore Loop Exits</h3>
            <p>Usually the calendar loop is stopped for things like matchdays and e-mails.</p>
          </header>
          <article>
            <input
              type="checkbox"
              className="toggle"
              onChange={(event) => onSettingsUpdate('calendar.ignoreExits', event.target.checked)}
              checked={settings.calendar.ignoreExits}
              value={String(settings.calendar.ignoreExits)}
            />
          </article>
        </section>
      </fieldset>
    </form>
  );
}
