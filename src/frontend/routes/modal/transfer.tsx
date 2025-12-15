/**
 * Dedicated modal for transfer offers.
 *
 * @module
 */
import React from 'react';
import { flatten, startCase } from 'lodash';
import { useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Bot, Constants, Eagers, Util } from '@liga/shared';
import { cx } from '@liga/frontend/lib';
import { AppStateContext } from '@liga/frontend/redux';
import { useTranslation } from '@liga/frontend/hooks';
import { Image } from '@liga/frontend/components';
import { XPBar } from '@liga/frontend/components/player-card';
import {
  FaBan,
  FaBookmark,
  FaCheck,
  FaDollarSign,
  FaExclamationTriangle,
  FaPiggyBank,
  FaTag,
  FaWallet,
} from 'react-icons/fa';

/** @enum */
enum Tab {
  SEND_OFFER,
  REVIEW_OFFERS,
  PAST_OFFERS,
}

/** @type {Player} */
type Player = Awaited<ReturnType<typeof api.players.find<typeof Eagers.player>>>;

/** @type {Transfer} */
type Transfer = Awaited<ReturnType<typeof api.transfers.all<typeof Eagers.transfer>>>[number];

/** @constant */
const formDefaultValues = {
  cost: 0,
  wages: 0,
};

/** @constant */
const TransferStatusBadgeColor: Record<number, string> = {
  [Constants.TransferStatus.PLAYER_ACCEPTED]: 'badge-success',
  [Constants.TransferStatus.PLAYER_PENDING]: 'badge-warning',
  [Constants.TransferStatus.PLAYER_REJECTED]: 'badge-error',
  [Constants.TransferStatus.TEAM_ACCEPTED]: 'badge-success',
  [Constants.TransferStatus.TEAM_PENDING]: 'badge-warning',
  [Constants.TransferStatus.TEAM_REJECTED]: 'badge-error',
};

/**
 * @param playerId The player id.
 * @function
 */
