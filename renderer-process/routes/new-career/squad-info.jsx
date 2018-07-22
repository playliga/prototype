// @flow
import { ipcRenderer } from 'electron';
import React, { Component, Fragment } from 'react';
import { Form, Text } from 'informed';
import styles from './common.scss';


const validate = value => (
  value.length > 1 ? null : ''
);

type SquadState = {
  search: string
};

export default class Squad extends Component<{}, SquadState> {
  state = {
    search: ''
  };

  static animals = ipcRenderer.sendSync( 'adjective-animal' );

  render() {
    return (
      <Form
        id="squad"
        className={styles.container}
        onValueChange={search => this.setState({ ...search })}
      >
        {({ formState }) => (
          <Fragment>
            <section className={styles.content}>
              <h2 className={styles.subtitle}>
                {'Squad'}
              </h2>

              <div className={styles.fieldSet}>
                <Text
                  field="search"
                  id="search"
                  placeholder={'Search'}
                  value={this.state.search}
                  validateOnChange
                  validate={validate}
                />
              </div>
            </section>

            <section className={styles.wideContent}>
              <section className={styles.listContainer}>
                {Squad.animals
                  .filter( value => value.toLowerCase().includes( this.state.search.toLowerCase() ) )
                  .map( ( item: string, index: number ) => (
                    <div key={index}>
                      <span>{item}</span>
                    </div>
                  ) )
                }
              </section>
            </section>
          </Fragment>
        )}
      </Form>
    );
  }
}