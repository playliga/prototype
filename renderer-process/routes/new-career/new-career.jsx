// @flow
import React, { Fragment } from 'react';
import { Form, Text } from 'informed';
import styles from './new-career.scss';


const validate = value => (
  value.length > 1 ? null : ''
);

/**
 * This route will have nested routes which will represent the
 * three forms:
 *
 * - User information
 * - Team information
 * - Starting V (technically 4 because user is included)
 */
const NewCareer = () => (
  <section className={styles.container}>
    <section className={styles.content}>
      <h1 className={styles.title}>
        {'New Career'}
      </h1>

      <Form id="player">
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
  </section>
);

export default NewCareer;