function fetchTransfers(playerId: number) {
  return api.transfers.all({
    where: {
      target: {
        id: playerId,
      },
    },
    include: Eagers.transfer.include,
  });
}

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const location = useLocation();
  const t = useTranslation('windows');
  const { state } = React.useContext(AppStateContext);
  const [activeTab, setActiveTab] = React.useState<Tab>();
  const [player, setPlayer] = React.useState<Player>();
  const [transfers, setTransfers] = React.useState<Array<Transfer>>();

  // initial data fetch
  React.useEffect(() => {
    if (!location.state) {
      return;
    }

    api.players
      .find({
        ...Eagers.player,
        where: {
          id: location.state as number,
        },
      })
      .then(setPlayer);

    // fetch transfer history
    fetchTransfers(location.state as number).then(setTransfers);
  }, []);

  // form setup
  const { register, formState, handleSubmit } = useForm({
    defaultValues: formDefaultValues,
    mode: 'all',
  });

  // handle form submission
  const onSubmit = (data: typeof formDefaultValues) => {
    api.transfers
      .create(
        {
          from: {
            connect: { id: state.profile.teamId },
          },
          target: {
            connect: { id: player.id },
          },
          ...(player.teamId
            ? {
                to: {
                  connect: { id: player.teamId },
                },
              }
            : {}),
        },
        {
          cost: data.cost,
          wages: data.wages,
        },
      )
      .then(() => fetchTransfers(player.id))
      .then(setTransfers);
  };

  // grab all player offers
  const offers = React.useMemo(() => {
    if (!transfers) {
      return;
    }

    return flatten(transfers.map((transfer) => transfer.offers));
  }, [transfers]);

  // any active offers
  const activeOffer = React.useMemo(() => {
    if (!transfers) {
      return false;
    }

    return transfers.some(
      (transfer) =>
        transfer.from.id === state.profile.teamId &&
        [Constants.TransferStatus.TEAM_PENDING, Constants.TransferStatus.PLAYER_PENDING].includes(
          transfer.status,
        ),
    );
  }, [transfers]);

  // can the user afford this player
  const canAfford = React.useMemo(() => {
    if (!player) {
      return false;
    }

    return (
      state.profile.team.earnings >= player.cost && state.profile.team.earnings >= player.wages
    );
  }, [player]);

  // check if this is a teammate
  const isTeammate = React.useMemo(() => {
    if (!player) {
      return false;
    }

    return state.profile.teamId === player.teamId;
  }, [player]);

  // is this player already shortlisted?
  const shortlisted = React.useMemo(() => {
    if (!player) {
      return false;
    }

    return state.shortlist.find((item) => item.playerId === player.id);
  }, [player, state.shortlist]);

  // load player stats
  const xp = React.useMemo(() => {
    if (!player) {
      return;
    }

    return new Bot.Exp(player);
  }, [player]);

  // load the default tab
  React.useEffect(() => {
    if (isTeammate) {
      setActiveTab(Tab.REVIEW_OFFERS);
    } else {
      setActiveTab(Tab.SEND_OFFER);
    }
  }, [isTeammate]);

  if (!player || activeTab === null) {
    return (
      <main className="h-screen w-screen">
        <section className="center h-full">
          <span className="loading loading-bars" />
        </section>
      </main>
    );
  }

  return (
    <main className="divide-base-content/10 flex h-screen w-screen flex-col divide-y">
      <header className="stats bg-base-200 w-full grid-cols-3 rounded-none">
        <section className="stat">
          <figure className="stat-figure text-secondary">
            <FaWallet className="size-8" />
          </figure>
          <header className="stat-title">Wages</header>
          <aside className="stat-value text-secondary">
            {Util.formatCurrency(player.wages, { notation: 'compact' })}
          </aside>
          <footer className="stat-desc">Per Week</footer>
        </section>
        <section className="stat">
          <figure className="stat-figure text-primary">
            <FaTag className="size-8" />
          </figure>
          <header className="stat-title">Transfer Value</header>
          <aside className="stat-value text-primary">
            {Util.formatCurrency(player.cost, { notation: 'compact' })}
          </aside>
        </section>
        <section className="stat">
          <figure className="stat-figure">
            <FaPiggyBank className="size-8" />
          </figure>
          <header className="stat-title">Your Earnings</header>
          <aside className={cx('stat-value', !isTeammate && !canAfford && 'text-error')}>
            {Util.formatCurrency(state.profile.team.earnings, { notation: 'compact' })}
          </aside>
        </section>
      </header>
      <section className="flex">
        <figure className="center w-1/5 gap-2 p-2">
          <Image src={player.avatar || 'resources://avatars/empty.png'} className="h-auto w-full" />
          {!isTeammate && (
            <figcaption>
              {shortlisted ? (
                <button
                  className="btn btn-xs"
                  title={t('shared.shortlistRemove')}
                  onClick={() =>
                    api.shortlist.delete({
                      where: {
                        teamId_playerId: {
                          playerId: player.id,
                          teamId: state.profile.teamId,
                        },
                      },
                    })
                  }
                >
                  <FaBookmark className="text-primary" />
                  {t('shared.shortlisted')}
                </button>
              ) : (
                <button
                  className="btn btn-xs"
                  title={t('shared.shortlistAdd')}
                  onClick={() =>
                    api.shortlist.create({
                      data: {
                        teamId: state.profile.teamId,
                        playerId: player.id,
                      },
                    })
                  }
                >
                  <FaBookmark className="text-muted" />
                  {t('shared.shortlist')}
                </button>
              )}
            </figcaption>
          )}
        </figure>
        <table className="table table-fixed">
          <thead>
            <tr>
              <th>Name</th>
              <th>Country</th>
              <th>Team</th>
              <th>Potential</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-base-content/10 border-l">
              <td title={player.name} className="truncate">
                {player.name}
              </td>
              <td>
                <span className={cx('fp', 'mr-2', player.country.code.toLowerCase())} />
                <span>{player.country.name}</span>
              </td>
              <td title={player.team?.name || 'Free Agent'} className="truncate">
                {!!player.team && (
                  <>
                    <img src={player.team?.blazon} className="inline-block size-6" />
                    <span>&nbsp;{player.team?.name}</span>
                  </>
                )}
                {!player.team && <span>Free Agent</span>}
              </td>
              <td>
                <figure className="rating gap-1">
                  {[...Array(Constants.Prestige.length)].map((_, idx) => (
                    <span
                      key={idx + '__player_prestige'}
                      className="mask mask-star bg-yellow-500 max-sm:size-3"
                      aria-current={idx + 1 <= player.prestige + 1}
                    />
                  ))}
                </figure>
              </td>
            </tr>
          </tbody>
          <thead>
            <tr>
              <th colSpan={4}>Stats</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-base-content/10 border-l">
              {Object.keys(xp.stats).map((stat) => {
                const { value, max } = xp.normalize(stat);
                return (
                  <td key={`xp__${player.name}_${stat}_value`}>
                    <XPBar
                      title={`${startCase(stat)}`}
                      subtitle={`${value}/${max}`}
                      value={value}
                      max={Number(max)}
                    />
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </section>
      <section role="tablist" className="tabs-box tabs rounded-none border-t-0!">
        {Object.keys(Tab)
          .filter((tabKey) => isNaN(Number(tabKey)))
          .filter((tabKey: keyof typeof Tab) =>
            isTeammate ? Tab[tabKey] !== Tab.SEND_OFFER : Tab[tabKey] !== Tab.REVIEW_OFFERS,
          )
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
      </section>
      {activeTab === Tab.REVIEW_OFFERS && (
        <section className="flex-1 overflow-y-scroll">
          <table className="table-pin-rows table table-fixed">
            <thead>
              <tr>
                <th>From</th>
                <th className="w-1/12 text-center">Fee</th>
                <th className="w-5/12 text-right">Accept/Reject</th>
              </tr>
            </thead>
            <tbody>
              {!!transfers &&
                transfers
                  .filter((transfer) => transfer.status === Constants.TransferStatus.TEAM_PENDING)
                  .map((transfer) => (
                    <tr key={transfer.id + '__transfer'}>
                      <td title={transfer.from.name} className="truncate">
                        <img src={transfer.from.blazon} className="inline-block size-6" />
                        <span>&nbsp;{transfer.from.name}</span>
                      </td>
                      <td className="text-center">
                        {Util.formatCurrency(transfer.offers[0].cost)}
                      </td>
                      <td className="join w-full justify-end text-center">
                        <button
                          title="Accept Offer"
                          className="btn btn-success join-item btn-sm"
                          onClick={() =>
                            api.transfers
                              .accept(transfer.id)
                              .then(() => fetchTransfers(player.id))
                              .then(setTransfers)
                          }
                        >
                          <FaCheck />
                        </button>
                        <button
                          title="Reject Offer"
                          className="btn btn-error join-item btn-sm"
                          onClick={() =>
                            api.transfers
                              .reject(transfer.id)
                              .then(() => fetchTransfers(player.id))
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
        </section>
      )}
      {activeTab === Tab.SEND_OFFER && (
        <form
          className="form-ios form-ios-col-2 flex-1 overflow-y-scroll"
          onSubmit={handleSubmit(onSubmit)}
        >
          {!canAfford && (
            <section className="p-1">
              <article className="alert alert-error">
                <FaExclamationTriangle className="shink-0 size-6 stroke-current" />
                <span>
                  Oops! <b>{player.name}</b> is out of your price range right now.
                </span>
              </article>
            </section>
          )}
          <fieldset>
            {!!player.team && (
              <section>
                <header>
                  <p>Transfer Fee</p>
                  <p>
                    How much to pay <b>{player.team.name}</b> for this player.
                  </p>
                </header>
                <label
                  className={cx(
                    'input bg-base-200 w-full items-center gap-2',
                    formState.errors?.cost && 'input-error',
                  )}
                >
                  <FaDollarSign className="size-4 opacity-20" />
                  <input
                    type="number"
                    className="h-full grow"
                    min={0}
                    max={state.profile.team.earnings}
                    disabled={activeOffer || !canAfford || !player.team}
                    {...register('cost', {
                      valueAsNumber: true,
                      min: 0,
                      max: state.profile.team.earnings,
                    })}
                  />
                </label>
              </section>
            )}
            <section>
              <header>
                <p>Wages</p>
                <p>
                  How much to pay <b>{player.name}</b> per week.
                </p>
              </header>
              <label
                className={cx(
                  'input bg-base-200 w-full items-center gap-2',
                  formState.errors?.wages && 'input-error',
                )}
              >
                <FaDollarSign className="size-4 opacity-20" />
                <input
                  type="number"
                  className="h-full grow"
                  min={0}
                  max={state.profile.team.earnings}
                  disabled={activeOffer || !canAfford}
                  {...register('wages', {
                    valueAsNumber: true,
                    min: 0,
                    max: state.profile.team.earnings,
                  })}
                />
              </label>
            </section>
          </fieldset>
          <section className="p-2">
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={
                activeOffer ||
                !canAfford ||
                !formState.isValid ||
                formState.isSubmitting ||
                formState.isSubmitted ||
                (!formState.isDirty && formState.defaultValues === formDefaultValues)
              }
            >
              {!!formState.isSubmitting && <span className="loading loading-spinner"></span>}
              Send Offer
            </button>
          </section>
        </form>
      )}
      {activeTab === Tab.PAST_OFFERS && (
        <section className="flex-1 overflow-y-scroll">
          <table className="table-pin-rows table table-fixed">
            <thead>
              <tr>
                <th>From</th>
                <th className="text-center">Fee</th>
                <th className="text-center">Wages</th>
                <th className="w-3/12 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {!!offers &&
                offers.map((offer) => {
                  const team = transfers.find((transfer) => transfer.id === offer.transferId).from;
                  return (
                    <tr key={offer.id + '__offer'}>
                      <td>
                        <img src={team.blazon} className="inline-block size-6" />
                        <span>&nbsp;{team.name}</span>
                      </td>
                      <td className="text-center">{Util.formatCurrency(offer.cost)}</td>
                      <td className="text-center">{Util.formatCurrency(offer.wages)}</td>
                      <td className="text-center">
                        <span
                          className={cx(
                            'badge w-full capitalize',
                            TransferStatusBadgeColor[offer.status],
                          )}
                        >
                          {Constants.IdiomaticTransferStatus[offer.status]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
