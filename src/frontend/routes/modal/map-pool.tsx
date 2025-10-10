/**
 * Add or remove maps from the map pool.
 *
 * @module
 */
import React from 'react';
import { Link, useLocation, Location } from 'react-router-dom';
import { Constants, Util } from '@liga/shared';
import { cx } from '@liga/frontend/lib';
import { AppStateContext } from '@liga/frontend/redux';
import { useTranslation } from '@liga/frontend/hooks';
import { Image } from '@liga/frontend/components';
import { FaCaretLeft, FaCaretRight } from 'react-icons/fa';

/** @interface */
interface MapListProps {
  gameVersion: Constants.Game;
  label: string;
  mapPool: Awaited<ReturnType<typeof api.mapPool.find>>;
  mapPoolLength?: number;
  selection: MapListProps['mapPool'];
  onChange: (selection: MapListProps['mapPool']) => void;
}

/**
 * @param props The root props.
 * @function
 */
export function MapList(props: MapListProps) {
  const onClick = (checked: boolean, map: MapListProps['mapPool'][number]) => {
    props.onChange(
      checked
        ? [...props.selection, map]
        : props.selection.filter((selectedMap) => selectedMap.gameMap.name !== map.gameMap.name),
    );
  };

  const isInvalid = React.useMemo(() => {
    if (!props.mapPoolLength) {
      return false;
    }

    return props.mapPool.length < props.mapPoolLength;
  }, [props.mapPool, props.mapPoolLength]);

  return (
    <table className="table">
      <caption
        title={isInvalid ? 'Maps required: ' + props.mapPoolLength : ''}
        className={cx('sticky top-0 z-10', !!isInvalid && 'text-error')}
      >
        <span>{props.label}&nbsp;</span>
        <span>({props.mapPool.length})</span>
      </caption>
      {props.mapPool.map((map) => (
        <React.Fragment key={map.gameMap.name}>
          <thead>
            <tr>
              <th colSpan={2}>{map.gameMap.name}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              className="cursor-pointer"
              onClick={() =>
                onClick(
                  !props.selection.some(
                    (selectedMap) => selectedMap.gameMap.name === map.gameMap.name,
                  ),
                  map,
                )
              }
            >
              <td className="w-1/5 text-center">
                <input
                  readOnly
                  type="checkbox"
                  className="checkbox"
                  checked={props.selection.some(
                    (selectedMap) => selectedMap.gameMap.name === map.gameMap.name,
                  )}
                />
              </td>
              <td className="w-4/5 px-0 py-0">
                <figure>
                  <Image
                    className="h-16 w-full object-cover brightness-75"
                    src={Util.convertMapPool(map.gameMap.name, props.gameVersion, true)}
                  />
                </figure>
              </td>
            </tr>
          </tbody>
        </React.Fragment>
      ))}
    </table>
  );
}

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const location = useLocation() as Location<RouteStateMapPool>;
  const t = useTranslation('windows');
  const { state } = React.useContext(AppStateContext);
  const [gameVersion, setGameVersion] = React.useState<Constants.Game>(Constants.Game.CSGO);
  const [working, setWorking] = React.useState(false);

  // map pool config
  const [mapPool, setMapPool] = React.useState<MapListProps['mapPool']>([]);
  const [reserve, setReserve] = React.useState<typeof mapPool>([]);
  const [active, setActive] = React.useState<typeof mapPool>([]);
  const [reserveSelection, setReserveSelection] = React.useState<typeof mapPool>([]);
  const [activeSelection, setActiveSelection] = React.useState<typeof mapPool>([]);

  // detect selected game version
  React.useEffect(() => {
    if (!state.profile) {
      return;
    }

    const settings = Util.loadSettings(state.profile.settings);
    setGameVersion(settings.general.game);
  }, [state.profile]);

  // load map pool
  React.useEffect(() => {
    api.mapPool
      .find({
        where: {
          gameVersion: {
            slug: gameVersion,
          },
        },
      })
      .then(setMapPool);
  }, [gameVersion]);

  React.useEffect(() => {
    setReserve(mapPool.filter((map) => map.position === null));
    setActive(mapPool.filter((map) => map.position !== null));
  }, [mapPool]);

  if (!mapPool.length) {
    <main className="h-screen w-screen">
      <section className="center h-full">
        <span className="loading loading-bars" />
      </section>
    </main>;
  }

  return (
    <main className="flex h-screen w-full flex-col">
      {!!location.state && (
        <header className="breadcrumbs border-base-content/10 bg-base-200 sticky top-0 z-30 overflow-x-visible border-b px-2 text-sm">
          <ul>
            <li className="capitalize">
              <Link to={location.state.from}>{location.state.label}</Link>
            </li>
            <li>Map Pool</li>
          </ul>
        </header>
      )}
      <section className="p-2">
        <p>Customize the active map pool per game. There must be seven (7) maps configured.</p>
      </section>
      <section>
        <select
          className="select border-base-content/10 bg-base-200 w-full rounded-none"
          onChange={(event) => setGameVersion(event.target.value as Constants.Game)}
          value={gameVersion}
        >
          {Object.values(Constants.Game).map((game) => (
            <option key={game} value={game}>
              {game}
            </option>
          ))}
        </select>
      </section>
      <section className="flex h-0 flex-1">
        <article className="flex-1 overflow-y-scroll">
          <MapList
            label="Reserve"
            mapPool={reserve}
            gameVersion={gameVersion}
            selection={reserveSelection}
            onChange={setReserveSelection}
          />
        </article>
        <article className="stack-y border-base-content/10 justify-center border-x px-2">
          <button
            className="btn"
            disabled={!reserveSelection.length}
            onClick={() => {
              setActive([...active, ...reserveSelection]);
              setReserve(
                reserve.filter(
                  (reserveMap) =>
                    !reserveSelection.some(
                      (selectedMap) => selectedMap.gameMap.name === reserveMap.gameMap.name,
                    ),
                ),
              );
              setReserveSelection([]);
            }}
          >
            <FaCaretRight />
          </button>
          <button
            className="btn"
            disabled={!activeSelection.length}
            onClick={() => {
              setReserve([...reserve, ...activeSelection]);
              setActive(
                active.filter(
                  (activeMap) =>
                    !activeSelection.some(
                      (selectedMap) => selectedMap.gameMap.name === activeMap.gameMap.name,
                    ),
                ),
              );
              setActiveSelection([]);
            }}
          >
            <FaCaretLeft />
          </button>
        </article>
        <article className="flex-1 overflow-y-scroll">
          <MapList
            label="Active"
            mapPool={active}
            mapPoolLength={Constants.Application.MAP_POOL_LENGTH as number}
            gameVersion={gameVersion}
            selection={activeSelection}
            onChange={setActiveSelection}
          />
        </article>
      </section>
      <button
        className="btn btn-xl btn-block btn-primary rounded-none active:translate-0!"
        disabled={active.length < Constants.Application.MAP_POOL_LENGTH || working}
        onClick={() => {
          setWorking(true);

          Promise.all([
            api.mapPool.updateMany({
              where: { id: { in: reserve.map((reserveMap) => reserveMap.id) } },
              data: {
                position: null,
              },
            }),
            active.map((activeMap, idx) =>
              api.mapPool.update({
                where: { id: activeMap.id },
                data: {
                  position: idx,
                },
              }),
            ),
          ]).then(() => setWorking(false));
        }}
      >
        {!!working && <span className="loading loading-spinner"></span>}
        {t('shared.apply')}
      </button>
    </main>
  );
}
