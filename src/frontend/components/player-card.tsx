/**
 * Player card component.
 *
 * @module
 */
import React from 'react';
import { startCase } from 'lodash';
import { differenceInYears } from 'date-fns';
import { Bot, Constants, Eagers, Util } from '@liga/shared';
import { cx } from '@liga/frontend/lib';
import { useTranslation } from '@liga/frontend/hooks';
import { FaFolderOpen, FaShoppingBag, FaStar, FaUserSlash } from 'react-icons/fa';

/** @type {Player} */
type Player = Awaited<ReturnType<typeof api.players.all<typeof Eagers.player>>>[number];

/** @type {Profile} */
type Profile = Awaited<ReturnType<typeof api.profiles.current>>;

/** @interface */
interface XPBarProps {
  max: number;
  value: number;
  className?: string;
  gains?: number;
  high?: number;
  low?: number;
  subtitle?: string;
  title?: string;
}

/** @interface */
interface PlayerCardProps extends React.ComponentProps<'article'> {
  game: Constants.Game;
  player: Omit<Player, 'team'>;
  className?: string;
  compact?: boolean;
  noStats?: boolean;
  profile?: Profile;
  onClickStarter?: () => void;
  onClickTransferListed?: () => void;
  onClickViewOffers?: () => void;
  onClickRelease?: () => void;
  onChangeWeapon?: (weapon: Constants.WeaponTemplate) => void;
}

/**
 * XP bar.
 *
 * @param props Root props.
 * @component
 * @function
 */
