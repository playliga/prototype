import React from 'react';
import styles from './home.scss';

const Home = () => (
  <div className={styles.container}>
    <section className={styles.navContainer}>
      <div className={styles.navItem}>
        {'Start a new career'}
        <span className={styles.navItemBorder} />
      </div>

      <div className={styles.navItem}>
        {'Load a career'}
        <span className={styles.navItemBorder} />
      </div>

      <div className={styles.navItem}>
        {'Settings'}
        <span className={styles.navItemBorder} />
      </div>
    </section>
  </div>
);

export default Home;
