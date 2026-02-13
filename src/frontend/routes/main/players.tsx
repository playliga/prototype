/**
 * Search the player database.
 *
 * @module
 */
import React from 'react';
import { random } from 'lodash';
import { differenceInYears } from 'date-fns';
import { Constants, Eagers, Util } from '@liga/shared';
import { cx } from '@liga/frontend/lib';
import { AppStateContext } from '@liga/frontend/redux';
import { useTranslation } from '@liga/frontend/hooks';
import { FaSortAmountDown, FaSortAmountDownAlt } from 'react-icons/fa';
import { Pagination } from '@liga/frontend/components';
import {
  CountrySelect,
  findCountryOptionByValue,
  findTeamOptionByValue,
  TeamSelect,
} from '@liga/frontend/components/select';

/** @constant */
const NUM_COLUMNS = 7;

/** @constant */
const PAGE_SIZE = 100;

/**
 * Builds player query from provided filters.
 *
 * @param federationId    Limit search to a specific federation.
 * @param countryId       Limit search to a specific country.
 * @param teamId          Limit search to a specific team.
 * @param tier            Limit search to a specific tier.
 * @param transferListed  Whether to search for only transfer listed players.
 * @param orderBy         Sorting direction.
 * @param playerName      Filter by player name.
 * @param prestige        Filter player's prestige level.
 * @param weapon          Filter by player weapon preference.
 * @function
 */
