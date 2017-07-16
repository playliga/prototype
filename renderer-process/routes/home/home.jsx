import React, { Component } from 'react';
import styles from './home.scss';

type State = {
  activeItem: number | null
}

export default class Home extends Component {
  state: State

  state = {
    activeItem: null
  }

  render() {
    const { activeItem } = this.state;

    return (
      <div className={styles.container}>
        <div
          className={`${styles.closeIconContainer} ${activeItem !== null ? styles.closeIconActive : ''}`}
          onClick={() => this.setState({ activeItem: null })}
        >
          <span />
          <span />
        </div>

        {[ 'New Career', 'Load Career' ].map( ( item, i ) => {
          const menuImage = require( `assets/images/home-splash-${i}.jpg` ); // eslint-disable-line
          const activeStyle = ( activeItem !== null && activeItem === i ) || activeItem === null ?
            styles.active : styles.inactive;

          return (
            <div
              key={i}
              className={`${styles.item} ${activeStyle}`}
              style={{ backgroundImage: `url(${menuImage})` }}
              onClick={() => this.setState({ activeItem: i })}
            >
              <h1>{item}</h1>
            </div>
          );
        })}
      </div>
    );
  }
}
