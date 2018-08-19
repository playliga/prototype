import React, { Fragment } from 'react';
import { Form, Text, asField } from 'informed';
import Select from 'react-select';
import styles from '../new-career.scss';
import CountriesContext from '../countries-context';


const validate = value => (
  value.length > 1 ? null : ''
);

const validateSelect = value => (
  !Array.isArray( value ) ? null : ''
);

const InformedSelect = asField( ({ ...props }) => (
  <Select {...props} />
) );

const Content = ( props ) => {
  const options = props.countries.map( country => ({
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
        {({ formState, formApi }) => (
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
              <InformedSelect
                field="country"
                options={options}
                className={'react-select-container'}
                classNamePrefix={'react-select'}
                validateOnChange
                validate={validateSelect}
                onChange={option => formApi.setValue( 'country', option )}
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
        history={props.history}
        countries={countries}
      />
    )}
  </CountriesContext.Consumer>
);

export default PlayerInformation;