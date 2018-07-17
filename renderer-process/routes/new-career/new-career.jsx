// @flow
import React from 'react';
import { Form, Text } from 'informed';
import styles from './new-career.scss';


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
        <h2 className={styles.subtitle}>
          {'Player Information'}
        </h2>

        <div className={styles.fieldSet}>
          <Text field="fname" id="fname" placeholder="First name" />
        </div>

        <div className={styles.fieldSet}>
          <Text field="lname" id="lname" placeholder="Last name" />
        </div>

        <div className={styles.fieldSet}>
          <Text field="alias" id="alias" placeholder="Alias" />
        </div>

        <div className={styles.fieldSet}>
          <Text field="country" id="country" placeholder="Country" />
        </div>

        <button type="submit" className={styles.submit}>
          {'Submit'}
        </button>
      </Form>
    </section>
  </section>
);

export default NewCareer;