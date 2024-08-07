/**
 * Hub for managing the team squad.
 *
 * @module
 */
import React from 'react';
import cx from 'classnames';
import { groupBy } from 'lodash';
import { differenceInDays } from 'date-fns';
import { Constants, Eagers, Util } from '@liga/shared';
import { AppStateContext } from '@liga/frontend/redux';
import { profileUpdate } from '@liga/frontend/redux/actions';
import { Image, PlayerCard } from '@liga/frontend/components';
import {
  FaBan,
  FaBolt,
  FaCheck,
  FaCompress,
  FaExpand,
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
  'Training completed.',
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
        .map((stat) => `${stats[stat]}x ${stat}`)
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
  const { dispatch, state } = React.useContext(AppStateContext);
  const [activeTab, setActiveTab] = React.useState<TabIdentifier>(TabIdentifier.SQUAD);
  const [collapsed, setCollapsed] = React.useState(false);
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
  const [trainingMapId, setTrainingMapId] = React.useState<number>(
    Number(localStorage.getItem('trainingMapId')),
  );
  const [trainingServerId, setTrainingServerId] = React.useState<number>(
    Number(localStorage.getItem('trainingServerId')),
  );
  const [trainingStatus, setTrainingStatus] = React.useState(null);

  // fetch data on first load
  React.useEffect(() => {
    api.bonus.all().then(setTrainingBonuses);
    api.squad.all().then(setSquad);
    fetchTransfers(state.profile.team.id).then(setTransfers);
  }, []);

  // load settings
  React.useEffect(() => {
    if (!state.profile) {
      return;
    }

    setSettings(JSON.parse(state.profile.settings));
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
  const trainingServersBuy = React.useMemo(
    () => trainingServers.filter((server) => server.cost && !server.profileId),
    [trainingServers],
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
      setTrainingMapId(trainingMaps[0].id);
    }
  }, [trainingMaps]);

  React.useEffect(() => {
    if (trainingServers.length > 0 && !trainingServerId) {
      setTrainingServerId(trainingServers[0].id);
    }
  }, [trainingServers]);

  return (
    <div className="dashboard">
      <header>
        <button
          className={cx(activeTab === TabIdentifier.SQUAD && '!btn-active')}
          onClick={() => setActiveTab(TabIdentifier.SQUAD)}
        >
          <FaUsers />
          Squad
        </button>
        <button
          className={cx(activeTab === TabIdentifier.TRAINING && '!btn-active')}
          onClick={() => setActiveTab(TabIdentifier.TRAINING)}
        >
          <FaStopwatch />
          Training
        </button>
      </header>
      <main>
        {activeTab === TabIdentifier.SQUAD && (
          <section className="divide-y divide-base-content/10">
            <article className="stack-y !gap-0">
              <header className="prose !border-t-0">
                <h2>Starters</h2>
              </header>
              {!!starters.length && (
                <footer>
                  <table className="table">
                    <thead>
                      <tr>
                        <th className="w-4/5">
                          <p title="Player Name">Name</p>
                        </th>
                        <th className="text-center">Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {starters.map((player) => (
                        <tr key={player.id + '__starter'}>
                          <td className="line-clamp-1" title={player.name}>
                            {player.name}
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
                  <p>All is quiet...</p>
                </footer>
              )}
            </article>
            <article className="stack-y !gap-0">
              <header className="prose">
                <h2>Transfer Listed</h2>
              </header>
              {!!transferListed.length && (
                <footer>
                  <table className="table">
                    <thead>
                      <tr>
                        <th className="w-3/5">
                          <p title="Player Name">Name</p>
                        </th>
                        <th className="w-1/5 text-center" />
                        <th className="text-center">Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transferListed.map((player) => (
                        <tr key={player.id + '__transfer-listed'}>
                          <td className="line-clamp-1" title={player.name}>
                            {player.name}
                          </td>
                          <td className="text-muted text-center italic">
                            {!!Object.keys(transfersByPlayer).includes(player.id.toString()) &&
                              `${transfersByPlayer[player.id].length} offers`}
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
                  <p>All is quiet...</p>
                </footer>
              )}
            </article>
            <article className="stack-y !gap-0">
              <header className="prose">
                <h2>Incoming Offers</h2>
              </header>
              {!!transfers.length && (
                <footer>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>
                          <p>From</p>
                        </th>
                        <th>
                          <p>For</p>
                        </th>
                        <th className="text-center">
                          <p>Amount</p>
                        </th>
                        <th className="text-center">Accept/Reject</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfers.map((transfer) => (
                        <tr key={transfer.id + '__transfer'}>
                          <td title={transfer.from.name}>{transfer.from.name}</td>
                          <td title={transfer.target.name}>{transfer.target.name}</td>
                          <td className="text-center">
                            {Util.formatCurrency(transfer.offers[0].cost)}
                          </td>
                          <td>
                            <div className="stack-x justify-center">
                              <button
                                title="Accept Offer"
                                className="btn btn-success btn-sm"
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
                                title="Reject Offer"
                                className="btn btn-error btn-sm"
                                onClick={() =>
                                  api.transfers
                                    .reject(transfer.id)
                                    .then(() => fetchTransfers(state.profile.team.id))
                                    .then(setTransfers)
                                }
                              >
                                <FaBan />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </footer>
              )}
              {!transfers.length && (
                <footer className="center h-32">
                  <p>All is quiet...</p>
                </footer>
              )}
            </article>
          </section>
        )}
        {activeTab === TabIdentifier.TRAINING && (
          <section className="divide-y divide-base-content/10">
            <article className="card image-full h-64 rounded-none before:!rounded-none">
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
                    localStorage.setItem('trainingServerId', trainingServerId.toString());
                    localStorage.setItem('trainingMapId', trainingMapId.toString());

                    for (const status of trainingStatuses) {
                      setTrainingStatus(status);

                      if (/drills/gi.test(status)) {
                        await api.profiles.train([trainingServerId, trainingMapId]);
                        continue;
                      }

                      await Util.sleep(TRAINING_STATUS_INTERVAL);
                    }
                  }}
                >
                  <FaBolt />
                  Sim Training
                </button>
                <p className="absolute bottom-4 font-mono">{trainingStatus}</p>
              </aside>
            </article>
            <form className="form-ios">
              <fieldset>
                <legend>Overview</legend>
                <section>
                  <header>
                    <h3>Server</h3>
                    <BonusSummaryLabel
                      data={trainingServers.find((server) => server.id === trainingServerId)}
                    />
                  </header>
                  <article>
                    <select
                      className="select w-full"
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
                    <h3>Map</h3>
                    <BonusSummaryLabel
                      data={trainingMaps.find((map) => map.id === trainingMapId)}
                    />
                  </header>
                  <article>
                    <select
                      className="select w-full"
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
              </fieldset>
            </form>
            <article className="stack-y !gap-0">
              <header className="prose">
                <h2>Servers</h2>
              </header>
              <footer>
                <table className="table">
                  <thead>
                    <tr>
                      <th>
                        <p title="Server Name">Name</p>
                      </th>
                      <th className="text-center">
                        <p>Cost</p>
                      </th>
                      <th className="text-center">Purchase</th>
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
                        <td className="text-center">
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={state.profile && (state.profile.earnings || 0) < server.cost}
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
          </section>
        )}
        <section className="grid auto-rows-min grid-cols-2 gap-5 p-5 xl:grid-cols-3">
          <article className="col-span-2 xl:col-span-3">
            <button
              className="btn rounded-none font-normal shadow-none"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <FaExpand /> : <FaCompress />}
              {collapsed ? 'Expand All' : 'Collapse All'}
            </button>
          </article>
          {squad
            .filter((player) => player.id !== state.profile.player.id)
            .map((player) => (
              <PlayerCard
                key={player.id + '__squad'}
                player={player}
                compact={collapsed}
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
              />
            ))}
        </section>
      </main>
    </div>
  );
}
