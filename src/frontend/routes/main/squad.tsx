/**
 * Hub for managing the team squad.
 *
 * @module
 */
import React from 'react';
import { groupBy } from 'lodash';
import { differenceInDays } from 'date-fns';
import { Constants, Eagers, Util } from '@liga/shared';
import { cx } from '@liga/frontend/lib';
import { AppStateContext } from '@liga/frontend/redux';
import { profileUpdate, workingUpdate } from '@liga/frontend/redux/actions';
import { useTranslation } from '@liga/frontend/hooks';
import { Image, PlayerCard } from '@liga/frontend/components';
import {
  FaBan,
  FaBolt,
  FaCheck,
  FaShoppingBag,
  FaStopwatch,
  FaTrash,
  FaUsers,
} from 'react-icons/fa';

/** @enum */
enum TabIdentifier {
  SQUAD,
  TRAINING,
}

/** @interface */
interface BonusSummaryLabelProps {
  data?: Awaited<ReturnType<typeof api.bonus.all>>[number];
}

/** @constant */
const TRAINING_STATUS_INTERVAL = 1500;

/**
 * Training sequence status messages.
 *
 * @constant
 */
const trainingStatuses = [
  'Booting up server...',
  'Placing bots in server...',
  'Running through drills...',
  'Applying training bonuses...',
  'Training completed for the week.',
];

/**
 * @param teamId The team id to fetch transfers for.
 * @function
 */
function fetchTransfers(teamId: number) {
  return api.transfers.all({
    where: {
      status: Constants.TransferStatus.TEAM_PENDING,
      to: {
        id: teamId,
      },
    },
    include: Eagers.transfer.include,
  });
}

/**
 * @param props The root props.
 * @component
 * @function
 */
