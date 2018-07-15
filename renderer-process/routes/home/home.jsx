// @flow
import React, { Component } from 'react';
import { AnimatedLink } from 'components';
import styles from './home.scss';


type Props = {
  history: Object
};

type LinkItem = {
  to: string,
  label: string
};

class Home extends Component<Props> {
  props: Props;

  links: Array<LinkItem> = [
    { to: '/new-career', label: 'New Career' },
    { to: '/load-career', label: 'Load Career' },
    { to: '/settings', label: 'Settings' }
  ]

  render() {
    return (
      <section className={styles.container}>
        <section className={styles.content}>
          <h1>{'La Liga'}</h1>
          <nav>
            {this.links.map( ( item: LinkItem, index: number ) => (
              <AnimatedLink
                key={index}
                delay={1000}
                animationType={'blink'}
                onClick={() => this.props.history.push( item.to )}
              >
                {item.label}
              </AnimatedLink>
            ) )}
          </nav>
        </section>
      </section>
    );
  }
}

export default Home;