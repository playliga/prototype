// @flow
import React from 'react';

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
    <h1 style={{ color: 'red' }}>{'Hi'}</h1>
  </section>
);

export default NewCareer;