function BonusSummaryLabel(props: BonusSummaryLabelProps) {
  if (!props.data) {
    return null;
  }

  const stats = React.useMemo(() => JSON.parse(props.data.stats), [props.data]);

  return (
    <p className="italic">
      {Object.keys(stats)
        .map((stat) => `${stats[stat]}x ${stat.replace(/(delay|time)/i, 'speed')}`)
        .join(', ')}
    </p>
  );
}

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const t = useTranslation('windows');
  const { dispatch, state } = React.useContext(AppStateContext);
  const [activeTab, setActiveTab] = React.useState<TabIdentifier>(TabIdentifier.SQUAD);
  const [settings, setSettings] = React.useState(Constants.Settings);
  const [squad, setSquad] = React.useState<
    Awaited<ReturnType<typeof api.squad.all<typeof Eagers.player>>>
  >([]);
  const [transfers, setTransfers] = React.useState<
    Awaited<ReturnType<typeof api.transfers.all<typeof Eagers.transfer>>>
  >([]);
  const [trainingBonuses, setTrainingBonuses] = React.useState<
    Awaited<ReturnType<typeof api.bonus.all>>
  >([]);
  const [trainingFacilityId, setTrainingFacilityId] = React.useState<number>();
  const [trainingMapId, setTrainingMapId] = React.useState<number>();
  const [trainingServerId, setTrainingServerId] = React.useState<number>();
  const [trainingStatus, setTrainingStatus] = React.useState(null);

  // fetch data on first load
  React.useEffect(() => {
    api.bonus.all().then(setTrainingBonuses);
    api.squad.all().then(setSquad);
    api.ipc.on(Constants.IPCRoute.TRANSFER_UPDATE, () =>
      fetchTransfers(state.profile.team.id).then(setTransfers),
    );
    fetchTransfers(state.profile.team.id).then(setTransfers);
  }, []);

  // load settings
  React.useEffect(() => {
    if (!state.profile) {
      return;
    }

    setSettings(Util.loadSettings(state.profile.settings));
  }, [state.profile]);

  // fetch profile and squad data again
  // once training is completed
  React.useEffect(() => {
    if (!/completed/gi.test(trainingStatus)) {
      return;
    }

    api.profiles.current().then((profile) => dispatch(profileUpdate(profile)));
    api.squad.all().then(setSquad);
  }, [trainingStatus]);

  const starters = React.useMemo(() => squad.filter((player) => player.starter), [squad]);
  const transfersByPlayer = React.useMemo(() => groupBy(transfers, 'playerId'), [transfers]);
  const transferListed = React.useMemo(
    () => squad.filter((player) => player.transferListed),
    [squad],
  );
  const trainingMaps = React.useMemo(
    () => trainingBonuses.filter((bonus) => bonus.type === Constants.BonusType.MAP),
    [trainingBonuses],
  );
  const trainingServers = React.useMemo(
    () => trainingBonuses.filter((bonus) => bonus.type === Constants.BonusType.SERVER),
    [trainingBonuses],
  );
  const trainingFacilities = React.useMemo(
    () => trainingBonuses.filter((bonus) => bonus.type === Constants.BonusType.FACILITY),
    [trainingBonuses],
  );
  const trainingServersBuy = React.useMemo(
    () => trainingServers.filter((server) => server.cost && !server.profileId),
    [trainingServers],
  );
  const trainingFacilitiesBuy = React.useMemo(
    () => trainingFacilities.filter((facility) => facility.cost && !facility.profileId),
    [trainingFacilities],
  );
  const trainingAllowed = React.useMemo(
    () =>
      !state.profile.trainedAt ||
      differenceInDays(state.profile.date, state.profile.trainedAt) >
        Constants.Application.TRAINING_FREQUENCY,
    [state.profile],
  );

  React.useEffect(() => {
    if (trainingMaps.length > 0 && !trainingMapId) {
      const active = trainingMaps.find((map) => map.active);
      setTrainingMapId(active?.id ?? trainingMaps[0].id);
    }
  }, [trainingMaps]);

  React.useEffect(() => {
    if (trainingServers.length > 0 && !trainingServerId) {
      const active = trainingServers.find((server) => server.active);
      setTrainingServerId(active?.id ?? trainingServers[0].id);
    }
  }, [trainingServers]);

  React.useEffect(() => {
    if (!trainingFacilities.length) {
      return;
    }

    const trainingFacilitiesOwned = trainingFacilities.filter((facility) => facility.profileId);

    if (trainingFacilitiesOwned.length && !trainingFacilityId) {
      const active = trainingFacilitiesOwned.find((facility) => facility.active);
      setTrainingFacilityId(active?.id ?? trainingFacilitiesOwned[0].id);
    }
  }, [trainingFacilities]);

  return (
    <div className="dashboard">
      <header>
        <button
          className={cx(activeTab === TabIdentifier.SQUAD && 'btn-active!')}
          onClick={() => setActiveTab(TabIdentifier.SQUAD)}
        >
          <FaUsers />
          {t('shared.squad')}
        </button>
        <button
          className={cx(activeTab === TabIdentifier.TRAINING && 'btn-active!')}
          onClick={() => setActiveTab(TabIdentifier.TRAINING)}
        >
          <FaStopwatch />
          {t('main.squad.training')}
        </button>
      </header>
      <main>
        {activeTab === TabIdentifier.SQUAD && (
          <section className="divide-base-content/10 divide-y">
            <article className="stack-y gap-0!">
              <header className="prose border-t-0!">
                <h2>{t('main.squad.starters')}</h2>
              </header>
              {!!starters.length && (
                <footer>
                  <table className="table table-fixed">
                    <thead>
                      <tr>
                        <th className="w-3/5" title={t('main.squad.playerName')}>
                          {t('shared.name')}
                        </th>
                        <th className="w-1/5" title={t('shared.weaponPreference')}>
                          {t('main.squad.weapon')}
                        </th>
                        <th className="text-center">{t('main.squad.remove')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {starters.map((player) => (
                        <tr key={player.id + '__starter'}>
                          <td className="truncate" title={player.name}>
                            {player.name}
                          </td>
                          <td title={player.weapon || Constants.WeaponTemplate.AUTO}>
                            {player.weapon || Constants.WeaponTemplate.AUTO}
                          </td>
                          <td className="text-center">
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() =>
                                api.squad
                                  .update({
                                    where: { id: player.id },
                                    data: {
                                      starter: false,
                                    },
                                  })
                                  .then(setSquad)
                              }
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </footer>
              )}
              {!starters.length && (
                <footer className="center h-32">
                  <p>{t('main.squad.noStarters')}</p>
                </footer>
              )}
            </article>
            <article className="stack-y gap-0! border-t-0!">
              <header className="prose">
                <h2>{t('shared.transferListed')}</h2>
              </header>
              {!!transferListed.length && (
                <footer>
                  <table className="table table-fixed">
                    <thead>
                      <tr>
                        <th className="w-3/5" title={t('main.squad.playerName')}>
                          {t('shared.name')}
                        </th>
                        <th className="w-1/5 text-center" />
                        <th className="text-center">{t('main.squad.remove')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transferListed.map((player) => (
                        <tr key={player.id + '__transfer-listed'}>
                          <td className="truncate" title={player.name}>
                            {player.name}
                          </td>
                          <td className="text-muted text-center italic">
                            {!!Object.keys(transfersByPlayer).includes(player.id.toString()) &&
                              `${transfersByPlayer[player.id].length} ${t('main.squad.offers')}`}
                          </td>
                          <td className="text-center">
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() =>
                                api.squad
                                  .update({
                                    where: { id: player.id },
                                    data: {
                                      transferListed: false,
                                    },
                                  })
                                  .then(setSquad)
                              }
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </footer>
              )}
              {!transferListed.length && (
                <footer className="center h-32">
                  <p>{t('main.squad.noTransferListed')}</p>
                </footer>
              )}
            </article>
            <article className="stack-y gap-0! border-t-0!">
              <header className="prose">
                <h2>{t('main.squad.incomingOffers')}</h2>
              </header>
              {!!transfers.length && (
                <footer>
                  <table className="table table-fixed">
                    <thead>
                      <tr>
                        <th className="w-1/4">{t('main.squad.from')}</th>
                        <th className="w-1/4">{t('main.squad.for')}</th>
                        <th className="w-1/4 text-center">{t('shared.amount')}</th>
                        <th className="w-1/4 text-center" title={t('main.squad.acceptOrReject')} />
                      </tr>
                    </thead>
                    <tbody>
                      {transfers.map((transfer) => (
                        <tr key={transfer.id + '__transfer'}>
                          <td title={transfer.from.name} className="truncate">
                            {transfer.from.name}
                          </td>
                          <td title={transfer.target.name} className="truncate">
                            {transfer.target.name}
                          </td>
                          <td className="text-center">
                            {Util.formatCurrency(transfer.offers[0].cost)}
                          </td>
                          <td className="join-vertical text-center">
                            <button
                              title={t('main.squad.acceptOffer')}
                              className="btn btn-success join-item btn-sm"
                              onClick={() =>
                                api.transfers
                                  .accept(transfer.id)
                                  .then(() => fetchTransfers(state.profile.team.id))
                                  .then(setTransfers)
                              }
                            >
                              <FaCheck />
                            </button>
                            <button
                              title={t('main.squad.rejectOffer')}
                              className="btn btn-error join-item btn-sm"
                              onClick={() =>
                                api.transfers
                                  .reject(transfer.id)
                                  .then(() => fetchTransfers(state.profile.team.id))
                                  .then(setTransfers)
                              }
                            >
                              <FaBan />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </footer>
              )}
              {!transfers.length && (
                <footer className="center h-32">
                  <p>{t('main.squad.noTransfers')}</p>
                </footer>
              )}
            </article>
          </section>
        )}
        {activeTab === TabIdentifier.TRAINING && (
          <section className="divide-base-content/10 divide-y">
            <article className="card image-full w-full rounded-none before:rounded-none!">
              <figure>
                <Image
                  className="h-full w-full"
                  src={Util.convertMapPool(
                    trainingMaps.find((map) => map.id === trainingMapId)?.name || 'de_dust2',
                    settings.general.game,
                    true,
                  )}
                />
              </figure>
              <aside className="center card-body relative">
                <button
                  className="btn btn-primary"
                  disabled={!trainingAllowed || !!trainingStatus}
                  onClick={async () => {
                    dispatch(workingUpdate(true));

                    for (const status of trainingStatuses) {
                      setTrainingStatus(status);

                      if (/drills/gi.test(status)) {
                        await api.profiles.train([
                          trainingServerId,
                          trainingMapId,
                          trainingFacilityId,
                        ]);
                        continue;
                      }

                      await Util.sleep(TRAINING_STATUS_INTERVAL);
                    }

                    dispatch(workingUpdate(false));
                  }}
                >
                  <FaBolt />
                  {t('main.squad.simTraining')}
                </button>
                <p className="absolute bottom-4 font-mono">
                  {!!trainingAllowed && trainingStatus}
                  {!trainingAllowed && trainingStatuses.slice(-1)[0]}
                </p>
              </aside>
            </article>
            <form className="form-ios">
              <fieldset>
                <legend>{t('shared.overview')}</legend>
                <section>
                  <header>
                    <p>{t('main.squad.server')}</p>
                    <BonusSummaryLabel
                      data={trainingServers.find((server) => server.id === trainingServerId)}
                    />
                  </header>
                  <article>
                    <select
                      className="select"
                      disabled={!trainingAllowed || !!trainingStatus}
                      onChange={(event) => setTrainingServerId(Number(event.target.value))}
                      value={trainingServerId}
                    >
                      {trainingServers
                        .filter((server) => server.profileId)
                        .map((server) => (
                          <option key={server.id} value={server.id}>
                            {server.name}
                          </option>
                        ))}
                    </select>
                  </article>
                </section>
                <section>
                  <header>
                    <p>{t('main.squad.map')}</p>
                    <BonusSummaryLabel
                      data={trainingMaps.find((map) => map.id === trainingMapId)}
                    />
                  </header>
                  <article>
                    <select
                      className="select"
                      disabled={!trainingAllowed || !!trainingStatus}
                      onChange={(event) => setTrainingMapId(Number(event.target.value))}
                      value={trainingMapId}
                    >
                      {trainingMaps.map((map) => (
                        <option key={map.id} value={map.id}>
                          {map.name}
                        </option>
                      ))}
                    </select>
                  </article>
                </section>
                <section>
                  <header>
                    <p>{t('main.squad.facility')}</p>
                    <BonusSummaryLabel
                      data={trainingFacilities.find(
                        (facility) => facility.id === trainingFacilityId,
                      )}
                    />
                  </header>
                  <article>
                    <select
                      className="select"
                      disabled={
                        !trainingAllowed ||
                        !!trainingStatus ||
                        !trainingFacilities.filter((facility) => facility.profileId).length
                      }
                      onChange={(event) => setTrainingFacilityId(Number(event.target.value))}
                      value={trainingFacilityId}
                    >
                      {!trainingFacilities.filter((facility) => facility.profileId).length && (
                        <option value="">None</option>
                      )}
                      {trainingFacilities
                        .filter((facility) => facility.profileId)
                        .map((facility) => (
                          <option key={facility.id} value={facility.id}>
                            {facility.name}
                          </option>
                        ))}
                    </select>
                  </article>
                </section>
              </fieldset>
            </form>
            <article className="stack-y gap-0! border-t-0!">
              <header className="prose">
                <h2>{t('main.squad.servers')}</h2>
              </header>
              <footer>
                <table className="table table-fixed">
                  <thead>
                    <tr>
                      <th title={t('main.squad.serverName')} className="w-3/5">
                        {t('shared.name')}
                      </th>
                      <th className="w-1/5 text-center">{t('shared.cost')}</th>
                      <th className="w-1/5 text-center">{t('main.squad.purchase')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainingServersBuy.map((server) => (
                      <tr key={server.id + '__server'}>
                        <td title={server.name}>
                          <p>{server.name}</p>
                          <BonusSummaryLabel data={server} />
                        </td>
                        <td className="text-center">{Util.formatCurrency(server.cost)}</td>
                        <td
                          className="text-center"
                          title={
                            state.profile &&
                            (state.profile.team.earnings || 0) < server.cost &&
                            t('main.squad.winMore')
                          }
                        >
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={
                              state.profile && (state.profile.team.earnings || 0) < server.cost
                            }
                            onClick={() =>
                              api.bonus.buy(server.id).then(api.bonus.all).then(setTrainingBonuses)
                            }
                          >
                            <FaShoppingBag />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </footer>
            </article>
            <article className="stack-y gap-0! border-t-0!">
              <header className="prose">
                <h2>{t('main.squad.facilities')}</h2>
              </header>
              <footer>
                <table className="table table-fixed">
                  <thead>
                    <tr>
                      <th title="Server Name" className="w-3/5">
                        {t('shared.name')}
                      </th>
                      <th className="w-1/5 text-center">{t('shared.cost')}</th>
                      <th className="w-1/5 text-center">{t('main.squad.purchase')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainingFacilitiesBuy.map((facility) => (
                      <tr key={facility.id + '__facility'}>
                        <td title={facility.name}>
                          <p>{facility.name}</p>
                          <BonusSummaryLabel data={facility} />
                        </td>
                        <td className="text-center">{Util.formatCurrency(facility.cost)}</td>
                        <td
                          className="text-center"
                          title={
                            state.profile && (state.profile.team.earnings || 0) < facility.cost
                              ? t('main.squad.winMore')
                              : ''
                          }
                        >
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={
                              state.profile && (state.profile.team.earnings || 0) < facility.cost
                            }
                            onClick={() =>
                              api.bonus
                                .buy(facility.id)
                                .then(api.bonus.all)
                                .then(setTrainingBonuses)
                            }
                          >
                            <FaShoppingBag />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </footer>
            </article>
          </section>
        )}
        <section className="grid auto-rows-min grid-cols-2 gap-5 p-5 xl:grid-cols-3">
          {squad
            .filter((player) => player.id !== state.profile.player.id)
            .map((player) => (
              <PlayerCard
                key={player.id + '__squad'}
                game={settings.general.game}
                player={player}
                onClickStarter={
                  (starters.length < Constants.Application.SQUAD_MIN_LENGTH - 1 ||
                    player.starter) &&
                  (() => {
                    api.squad
                      .update({
                        where: { id: player.id },
                        data: {
                          starter: !player.starter,
                        },
                      })
                      .then(setSquad);
                  })
                }
                onClickTransferListed={() => {
                  api.squad
                    .update({
                      where: { id: player.id },
                      data: {
                        transferListed: !player.transferListed,
                      },
                    })
                    .then(setSquad);
                }}
                onClickViewOffers={() =>
                  api.window.send<ModalRequest>(Constants.WindowIdentifier.Modal, {
                    target: '/transfer',
                    payload: player.id,
                  })
                }
                onChangeWeapon={(weapon) => {
                  api.squad
                    .update({
                      where: { id: player.id },
                      data: { weapon },
                    })
                    .then(setSquad);
                }}
              />
            ))}
        </section>
      </main>
    </div>
  );
}
