/**
 * A collection of components that wrap React Select.
 *
 * @module
 */
import cx from 'classnames';
import type { Prisma } from '@prisma/client';
import ReactSelect, {
  ControlProps as ReactSelectControlProps,
  GroupBase as ReactSelectGroupBase,
  OptionProps as ReactSelectOptionProps,
  Props as ReactSelectProps,
  components as ReactSelectComponents,
} from 'react-select';

/** @interface */
interface SelectProps {
  className?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  borderColor?: string;
}

/** @interface */
interface CountryOptionProps extends Prisma.CountryGetPayload<unknown> {
  readonly value: number;
  readonly label: string;
}

/** @interface */
interface TeamOptionProps extends Prisma.TeamGetPayload<unknown> {
  readonly value: number;
  readonly label: string;
}

/** @type {CountrySelectProps} */
type CountrySelectProps = SelectProps &
  ReactSelectProps<CountryOptionProps, false, ReactSelectGroupBase<CountryOptionProps>>;

/** @type {TeamSelectProps} */
type TeamSelectProps = SelectProps &
  ReactSelectProps<TeamOptionProps, false, ReactSelectGroupBase<TeamOptionProps>>;

/**
 * Utility function that finds a country
 * from the nested Continents array.
 *
 * @param continents The continents array.
 * @param countryId The country to look for.
 * @function
 */
export function findCountryOptionByValue(
  continents: Array<ReactSelectGroupBase<CountryOptionProps>>,
  countryId: number,
) {
  // first find the continent the country is in
  const continent = continents.find((continent) =>
    continent.options.some((country) => country.id === countryId),
  );

  if (!continent) {
    return undefined;
  }

  // now find the country
  return continent.options.find((country) => country.id === countryId) as CountryOptionProps;
}

/**
 * Utility function that finds a team
 * from the nested tier array.
 *
 * @param tiers   The tiers array.
 * @param teamId  The team to look for.
 * @function
 */
export function findTeamOptionByValue(
  tiers: Array<ReactSelectGroupBase<TeamOptionProps>>,
  teamId: number,
) {
  // first find the tier the team is in
  const team = tiers.find((tier) => tier.options.some((team) => team.id === teamId));

  if (!team) {
    return undefined;
  }

  // now find the team
  return team.options.find((team) => team.id === teamId) as TeamOptionProps;
}

/**
 * Country selector component.
 *
 * @param props React Select props.
 * @function
 */
export function CountrySelect(props: CountrySelectProps) {
  return (
    <Select
      components={{
        Control: (
          innerProps: ReactSelectControlProps<
            CountryOptionProps,
            false,
            ReactSelectGroupBase<CountryOptionProps>
          >,
        ) => {
          const [selection] = innerProps.getValue();
          return (
            <ReactSelectComponents.Control {...innerProps}>
              {!!selection && <span className={cx('fp', 'ml-4', selection.code.toLowerCase())} />}
              {innerProps.children}
            </ReactSelectComponents.Control>
          );
        },
        Option: (
          innerProps: ReactSelectOptionProps<
            CountryOptionProps,
            false,
            ReactSelectGroupBase<CountryOptionProps>
          >,
        ) => {
          return (
            <ReactSelectComponents.Option {...innerProps}>
              <span className={cx('fp', 'mr-2', innerProps.data.code.toLowerCase())} />
              {innerProps.children}
            </ReactSelectComponents.Option>
          );
        },
      }}
      {...props}
    />
  );
}

/**
 * Team selector component.
 *
 * @param props React Select props.
 * @function
 */
export function TeamSelect(props: TeamSelectProps) {
  return (
    <Select
      components={{
        Control: (
          innerProps: ReactSelectControlProps<
            TeamOptionProps,
            false,
            ReactSelectGroupBase<TeamOptionProps>
          >,
        ) => {
          const [selection] = innerProps.getValue();
          return (
            <ReactSelectComponents.Control {...innerProps}>
              {!!selection && <img src={selection.blazon} className="ml-4 inline-block size-4" />}
              {innerProps.children}
            </ReactSelectComponents.Control>
          );
        },
        Option: (
          innerProps: ReactSelectOptionProps<
            TeamOptionProps,
            false,
            ReactSelectGroupBase<TeamOptionProps>
          >,
        ) => {
          return (
            <ReactSelectComponents.Option {...innerProps}>
              <img src={innerProps.data.blazon} className="mr-2 inline-block size-4" />
              {innerProps.children}
            </ReactSelectComponents.Option>
          );
        },
      }}
      {...props}
    />
  );
}

/**
 * Exports this module.
 *
 * @param props React Select props.
 * @exports
 */
export default function Select(props: SelectProps & ReactSelectProps) {
  const backgroundColor = props.backgroundColor || 'oklch(var(--b1))';
  const foregroundColor = props.foregroundColor || 'oklch(var(--bc)/0.2)';
  const borderColor = props.borderColor || foregroundColor;

  return (
    <ReactSelect
      components={props.components}
      className={props.className}
      styles={{
        control: (baseStyles) => ({
          ...baseStyles,
          height: '3rem',
          background: backgroundColor,
          borderColor: borderColor,
          borderRadius: 'var(--rounded-btn)',
          boxShadow: 'none',
          ':hover': {
            borderColor: borderColor,
          },
        }),
        indicatorSeparator: (baseStyles) => ({
          ...baseStyles,
          background: foregroundColor,
        }),
        input: (baseStyles) => ({
          ...baseStyles,
          color: 'inherit',
        }),
        menu: (baseStyles) => ({
          ...baseStyles,
          background: backgroundColor,
        }),
        option: (baseStyles, state) => ({
          ...baseStyles,
          background: state.isSelected ? foregroundColor : 'transparent',
          ':hover': {
            background: foregroundColor,
          },
        }),
        singleValue: (baseStyles) => ({
          ...baseStyles,
          color: 'inherit',
        }),
      }}
      {...props}
    />
  );
}
