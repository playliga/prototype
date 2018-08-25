// @flow
import React, { Component } from 'react';
import { AnimatedLink } from 'components';
import styles from './home.scss';


type Props = {
  history: Object
};

type LinkItem = {
  title: string,
  to: string,
  label: string
};

class Home extends Component<Props> {
  props: Props;

  links: Array<LinkItem> = [
    { title: 'New Career', to: '/new-career', label: 'New Career' },
    { title: 'Load Career', to: '/load-career', label: 'Load Career' },
    { title: 'Settings', to: '/settings', label: 'Settings' }
  ]

  render() {
    return (
      <section className={styles.container}>
        <section className={styles.content}>
          <h1 className={styles.title}>
            {'La Liga'}
          </h1>
          <nav>
            {this.links.map( ( item: LinkItem, index: number ) => (
              <AnimatedLink
                key={index}
                delay={1000}
                animationType={'blink'}
                onClick={() => this.props.history.push( item.to, { title: item.title })}
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