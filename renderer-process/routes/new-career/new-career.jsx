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
        <label htmlFor="fname">{'First Name'}</label>
        <Text field="fname" id="fname" />

        <label htmlFor="lname">{'Last Name'}</label>
        <Text field="lname" id="lname" />

        <label htmlFor="alias">{'Alias'}</label>
        <Text field="alias" id="alias" />

        <label htmlFor="country">{'Country'}</label>
        <Text field="country" id="country" />

        <button type="submit">
          {'Submit'}
        </button>
      </Form>
    </section>
  </section>
);

export default NewCareer;