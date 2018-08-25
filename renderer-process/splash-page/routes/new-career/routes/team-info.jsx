import React, { Fragment } from 'react';
import { Form, Text } from 'informed';
import { validate, validateSelect } from 'splash-page/utils';
import { InformedSelect } from 'splash-page/components';

import styles from '../new-career.scss';
import ContinentsContext from '../continents-context';


const Content = ({ history, continents, onSubmit }) => {
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
        onSubmit={( values ) => {
          onSubmit( values );
        }}
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
                placeholder={'Choose country'}
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
              {'Finish'}
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
        {...props}
        continents={continents}
      />
    )}
  </ContinentsContext.Consumer>
);

export default TeamInformation;