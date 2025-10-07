/**
 * Exhibition match selection screen.
 *
 * @module
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cloneDeep, isNull, sample, set } from 'lodash';
import { Constants, Eagers, Util } from '@liga/shared';
import { cx } from '@liga/frontend/lib';
import { useTranslation } from '@liga/frontend/hooks';
import { Image } from '@liga/frontend/components';
import { findTeamOptionByValue, TeamSelect } from '@liga/frontend/components/select';
import {
  FaArrowLeft,
  FaCaretLeft,
  FaCaretRight,
  FaExclamationTriangle,
  FaFolderOpen,
} from 'react-icons/fa';

/** @enum */
enum Tab {
  GENERAL,
  MATCH_RULES,
}

/** @interface */
interface TeamSelectorProps {
  onChange: (teamId: number) => void;
  initialFederationId?: number;
  initialTierId?: number;
}

/**
 * Team selector component.
 *
 * @param props Root props.
 * @function
 */
function TeamSelector(props: TeamSelectorProps) {
  const t = useTranslation('windows');
  const [federations, setFederations] = React.useState<
    Awaited<ReturnType<typeof api.federations.all>>
  >([]);
  const [selectedFederationId, setSelectedFederationId] = React.useState<number>(
    props.initialFederationId,
  );
  const [selectedTeam, setSelectedTeam] =
    React.useState<ReturnType<typeof findTeamOptionByValue>>();
  const [selectedTierId, setSelectedTierId] = React.useState<number>(props.initialTierId);
  const [teams, setTeams] = React.useState<
    Awaited<ReturnType<typeof api.teams.all<typeof Eagers.team>>>
  >([]);

  // build team query
  const teamQuery = React.useMemo(
    () => ({
      ...Eagers.team,
      ...Util.buildTeamQuery(selectedFederationId, null, selectedTierId),
    }),
    [selectedFederationId, selectedTierId],
  );

  // initial data fetch
  React.useEffect(() => {
    api.federations.all().then(setFederations);
  }, []);

  // apply team filters
  React.useEffect(() => {
    api.teams.all<typeof Eagers.team>(teamQuery).then(setTeams);
  }, [teamQuery]);

  // preload random team
  React.useEffect(() => {
    if (!teams.length || selectedTeam) {
      return;
    }

    const randomTeam = sample(teams);
    setSelectedTeam({ value: randomTeam.id, label: randomTeam.name, ...randomTeam });
  }, [selectedTeam, teams]);

  // callback handler
  React.useEffect(() => {
    if (!selectedTeam) {
      return;
    }

    props.onChange(selectedTeam.id);
  }, [selectedTeam]);

  // massage team data to team selector data structure
  const teamSelectorData = React.useMemo(
    () =>
      Constants.Prestige.filter((_, prestigeIdx) =>
        Number.isInteger(selectedTierId) ? prestigeIdx === selectedTierId : true,
      ).map((prestige) => ({
        label: Constants.IdiomaticTier[prestige],
        options: teams
          .filter((team) => team.tier === Constants.Prestige.findIndex((tier) => tier === prestige))
          .map((team) => ({
            ...team,
            value: team.id,
            label: team.name,
          })),
      })),
    [teams, selectedTierId],
  );

  // isolate the selected team
  const team = React.useMemo(
    () => teams.find((tteam) => tteam.id === selectedTeam?.id),
    [selectedTeam],
  );

  return (
    <section className="flex flex-1 flex-col items-center gap-24 pt-24">
      {!team && (
        <article className="center h-48 w-auto">
          <span className="loading loading-spinner loading-lg" />
        </article>
      )}
      {!!team && <Image src={team.blazon} className="h-48 w-auto" />}
      <form className="w-3/4">
        <fieldset className="stack-y">
          <article>
            <header>
              <p>{t('shared.federation')}</p>
            </header>
            <aside>
              <select
                className="select w-full"
                onChange={(event) => setSelectedFederationId(Number(event.target.value))}
                value={selectedFederationId}
              >
                {federations
                  .filter(
                    (federation) => federation.slug !== Constants.FederationSlug.ESPORTS_WORLD,
                  )
                  .map((federation) => (
                    <option key={federation.id} value={federation.id}>
                      {federation.name}
                    </option>
                  ))}
              </select>
            </aside>
          </article>
          <article>
            <header>
              <p>{t('shared.tierPrestige')}</p>
            </header>
            <aside>
              <select
                className="select w-full"
                onChange={(event) => setSelectedTierId(Number(event.target.value))}
                value={selectedTierId}
              >
                {Constants.Prestige.map((prestige, prestigeId) => (
                  <option key={prestige} value={prestigeId}>
                    {Constants.IdiomaticTier[prestige]}
                  </option>
                ))}
              </select>
            </aside>
          </article>
          <article>
            <header>
              <p>{t('shared.team')}</p>
            </header>
            <aside>
              <TeamSelect
                className="w-full"
                backgroundColor="var(--color-base-200)"
                options={teamSelectorData}
                value={selectedTeam}
                onChange={(option) =>
                  setSelectedTeam(findTeamOptionByValue(teamSelectorData, option.value))
                }
              />
            </aside>
          </article>
        </fieldset>
      </form>
    </section>
  );
}

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const [activeTab, setActiveTab] = React.useState(Tab.GENERAL);
  const [appStatus, setAppStatus] = React.useState<NodeJS.ErrnoException>();
  const [settings, setSettings] = React.useState(Constants.Settings);
  const [homeTeamId, setHomeTeamId] = React.useState<number>();
  const [awayTeamId, setAwayTeamId] = React.useState<number>();
  const [isUserCT, setIsUserCT] = React.useState(false);
  const [mapPool, setMapPool] = React.useState<Awaited<ReturnType<typeof api.mapPool.find>>>([]);
  const navigate = useNavigate();
  const t = useTranslation('windows');

  React.useEffect(() => {
    // detect steam and game paths together
    // which avoid a race-condition
    Promise.all([api.app.detectSteam(), api.app.detectGame(Constants.Settings.general.game)]).then(
      ([steamPath, gamePath]) => {
        const modified = cloneDeep(settings);
        modified.general.steamPath = steamPath;
        modified.general.gamePath = gamePath;
        setSettings(modified);
      },
    );

    // fetch map pool
    api.mapPool
      .find({
        where: {
          gameVersion: {
            slug: Constants.Settings.general.game,
          },
        },
      })
      .then(setMapPool);
  }, []);

  // handle settings updates
  const onSettingsUpdate = (path: string, value: unknown) => {
    const modified = cloneDeep(settings);
    set(modified, path, value);

    // detect game path again
    api.app.detectGame(modified.general.game).then((gamePath) => {
      modified.general.gamePath = gamePath;
      setSettings(modified);
    });

    // fetch map pool again
    api.mapPool
      .find({
        where: {
          gameVersion: {
            slug: modified.general.game,
          },
        },
      })
      .then(setMapPool);
  };

  // validate settings
  React.useEffect(() => {
    // if paths are not explicitly initialized
    // then we won't send a status check yet
    if (settings.general.steamPath === null || settings.general.gamePath === null) {
      return;
    }

    api.app.status(settings).then((status) => setAppStatus(JSON.parse(status || false)));
  }, [settings]);

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
    <main className="frosted flex h-full w-full">
      <FaArrowLeft
        className="absolute top-5 left-5 size-5 cursor-pointer"
        onClick={() => navigate(-1)}
      />
      <TeamSelector initialFederationId={1} initialTierId={4} onChange={setHomeTeamId} />
      <section className="center w-24 gap-4 text-center">
        <p>
          <em>Pick your starting side</em>
        </p>
        <label className="swap swap-flip [&_article]:center [&_article]:gap-4 [&_article_svg]:size-8">
          <input
            type="checkbox"
            checked={isUserCT}
            onChange={(event) => setIsUserCT(event.target.checked)}
          />
          <article className="swap-off">
            <Image src="resources://avatars/t.png" />
            <FaCaretLeft />
          </article>
          <article className="swap-on">
            <Image src="resources://avatars/ct.png" />
            <FaCaretRight />
          </article>
        </label>
      </section>
      <TeamSelector initialFederationId={2} initialTierId={4} onChange={setAwayTeamId} />
      <section className="flex flex-1 flex-col p-4">
        <header role="tablist" className="tabs tabs-box">
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
        <form className="form-ios form-ios-col-2 w-full flex-1">
          {activeTab === Tab.GENERAL && (
            <fieldset>
              <article>
                <header>
                  <p>{t('settings.gameTitle')}</p>
                  {settings.general.game === Constants.Game.CS2 && (
                    <p className="text-warning">{t('settings.gameSubtitleCS2')}</p>
                  )}
                  {settings.general.game !== Constants.Game.CS2 && (
                    <p>{t('settings.gameSubtitle')}</p>
                  )}
                </header>
                <aside>
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
                </aside>
              </article>
              <article>
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
                <aside className="join">
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
                        .dialog(Constants.WindowIdentifier.Landing, {
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
                </aside>
              </article>
              <article>
                <header>
                  <p>{t('settings.gamePathTitle')}</p>
                  <p>{t('settings.gamePathSubtitle')}</p>
                  {!!gamePathError && (
                    <span className="tooltip" data-tip={String(gamePathError)}>
                      <FaExclamationTriangle className="text-error" />
                    </span>
                  )}
                </header>
                <aside className="join">
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
                        .dialog(Constants.WindowIdentifier.Landing, {
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
                </aside>
              </article>
              <article>
                <header>
                  <p>{t('settings.launchOptionsTitle')}</p>
                  <p>{t('settings.launchOptionsSubtitle')}</p>
                </header>
                <aside>
                  <input
                    type="text"
                    className="input join-item bg-base-200 text-sm"
                    value={settings.general.gameLaunchOptions || ''}
                    onChange={(event) =>
                      onSettingsUpdate('general.gameLaunchOptions', event.target.value)
                    }
                  />
                </aside>
              </article>
              <article>
                <header>
                  <p>{t('settings.botChatterTitle')}</p>
                </header>
                <aside>
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
                </aside>
              </article>
              <article>
                <header>
                  <p>{t('settings.botDifficultyTitle')}</p>
                </header>
                <aside>
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
                </aside>
              </article>
            </fieldset>
          )}
          {activeTab === Tab.MATCH_RULES && (
            <fieldset>
              <article>
                <header>
                  <p>{t('shared.bombTimer')}</p>
                </header>
                <aside>
                  <select
                    className="select"
                    onChange={(event) =>
                      onSettingsUpdate('matchRules.bombTimer', event.target.value)
                    }
                    value={settings.matchRules.bombTimer}
                  >
                    {[35, 40, 45].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </aside>
              </article>
              <article>
                <header>
                  <p>{t('shared.maxRoundsTitle')}</p>
                </header>
                <aside>
                  <select
                    className="select"
                    onChange={(event) =>
                      onSettingsUpdate('matchRules.maxRounds', event.target.value)
                    }
                    value={settings.matchRules.maxRounds}
                  >
                    {[6, 12, 24, 30].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </aside>
              </article>
              <article>
                <header>
                  <p>{t('shared.startMoneyTitle')}</p>
                </header>
                <aside>
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
                </aside>
              </article>
              <article>
                <header>
                  <p>{t('shared.freezeTimeTitle')}</p>
                </header>
                <aside>
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
                </aside>
              </article>
              <article>
                <header>
                  <p>{t('shared.mapOverrideTitle')}</p>
                </header>
                <aside>
                  <select
                    className="select"
                    onChange={(event) =>
                      onSettingsUpdate('matchRules.mapOverride', event.target.value)
                    }
                    value={
                      isNull(settings.matchRules.mapOverride)
                        ? mapPool[0].gameMap.name
                        : settings.matchRules.mapOverride
                    }
                  >
                    {mapPool.map((map) => (
                      <option key={map.gameMap.name} value={map.gameMap.name}>
                        {map.gameMap.name}
                      </option>
                    ))}
                  </select>
                </aside>
              </article>
              <article>
                <header>
                  <p>{t('shared.overtimeTitle')}</p>
                  <p>{t('shared.overtimeSubtitle')}</p>
                </header>
                <aside>
                  <input
                    type="checkbox"
                    className="toggle"
                    onChange={(event) =>
                      onSettingsUpdate('matchRules.overtime', event.target.checked)
                    }
                    checked={settings.matchRules.overtime}
                    value={String(settings.matchRules.overtime)}
                  />
                </aside>
              </article>
            </fieldset>
          )}
        </form>
        <button
          className="btn btn-xl btn-block btn-primary"
          onClick={() =>
            api.play.exhibition(
              settings,
              [homeTeamId, awayTeamId],
              isUserCT ? awayTeamId : homeTeamId,
            )
          }
        >
          {t('main.dashboard.play')}
        </button>
      </section>
    </main>
  );
}
