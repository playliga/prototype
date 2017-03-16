import React, { Component } from 'react';
import styles from './home.scss';

const SplashImages = {
  default: require( 'assets/images/home-splash-default.jpg' ), // eslint-disable-line
  splash0: require( 'assets/images/home-splash-0.jpg' ), // eslint-disable-line
  splash1: require( 'assets/images/home-splash-1.jpg' ), // eslint-disable-line
  splash2: require( 'assets/images/home-splash-2.jpg' ) // eslint-disable-line
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
        {[
          'Start a new career',
          'Load a career',
          'Settings'
        ].map( ( item: string, i: number ) => (
          <div
            key={i}
            className={styles.navItem}
            onMouseOver={() => this.handleOnMouseOver( `splash${i}` )}
            onMouseLeave={() => this.handleOnMouseLeave()}
          >
            <span>{item}</span>
            <span className={styles.navItemBorderTop} />
            <span className={styles.navItemBorderBottom} />
          </div>
        ))}
      </div>
    );
  }
}