function buildPlayerQuery(
  federationId?: number,
  countryId?: number,
  teamId?: number,
  tier?: number,
  transferListed?: boolean,
  orderBy?: ExtractBaseType<Parameters<typeof api.players.all>[number]['orderBy']>,
  playerName?: string,
  prestige?: number,
  weapon?: string,
): Parameters<typeof api.players.all>[number] {
  return {
    ...(orderBy ? { orderBy } : {}),
    where: {
      ...(transferListed ? { transferListed } : {}),
      ...(prestige ? { prestige } : {}),
      ...(weapon ? { weapon } : {}),
      ...(playerName !== ''
        ? {
            name: {
              contains: playerName,
            },
          }
        : {}),
      country: {
        ...(countryId ? { id: countryId } : {}),
        ...(federationId
          ? {
              continent: {
                federationId,
              },
            }
          : {}),
      },
      team: {
        ...(Number.isInteger(tier) ? { tier } : {}),
        ...(teamId ? { id: teamId } : {}),
      },
    },
  };
}

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const t = useTranslation('windows');
  const { state } = React.useContext(AppStateContext);
  const [numPlayers, setNumPlayers] = React.useState(0);
  const [numPage, setNumPage] = React.useState(1);
  const [federations, setFederations] = React.useState<
    Awaited<ReturnType<typeof api.federations.all>>
  >([]);
  const [teams, setTeams] = React.useState<Awaited<ReturnType<typeof api.teams.all>>>([]);
  const [players, setPlayers] = React.useState<
    Awaited<ReturnType<typeof api.players.all<typeof Eagers.player>>>
  >([]);
  const [working, setWorking] = React.useState(false);
  const [selectedFederationId, setSelectedFederationId] = React.useState<number>();
  const [selectedCountry, setSelectedCountry] =
    React.useState<ReturnType<typeof findCountryOptionByValue>>();
  const [selectedPlayerName, setSelectedPlayerName] = React.useState('');
  const [selectedPlayerPrestige, setSelectedPlayerPrestige] = React.useState<number>();
  const [selectedPlayerWeapon, setSelectedPlayerWeapon] =
    React.useState<Constants.WeaponTemplate>();
  const [selectedTierId, setSelectedTierId] = React.useState<number>();
  const [selectedTransferStatus, setSelectedTransferStatus] = React.useState<boolean>();
  const [selectedTeam, setSelectedTeam] =
    React.useState<ReturnType<typeof findTeamOptionByValue>>();
  const [selectedPlayerOrderBy, setSelectedPlayerOrderBy] = React.useState<
    ExtractBaseType<Parameters<typeof api.players.all>[number]['orderBy']>
  >({});

  // build query information
  const totalPages = React.useMemo(() => Math.ceil(numPlayers / PAGE_SIZE), [numPlayers]);
  const teamQuery = React.useMemo(
    () => Util.buildTeamQuery(selectedFederationId, selectedCountry?.id, selectedTierId),
    [selectedFederationId, selectedCountry, selectedTierId],
  );
  const playerQuery = React.useMemo(
    () =>
      buildPlayerQuery(
        selectedFederationId,
        selectedCountry?.id,
        selectedTeam?.id,
        selectedTierId,
        selectedTransferStatus,
        selectedPlayerOrderBy,
        selectedPlayerName,
        selectedPlayerPrestige,
        selectedPlayerWeapon,
      ),
    [
      selectedFederationId,
      selectedCountry,
      selectedTeam,
      selectedTierId,
      selectedTransferStatus,
      selectedPlayerOrderBy,
      selectedPlayerName,
      selectedPlayerPrestige,
      selectedPlayerWeapon,
    ],
  );

  // resets the page to a random negative number
  // in order to trigger a new player data fetch
  const triggerPlayerFetch = () => setNumPage(-random(255));

  // initial data fetch
  React.useEffect(() => {
    api.federations.all().then(setFederations);
    api.teams.all().then(setTeams);
    api.players.count(playerQuery.where).then(setNumPlayers);
  }, []);

  // reset country selection when federation changes
  React.useEffect(() => {
    setSelectedCountry(null);
  }, [selectedFederationId]);

  // reset team selection when any of these filters change
  React.useEffect(() => {
    setSelectedTeam(null);
  }, [selectedFederationId, selectedCountry, selectedTierId]);

  // reset page when changing sorting direction
  React.useEffect(triggerPlayerFetch, [selectedPlayerOrderBy]);

  // apply team filters
  React.useEffect(() => {
    api.teams.all(teamQuery).then(setTeams);
  }, [selectedFederationId, selectedCountry]);

  // apply player filters
  React.useEffect(() => {
    setWorking(true);
    api.players.count(playerQuery.where).then(setNumPlayers);
    api.players
      .all({
        ...playerQuery,
        take: PAGE_SIZE,
        skip: PAGE_SIZE * ((numPage <= 0 ? 1 : numPage) - 1),
        include: Eagers.player.include,
      })
      .then((result) => Promise.resolve(setPlayers(result)))
      .then(() => setWorking(false));
  }, [numPage]);

  // massage country data to country selector data structure
  const countrySelectorData = React.useMemo(
    () =>
      state.continents
        .filter((continent) =>
          selectedFederationId ? continent.federationId === selectedFederationId : true,
        )
        .map((continent) => ({
          label: continent.name,
          options: continent.countries.map((country) => ({
            ...country,
            value: country.id,
            label: country.name,
          })),
        })),
    [state.continents, selectedFederationId],
  );

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

  // quick hack to bypass row height behavior where they
  // try to fill in the remaining height of the table
  const filler = React.useMemo(
    () =>
      players.length < PAGE_SIZE
        ? [...Array(PAGE_SIZE - players.length - 1)].map((_, idx) => idx)
        : [],
    [players],
  );

  return (
    <div className="dashboard">
      <main>
        <form className="form-ios form-ios-col-2">
          <fieldset>
            <legend className="border-t-0!">{t('shared.filters')}</legend>
            <section>
              <header>
                <p>{t('shared.federation')}</p>
              </header>
              <article>
                <select
                  className="select"
                  onChange={(event) => setSelectedFederationId(Number(event.target.value))}
                  value={selectedFederationId}
                >
                  <option value="">{t('shared.any')}</option>
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
              </article>
            </section>
            <section>
              <header>
                <p>{t('shared.country')}</p>
              </header>
              <article>
                <CountrySelect
                  className="w-full"
                  backgroundColor="var(--color-base-200)"
                  options={countrySelectorData}
                  value={selectedCountry}
                  onChange={(option) =>
                    setSelectedCountry(findCountryOptionByValue(countrySelectorData, option.value))
                  }
                />
              </article>
            </section>
            <section>
              <header>
                <p>{t('shared.tierPrestige')}</p>
              </header>
              <article>
                <select
                  className="select"
                  onChange={(event) =>
                    setSelectedTierId(
                      event.target.value === ''
                        ? ('' as unknown as number)
                        : Number(event.target.value),
                    )
                  }
                  value={selectedTierId}
                >
                  <option value="">Any</option>
                  {Constants.Prestige.map((prestige, prestigeId) => (
                    <option key={prestige} value={prestigeId}>
                      {Constants.IdiomaticTier[prestige]}
                    </option>
                  ))}
                </select>
              </article>
            </section>
            <section>
              <header>
                <p>Potential</p>
              </header>
              <article>
                <select
                  className="select"
                  onChange={(event) =>
                    setSelectedPlayerPrestige(
                      event.target.value === ''
                        ? ('' as unknown as number)
                        : Number(event.target.value),
                    )
                  }
                  value={selectedPlayerPrestige}
                >
                  <option value="">Any</option>
                  {Constants.Prestige.map((prestige, prestigeId) => (
                    <option key={prestige + '__skill'} value={prestigeId}>
                      {[...Array(prestigeId + 1)].map(() => '⭐')}
                    </option>
                  ))}
                </select>
              </article>
            </section>
            <section>
              <header>
                <p>{t('shared.weaponPreference')}</p>
              </header>
              <article>
                <select
                  className="select"
                  value={selectedPlayerWeapon}
                  onChange={(event) =>
                    setSelectedPlayerWeapon(
                      event.target.value === ''
                        ? ('' as Constants.WeaponTemplate)
                        : (event.target.value as Constants.WeaponTemplate),
                    )
                  }
                >
                  <option value="">Any</option>
                  {Object.keys(Constants.WeaponTemplate).map(
                    (template: keyof typeof Constants.WeaponTemplate) => (
                      <option key={template} value={Constants.WeaponTemplate[template]}>
                        {Constants.WeaponTemplate[template]}
                      </option>
                    ),
                  )}
                </select>
              </article>
            </section>
            <section>
              <header>
                <p>{t('shared.team')}</p>
              </header>
              <article>
                <TeamSelect
                  className="w-full"
                  backgroundColor="var(--color-base-200)"
                  options={teamSelectorData}
                  value={selectedTeam}
                  onChange={(option) =>
                    setSelectedTeam(findTeamOptionByValue(teamSelectorData, option.value))
                  }
                />
              </article>
            </section>
            <section>
              <header>
                <p>{t('main.players.player')}</p>
              </header>
              <article>
                <input
                  type="text"
                  placeholder={t('main.players.playerNameFilter')}
                  className="input"
                  value={selectedPlayerName}
                  onChange={(event) => setSelectedPlayerName(event.target.value)}
                />
              </article>
            </section>
            <section>
              <header>
                <p>{t('main.players.transferStatus')}</p>
              </header>
              <article>
                <select
                  className="select"
                  onChange={(event) => setSelectedTransferStatus(Boolean(event.target.value))}
                  value={String(selectedTransferStatus)}
                >
                  <option value="">{t('shared.any')}</option>
                  <option value="true">{t('shared.transferListed')}</option>
                </select>
              </article>
            </section>
          </fieldset>
          <fieldset>
            <section className="join">
              <button
                type="button"
                className="btn btn-primary join-item"
                onClick={triggerPlayerFetch}
              >
                {t('shared.apply')}
              </button>
              <button
                type="button"
                className="btn join-item"
                onClick={() => {
                  setSelectedCountry(null);
                  setSelectedFederationId('' as unknown as number);
                  setSelectedPlayerName('');
                  setSelectedPlayerPrestige('' as unknown as number);
                  setSelectedPlayerWeapon('' as Constants.WeaponTemplate);
                  setSelectedTierId('' as unknown as number);
                  setSelectedTransferStatus(null);
                  setSelectedTeam(null);
                }}
              >
                {t('main.players.reset')}
              </button>
            </section>
          </fieldset>
        </form>
        <section>
          <table className="table-pin-rows table-xs table h-full table-fixed">
            <thead>
              <tr>
                <th>{t('shared.name')}</th>
                <th>{t('shared.team')}</th>
                <th className="text-center">{t('shared.age')}</th>
                <th
                  className="hover:bg-base-300 cursor-pointer"
                  onClick={() =>
                    setSelectedPlayerOrderBy(
                      Util.parseSortingDirection('team.tier', selectedPlayerOrderBy?.team?.tier),
                    )
                  }
                >
                  <header className="flex items-center justify-center gap-2">
                    {t('main.players.tier')}
                    <span className={cx(selectedPlayerOrderBy?.team?.tier && 'text-primary')}>
                      {selectedPlayerOrderBy?.team?.tier === 'desc' ? (
                        <FaSortAmountDown />
                      ) : (
                        <FaSortAmountDownAlt />
                      )}
                    </span>
                  </header>
                </th>
                <th
                  className="hover:bg-base-300 cursor-pointer"
                  onClick={() =>
                    setSelectedPlayerOrderBy(
                      Util.parseSortingDirection('cost', selectedPlayerOrderBy?.cost),
                    )
                  }
                >
                  <header className="flex items-center justify-center gap-2">
                    {t('shared.cost')}
                    <span className={cx(selectedPlayerOrderBy?.cost && 'text-primary')}>
                      {selectedPlayerOrderBy?.cost === 'desc' ? (
                        <FaSortAmountDown />
                      ) : (
                        <FaSortAmountDownAlt />
                      )}
                    </span>
                  </header>
                </th>
                <th
                  className="hover:bg-base-300 cursor-pointer"
                  onClick={() =>
                    setSelectedPlayerOrderBy(
                      Util.parseSortingDirection('wages', selectedPlayerOrderBy?.wages),
                    )
                  }
                >
                  <header className="flex items-center justify-center gap-2">
                    {t('main.players.wages')}
                    <span className={cx(selectedPlayerOrderBy?.wages && 'text-primary')}>
                      {selectedPlayerOrderBy?.wages === 'desc' ? (
                        <FaSortAmountDown />
                      ) : (
                        <FaSortAmountDownAlt />
                      )}
                    </span>
                  </header>
                </th>
                <th className="text-center">{t('shared.transferListed')}</th>
              </tr>
            </thead>
            <tbody>
              {!!working && (
                <tr>
                  <td colSpan={NUM_COLUMNS} className="text-center">
                    <span className="loading loading-bars loading-lg" />
                  </td>
                </tr>
              )}
              {!working &&
                players.map((player) => (
                  <tr
                    key={player.name}
                    className="hover:bg-base-content/10 cursor-pointer"
                    onClick={() =>
                      api.window.send<ModalRequest>(Constants.WindowIdentifier.Modal, {
                        target: '/transfer',
                        payload: player.id,
                      })
                    }
                  >
                    <td>
                      <span className={cx('fp', 'mr-2', player.country.code.toLowerCase())} />
                      <span>{player.name}</span>
                    </td>
                    <td>
                      {!!player.team && (
                        <>
                          <img src={player.team.blazon} className="mr-2 inline-block size-4" />
                          <span>{player.team.name}</span>
                        </>
                      )}
                    </td>
                    <td className="text-center">
                      {differenceInYears(state.profile.date, player.dob)}
                    </td>
                    <td className="text-center">
                      {!!player.team &&
                        Constants.IdiomaticTier[Constants.Prestige[player.team.tier]]}
                    </td>
                    <td className="text-center">{Util.formatCurrency(player.cost)}</td>
                    <td className="text-center">{Util.formatCurrency(player.wages)}/wk</td>
                    <td className="text-center">{player.transferListed ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              {!working &&
                !!filler.length &&
                filler.map((_, idx) => (
                  <tr key={`${idx}__filler`}>
                    <td colSpan={NUM_COLUMNS}>&nbsp;</td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan={NUM_COLUMNS - 1} className="p-0 font-mono">
                  <Pagination
                    numPage={numPage}
                    totalPages={totalPages}
                    onChange={setNumPage}
                    onClick={setNumPage}
                  />
                </th>
                <th className="text-right font-mono">{numPlayers} Results</th>
              </tr>
            </tfoot>
          </table>
        </section>
      </main>
    </div>
  );
}
