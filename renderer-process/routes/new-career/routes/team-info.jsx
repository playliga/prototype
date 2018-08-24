import React, { Fragment } from 'react';
import { Form, Text, asField } from 'informed';
import Select from 'react-select';
import styles from '../new-career.scss';
import ContinentsContext from '../continents-context';


const validate = value => (
  value.length > 1 ? null : ''
);

const validateSelect = value => (
  !Array.isArray( value ) ? null : ''
);

const InformedSelect = asField( ({ ...props }) => (
  <Select {...props} />
) );

const Content = ({ history, continents }) => {
  let options = [];

  options = continents.map( continent => ({
    label: continent.name,
    options: continent.Countries.map( country => ({
      label: `${country.emoji} ${country.name}`,
      value: country.id
    }) )
  }) );

  return (
    <section className={styles.container}>
      <Form
        id="team"
        className={styles.content}
      >
        {({ formState, formApi }) => (
          <Fragment>
            <h2 className={styles.subtitle}>
              {'Team Information'}
            </h2>

            <div className={styles.fieldSet}>
              <Text
                field="tname"
                id="tname"
                placeholder="Name"
                validateOnChange
                validate={validate}
              />
            </div>

            <div className={styles.fieldSet}>
              <Text
                field="tag"
                id="tag"
                placeholder="Tag"
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
                || Object.keys( formState.values ).length !== 3
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

const TeamInformation = props => (
  <ContinentsContext.Consumer>
    {continents => (
      <Content
        history={props.history}
        continents={continents}
      />
    )}
  </ContinentsContext.Consumer>
);

export default TeamInformation;