export function XPBar(props: XPBarProps) {
  return (
    <div className={cx('stack-y', props.className)}>
      {!!props.title && (
        <div className="stack-x justify-between text-xs">
          <p title={props.title.replace(/(delay|time)/i, 'speed')} className="truncate capitalize">
            {props.title.replace(/(delay|time)/i, 'speed')}
            {!!props.gains && (
              <span className="text-success font-mono">
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
  const t = useTranslation('components');
  const weapons = React.useMemo(() => Constants.WeaponTemplates[props.game], [props.game]);
  const xp = React.useMemo(() => {
    if (!props.player) {
      return;
    }

    return new Bot.Exp(props.player, null);
  }, [props.player]);
  const gainsTotal = React.useMemo(
    () =>
      Object.keys(xp.gains)
        .map((key) => xp.gains[key])
        .reduce((total, current) => total + current, 0),
    [xp.gains],
  );

  if (props.compact) {
    return (
      <article
        className={cx(
          'grid grid-cols-4 items-center divide-x border',
          'divide-base-content/10 border-base-content/10 bg-base-200 border-b-0',
          props.className,
        )}
      >
        <figure className="center">
          <img
            src={props.player.avatar || 'resources://avatars/empty.png'}
            className="h-12 w-auto"
          />
        </figure>
        <aside className="stack-x col-span-2 gap-4 px-4">
          <button
            title={t('playerCard.setAsStarter')}
            className={cx(!!props.onClickStarter && 'cursor-pointer [&_svg]:hover:text-yellow-500')}
            disabled={!props.onClickStarter}
            onClick={props.onClickStarter || null}
          >
            <FaStar className={cx(props.player.starter && 'text-yellow-500')} />
          </button>
          <nav className="center h-full place-items-start text-left">
            <h3>{props.player.name}</h3>
            <p className="line-clamp-1">
              <span className={cx('fp', props.player.country.code.toLowerCase())} />
              <span>&nbsp;{props.player.country.name}</span>
            </p>
          </nav>
        </aside>
        <aside className="stack-y center gap-0">
          <p className="text-muted">{t('playerCard.totalXP')}</p>
          <p className="text-2xl! font-black">
            {props.noStats ? '-' : Math.floor(Bot.Exp.getTotalXP(xp.stats))}
          </p>
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
      </article>
    );
  }

  return (
    <article
      className={cx(
        'stack-y h-fit gap-0! divide-y border',
        'divide-base-content/10 border-base-content/10 bg-base-200',
        props.className,
      )}
    >
      <header className="flex gap-4 px-10">
        <figure className="center w-1/3">
          <img
            src={props.player.avatar || 'resources://avatars/empty.png'}
            className="h-12 w-auto"
          />
        </figure>
        <nav className="w-2/3 py-4">
          <h3 className="truncate">{props.player.name}</h3>
          {!!props.profile && (
            <p className="text-sm">
              {t('shared.age')}: {differenceInYears(props.profile.date, props.player.dob)}
            </p>
          )}
          <p className="text-sm">
            <span className={cx('fp', props.player.country.code.toLowerCase())} />
            <span>&nbsp;{props.player.country.name}</span>
          </p>
        </nav>
      </header>
      <aside className="px-10 py-4">
        <label className="fieldset p-0 text-xs">
          <p>Potential</p>
          <figure className="rating mt-0 gap-1">
            {[...Array(Constants.Prestige.length)].map((_, idx) => (
              <span
                key={idx + '__player_prestige'}
                className="mask mask-star bg-yellow-500"
                aria-current={idx + 1 <= props.player.prestige + 1}
              />
            ))}
          </figure>
        </label>
      </aside>
      <aside className="px-10 py-4">
        <label className="fieldset p-0 text-xs">
          <p>{t('shared.weaponPreference')}</p>
          <select
            className="select select-sm bg-base-300 mt-2"
            value={props.player.weapon || Constants.WeaponTemplate.AUTO}
            onChange={(event) =>
              props.onChangeWeapon(event.target.value as Constants.WeaponTemplate)
            }
          >
            {Object.keys(Constants.WeaponTemplate).map(
              (template: keyof typeof Constants.WeaponTemplate) => (
                <option
                  key={template + props.player.name}
                  value={Constants.WeaponTemplate[template]}
                  title={
                    props.player.weapon && weapons[Constants.WeaponTemplate[template]]?.join(', ')
                  }
                >
                  {Constants.WeaponTemplate[template]}
                </option>
              ),
            )}
          </select>
        </label>
      </aside>
      <aside className="px-10 py-4">
        <XPBar
          title={t('playerCard.totalXP')}
          subtitle={`${Math.floor(Bot.Exp.getTotalXP(xp.stats))}/${Math.floor(Bot.Exp.getMaximumXP())}`}
          value={Bot.Exp.getTotalXP(xp.stats)}
          max={Bot.Exp.getMaximumXP()}
        />
      </aside>
      {Object.keys(xp.stats).map((stat) => {
        const { gain, value, max } = xp.normalize(stat);

        return (
          <aside key={`xp__${props.player.name}_${stat}`} className="px-10 py-4">
            <XPBar
              title={`${startCase(stat)}`}
              gains={gain}
              subtitle={`${value}/${max}`}
              value={value}
              max={Number(max)}
            />
          </aside>
        );
      })}
      <aside className="grid grid-cols-4">
        <button
          title={t('playerCard.setAsStarter')}
          className="btn btn-ghost btn-block rounded-none disabled:bg-transparent!"
          disabled={!props.onClickStarter}
          onClick={props.onClickStarter || null}
        >
          <FaStar className={cx(props.player.starter && 'text-yellow-500')} />
        </button>
        <button
          title={t('playerCard.addToTransferList')}
          className="btn btn-ghost btn-block rounded-none"
          onClick={props.onClickTransferListed}
        >
          <FaShoppingBag className={cx(props.player.transferListed && 'text-primary')} />
        </button>
        <button
          title={t('shared.viewOffers')}
          className="btn btn-ghost btn-block rounded-none"
          onClick={props.onClickViewOffers}
        >
          <FaFolderOpen />
        </button>
        <button
          className="btn btn-ghost btn-block rounded-none"
          disabled={!props.onClickRelease}
          onClick={props.onClickRelease || null}
        >
          <FaUserSlash />
        </button>
      </aside>
    </article>
  );
}
