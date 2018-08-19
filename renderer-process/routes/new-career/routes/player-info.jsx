import React, { Fragment } from 'react';
import { Form, Text } from 'informed';
import Select from 'react-select';
import styles from '../new-career.scss';
import CountriesContext from '../countries-context';


const validate = value => (
  value.length > 1 ? null : ''
);

const Content = ( props ) => {
  const options = Array.from( props.countries, country => ({
    label: country.name,
    value: country.id
  }) );

  return (
    <section className={styles.container}>
      <Form
        id="player"
        className={styles.content}
        onSubmit={() => props.history.push( '/new-career/team', { title: 'New Career' })}
      >
        {({ formState }) => (
          <Fragment>
            <h2 className={styles.subtitle}>
              {'Player Information'}
            </h2>

            <div className={styles.fieldSet}>
              <Text
                field="fname"
                id="fname"
                placeholder="First name"
                validateOnChange
                validate={validate}
              />
            </div>

            <div className={styles.fieldSet}>
              <Text
                field="lname"
                id="lname"
                placeholder="Last name"
                validateOnChange
                validate={validate}
              />
            </div>

            <div className={styles.fieldSet}>
              <Text
                field="alias"
                id="alias"
                placeholder="Alias"
                validateOnChange
                validate={validate}
              />
            </div>

            <div className={styles.fieldSet}>
              <Text
                field="country"
                id="country"
                placeholder="Country"
                validateOnChange
                validate={validate}
              />
            </div>

            <div className={styles.fieldSet}>
              <Select
                options={options}
                className={'react-select-container'}
                classNamePrefix={'react-select'}
              />
            </div>

            <button
              type="submit"
              className={styles.submit}
              disabled={
                formState.invalid
                || formState.pristine
                || Object.keys( formState.values ).length !== 4
              }
            >
              {'Submit'}
            </button>
          </Fragment>
        )}
      </Form>
    </section>
  );
};

const PlayerInformation = props => (
  <CountriesContext.Consumer>
    {countries => (
      <Content
        router={props.router}
        countries={countries}
      />
    )}
  </CountriesContext.Consumer>
);

export default PlayerInformation;