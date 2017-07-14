import React, { Component } from 'react';
import styles from './home.scss';

export default class Home extends Component {
  render() {
    return (
      <div className={styles.container}>
        {[ 'New Career', 'Load Career' ].map( ( item, i ) => {
          const menuImage = require( `assets/images/home-splash-${i}.jpg` ); // eslint-disable-line

          return (
            <div
              key={i}
              className={styles.item}
              style={{ backgroundImage: `url(${menuImage})` }}
            >
              {/* TODO */}
            </div>
          );
        })}
      </div>
    );
  }
}
