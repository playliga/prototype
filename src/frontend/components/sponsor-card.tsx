/**
 * Sponsor card component.
 *
 * @module
 */
import React from 'react';
import cx from 'classnames';
import Image from './image';
import { startCase } from 'lodash';
import { Constants, Eagers, Util } from '@liga/shared';
import { FaAward, FaCheckCircle, FaExclamationCircle, FaScroll } from 'react-icons/fa';

/** @type {ContractCondition} */
type ContractCondition = (typeof Constants.SponsorContract)[Constants.SponsorSlug][
  | 'bonuses'
  | 'requirements'][number];

/** @type {Sponsor} */
type Sponsor = Awaited<ReturnType<typeof api.sponsors.all<typeof Eagers.sponsor>>>[number];

/** @interface */
interface Props {
  sponsor: Sponsor;
  onApply?: () => void;
}

/**
 * Converts a contract bonus or requirement
 * object into natural language format.
 *
 * @param props The root props.
 * @function
 */
function ContractCondition(props: ContractCondition) {
  const type = React.useMemo(() => Util.formatContractCondition(props), [props.type]);

  if (props.amount) {
    return (
      <div className="stack-x items-center">
        <FaCheckCircle className="text-success" />
        <span>
          {type} ({Util.formatCurrency(props.amount)})
        </span>
      </div>
    );
  }

  return (
    <div className="stack-x items-center">
      <FaExclamationCircle className="inline-block text-error" />
      <span>{type}</span>
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
export default function (props: Props) {
  const hasPendingOffer = React.useMemo(
    () =>
      props.sponsor.sponsorships.some((sponsorship) =>
        sponsorship.offers.some(
          (offer) => offer.status === Constants.SponsorshipStatus.SPONSOR_PENDING,
        ),
      ),
    [props.sponsor.sponsorships],
  );

  const contract = React.useMemo(
    () => Constants.SponsorContract[props.sponsor.slug as Constants.SponsorSlug],
    [props.sponsor],
  );

  return (
    <section className="card card-compact border border-base-content/10 bg-base-200">
      <figure className="bg-base-300">
        <Image src={props.sponsor.logo} className="h-64" />
      </figure>
      <article className="card-body divide-y divide-base-content/10">
        <header>
          <h2 className="card-title">{props.sponsor.name}</h2>
          <p>{props.sponsor.description}</p>
        </header>
        <aside>
          <h3 className="card-title text-base">Bonuses</h3>
          {contract.bonuses.map((bonus) => (
            <ContractCondition key={props.sponsor.id + '__bonuses__' + bonus.type} {...bonus} />
          ))}
        </aside>
        <aside>
          <h3 className="card-title text-base">Requirements</h3>
          {contract.requirements.map((requirement) => (
            <ContractCondition
              key={props.sponsor.id + '__requirements__' + requirement.type}
              {...requirement}
            />
          ))}
        </aside>
        <aside>
          <h3 className="card-title text-base">Tiers</h3>
          {contract.tiers.map((tier) => (
            <div key={props.sponsor.id + '__tiers__' + tier} className="stack-x items-center">
              <FaAward className="inline-block text-warning" />
              <span>{Constants.IdiomaticTier[tier]}</span>
            </div>
          ))}
        </aside>
        <aside>
          <h3 className="card-title text-base">Terms</h3>
          <div className="stack-x items-center">
            <FaScroll className="inline-block text-secondary" />
            <span>
              Length:&nbsp;
              {contract.terms[0].length}
              &nbsp;year(s)
            </span>
          </div>
          <div className="stack-x items-center">
            <FaScroll className="inline-block text-secondary" />
            {(() => {
              const [terms] = contract.terms;
              const frequency = startCase(
                Constants.CalendarFrequency[terms.frequency].toLowerCase(),
              );

              return (
                <span>
                  {Util.formatCurrency(terms.amount)} / {frequency}
                </span>
              );
            })()}
          </div>
        </aside>
        <aside>
          <p>
            <em>The above conditions apply on a per-season basis.</em>
          </p>
        </aside>
        {!!props.onApply && (
          <footer className="flex h-full items-end !border-t-0">
            <button
              className={cx('btn btn-primary btn-block', hasPendingOffer && 'btn-disabled')}
              onClick={props.onApply}
            >
              Apply
            </button>
          </footer>
        )}
      </article>
    </section>
  );
}
