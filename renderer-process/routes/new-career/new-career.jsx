// @flow
import { ipcRenderer } from 'electron';
import React, { Component, Fragment } from 'react';
import { Route } from 'react-router-dom';
import { Form, Text } from 'informed';
import styles from './new-career.scss';


const validate = value => (
  value.length > 1 ? null : ''
);

/**
 * This route will have nested routes which represent the
 * three forms:
 *
 * - User information
 * - Team information
 * - Starting V (technically 4 because user is included)
 */
type SquadState = {
  search: string
};

class Squad extends Component<{}, SquadState> {
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

const TeamInformation = props => (
  <section className={styles.container}>
    <Form
      id="team"
      className={styles.content}
      onSubmit={() => props.history.push( '/new-career/squad', { title: 'New Career' })}
    >
      {({ formState }) => (
        <Fragment>
          <h2 className={styles.subtitle}>
            {'Team Information'}
          </h2>

          <div className={styles.fieldSet}>
            <Text
              field="tname"
              id="tname"
              placeholder="Name"
              validateOnChange
              validate={validate}
            />
          </div>

          <div className={styles.fieldSet}>
            <Text
              field="tag"
              id="tag"
              placeholder="Tag"
              validateOnChange
              validate={validate}
            />
          </div>

          <div className={styles.fieldSet}>
            <Text
              field="country"
              id="country"
              placeholder="Country"
              validateOnChange
              validate={validate}
            />
          </div>

          <button
            type="submit"
            className={styles.submit}
            disabled={
              formState.invalid
              || formState.pristine
              || Object.keys( formState.values ).length !== 3
            }
          >
            {'Submit'}
          </button>
        </Fragment>
      )}
    </Form>
  </section>
);


const PlayerInformation = props => (
  <section className={styles.container}>
    <Form
      id="player"
      className={styles.content}
      onSubmit={() => props.history.push( '/new-career/team', { title: 'New Career' })}
    >
      {({ formState }) => (
        <Fragment>
          <h2 className={styles.subtitle}>
            {'Player Information'}
          </h2>

          <div className={styles.fieldSet}>
            <Text
              field="fname"
              id="fname"
              placeholder="First name"
              validateOnChange
              validate={validate}
            />
          </div>

          <div className={styles.fieldSet}>
            <Text
              field="lname"
              id="lname"
              placeholder="Last name"
              validateOnChange
              validate={validate}
            />
          </div>

          <div className={styles.fieldSet}>
            <Text
              field="alias"
              id="alias"
              placeholder="Alias"
              validateOnChange
              validate={validate}
            />
          </div>

          <div className={styles.fieldSet}>
            <Text
              field="country"
              id="country"
              placeholder="Country"
              validateOnChange
              validate={validate}
            />
          </div>

          <button
            type="submit"
            className={styles.submit}
            disabled={
              formState.invalid
              || formState.pristine
              || Object.keys( formState.values ).length !== 4
            }
          >
            {'Submit'}
          </button>
        </Fragment>
      )}
    </Form>
  </section>
);

const NewCareer = () => (
  <Fragment>
    <Route exact path="/new-career" component={PlayerInformation} />
    <Route exact path="/new-career/team" component={TeamInformation} />
    <Route exact path="/new-career/squad" component={Squad} />
  </Fragment>
);

export default NewCareer;