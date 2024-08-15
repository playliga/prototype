/**
 * Player card component.
 *
 * @module
 */
import React from 'react';
import cx from 'classnames';
import { startCase } from 'lodash';
import { Bot, Eagers, Util } from '@liga/shared';
import { FaCaretDown, FaCaretUp, FaFolderOpen, FaShoppingBag, FaStar } from 'react-icons/fa';

/** @interface */
interface XPBarProps {
  max: number;
  title: string;
  value: number;
  className?: string;
  gains?: number;
  high?: number;
  low?: number;
  subtitle?: string;
}

/** @interface */
interface PlayerCardProps {
  player: Awaited<ReturnType<typeof api.players.all<typeof Eagers.player>>>[number];
  className?: string;
  compact?: boolean;
  onClickStarter?: () => void;
  onClickTransferListed?: () => void;
}

/**
 * XP bar.
 *
 * @param props Root props.
 * @component
 * @function
 */
function XPBar(props: XPBarProps) {
  return (
    <div className={cx('stack-y', props.className)}>
      {!!props.title && (
        <div className="stack-x justify-between text-xs">
          <p className="capitalize">
            {props.title.replace(/(delay|time)/i, 'speed')}
            {!!props.gains && (
              <span className="font-mono text-success">
                &nbsp;+{Util.toOptionalDecimal(Math.abs(props.gains))}
              </span>
            )}
          </p>
          {!!props.subtitle && <p className="font-mono">{props.subtitle}</p>}
        </div>
      )}
      <div className="stack-x w-full items-center">
        {!!props.high && !!props.low && (
          <meter
            className="inverted"
            value={props.value}
            max={props.max}
            low={props.low}
            high={props.high}
          />
        )}
        {(!props.high || !props.low) && (
          <progress className="progress" value={props.value} max={props.max} />
        )}
      </div>
    </div>
  );
}

/**
 * Exports this module.
 *
 * @param props Root props.
 * @component
 * @exports
 */
export default function (props: PlayerCardProps) {
  const [compact, setCompact] = React.useState(props.compact);
  const xp = React.useMemo(() => new Bot.Exp(JSON.parse(props.player.stats)), [props.player.stats]);
  const gains = React.useMemo<(typeof xp)['gains']>(
    () => JSON.parse(props.player.gains || '{}'),
    [props.player.gains],
  );
  const gainsTotal = React.useMemo(
    () =>
      Object.keys(gains)
        .map((key) => gains[key])
        .reduce((total, current) => total + current, 0),
    [gains],
  );

  React.useEffect(() => {
    if (compact !== props.compact) {
      setCompact(props.compact);
    }
  }, [props.compact]);

  if (compact) {
    return (
      <article className="player-card">
        <header className="grid grid-cols-3 items-center divide-x divide-base-content/10">
          <nav className="col-span-2">
            <h3>{props.player.name}</h3>
            <p className="line-clamp-1">
              <span className={cx('fp', props.player.country.code.toLowerCase())} />
              <span> {props.player.country.name}</span>
            </p>
          </nav>
          <aside className="stack-y">
            <p className="text-muted">Total XP</p>
            <p className="!text-2xl font-black">{Math.floor(Bot.Exp.getTotalXP(xp.stats))}</p>
            <p
              className={cx(
                'before:pr-px',
                gainsTotal <= 0
                  ? 'text-muted before:content-["▸"]'
                  : 'text-success before:content-["▴"]',
              )}
            >
              {Util.toOptionalDecimal(gainsTotal)}
            </p>
          </aside>
        </header>
        <footer>
          <button onClick={() => setCompact(!compact)}>
            <FaCaretDown />
          </button>
        </footer>
      </article>
    );
  }

  return (
    <article className="player-card">
      <header>
        <h3>{props.player.name}</h3>
        <p>
          <span className={cx('fp', props.player.country.code.toLowerCase())} />
          <span> {props.player.country.name}</span>
        </p>
      </header>
      <figure>
        <XPBar
          title="Total XP"
          subtitle={`${Math.floor(Bot.Exp.getTotalXP(xp.stats))}/${Math.floor(Bot.Exp.getMaximumXP())}`}
          value={Bot.Exp.getTotalXP(xp.stats)}
          max={Bot.Exp.getMaximumXP()}
        />
      </figure>
      {Object.keys(xp.stats).map((stat) => (
        <figure key={`xp__${props.player.name}_${stat}`}>
          <XPBar
            title={`${startCase(stat)}`}
            gains={gains[stat]}
            subtitle={
              Bot.StatModifiers.SUBTRACT.includes(stat)
                ? `${Util.toOptionalDecimal(Bot.Templates[0].stats[stat] - xp.stats[stat])}/${Bot.Templates[0].stats[stat]}`
                : `${Util.toOptionalDecimal(xp.stats[stat])}/${Bot.Exp.getMaximumXPForStat(stat)}`
            }
            value={
              Bot.StatModifiers.SUBTRACT.includes(stat)
                ? Bot.Templates[0].stats[stat] - xp.stats[stat]
                : xp.stats[stat]
            }
            max={
              Bot.StatModifiers.SUBTRACT.includes(stat)
                ? Bot.Templates[0].stats[stat]
                : Bot.Exp.getMaximumXPForStat(stat)
            }
          />
        </figure>
      ))}
      <aside className="grid grid-cols-3">
        <button
          title="Set as Starter"
          className="disabled:bg-transparent"
          disabled={!props.onClickStarter}
          onClick={props.onClickStarter || null}
        >
          <FaStar className={cx(props.player.starter && 'text-yellow-500')} />
        </button>
        <button title="Add to Transfer List" onClick={props.onClickTransferListed}>
          <FaShoppingBag className={cx(props.player.transferListed && 'text-primary')} />
        </button>
        <button title="View Offers">
          <FaFolderOpen />
        </button>
      </aside>
      <footer>
        <button onClick={() => setCompact(!compact)}>
          <FaCaretUp />
        </button>
      </footer>
    </article>
  );
}
