import React, { Component } from 'react';
import styles from './home.scss';

const SplashImages = {
  default: require( 'assets/images/home-splash-default.jpg' ), // eslint-disable-line
  splash1: require( 'assets/images/home-splash-1.jpg' ), // eslint-disable-line
  splash2: require( 'assets/images/home-splash-2.jpg' ), // eslint-disable-line
  splash3: require( 'assets/images/home-splash-3.jpg' ) // eslint-disable-line
};

type State = {
  activeImage: any
};

export default class Home extends Component {
  state: State

  state = {
    activeImage: SplashImages.default
  }

  handleOnMouseOver = ( imgId: string ) => {
    this.setState({ activeImage: SplashImages[imgId] });
  }

  handleOnMouseLeave = () => {
    this.setState({ activeImage: SplashImages.default });
  }

  render() {
    return (
      <div
        className={styles.container}
        style={{ backgroundImage: `url(${this.state.activeImage})` }}
      >
        <div
          className={styles.navItem}
          onMouseOver={() => this.handleOnMouseOver( 'splash1' )}
          onMouseLeave={() => this.handleOnMouseLeave()}
        >
          <span>{'Start a new career'}</span>
          <span className={styles.navItemBorderTop} />
          <span className={styles.navItemBorderBottom} />
        </div>

        <div
          className={styles.navItem}
          onMouseOver={() => this.handleOnMouseOver( 'splash2' )}
          onMouseLeave={() => this.handleOnMouseLeave()}
        >
          <span>{'Load a career'}</span>
          <span className={styles.navItemBorderTop} />
          <span className={styles.navItemBorderBottom} />
        </div>

        <div
          className={styles.navItem}
          onMouseOver={() => this.handleOnMouseOver( 'splash3' )}
          onMouseLeave={() => this.handleOnMouseLeave()}
        >
          <span>{'Settings'}</span>
          <span className={styles.navItemBorderTop} />
          <span className={styles.navItemBorderBottom} />
        </div>
      </div>
    );
  }
}
