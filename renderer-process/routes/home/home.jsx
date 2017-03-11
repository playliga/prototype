import React, { Component } from 'react';
import styles from './home.scss';

import splash1 from 'assets/images/home-splash-1.jpg'; // eslint-disable-line
import splash2 from 'assets/images/home-splash-2.jpg'; // eslint-disable-line

const SplashImages = {
  splash1,
  splash2
};

type State = {
  activeImage: any
};

export default class Home extends Component {
  state: State

  state = {
    activeImage: null
  }

  handleOnMouseOver = ( imgId: string ) => {
    this.setState({ activeImage: SplashImages[imgId] });
  }

  handleOnMouseLeave = () => {
    this.setState({ activeImage: false });
  }

  render() {
    return (
      <div className={styles.container}>
        <section className={styles.navContainer}>
          <div
            className={styles.navItem}
            onMouseOver={() => this.handleOnMouseOver( 'splash1' )}
            onMouseLeave={() => this.handleOnMouseLeave()}
          >
            {'Start a new career'}
            <span className={styles.navItemBorder} />
          </div>

          <div
            className={styles.navItem}
            onMouseOver={() => this.handleOnMouseOver( 'splash2' )}
            onMouseLeave={() => this.handleOnMouseLeave()}
          >
            {'Load a career'}
            <span className={styles.navItemBorder} />
          </div>

          <div className={styles.navItem}>
            {'Settings'}
            <span className={styles.navItemBorder} />
          </div>
        </section>

        {this.state.activeImage && <section
          className={styles.splashContainer}
          style={{ backgroundImage: `url(${this.state.activeImage})` }}
        />}

        {!this.state.activeImage &&
          <section className={styles.splashContainerDefault}>
            <h1>{'Es la liga!'}</h1>
            <h2>{'What would you like to do?'}</h2>
          </section>
        }
      </div>
    );
  }
}
