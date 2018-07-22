import React, { Fragment } from 'react';
import { Form, Text } from 'informed';
import styles from './common.scss';


const validate = value => (
  value.length > 1 ? null : ''
);

const PlayerInformation = props => (
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

export default PlayerInformation;