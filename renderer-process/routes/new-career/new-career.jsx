// @flow
import React, { Fragment } from 'react';
import { Route } from 'react-router-dom';
import { Form, Text } from 'informed';
import styles from './new-career.scss';


const validate = value => (
  value.length > 1 ? null : ''
);

/**
 * This route will have nested routes which will represent the
 * three forms:
 *
 * - User information
 * - Team information
 * - Starting V (technically 4 because user is included)
 */
const Squad = () => (
  <h2 className={styles.subtitle}>
    {'Squad'}
  </h2>
);

const TeamInformation = props => (
  <Form
    id="team"
    onSubmit={() => props.history.push( '/new-career/squad' )}
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
);


const PlayerInformation = props => (
  <Form
    id="player"
    onSubmit={() => props.history.push( '/new-career/team' )}
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
);

const NewCareer = () => (
  <section className={styles.container}>
    <section className={styles.content}>
      <h1 className={styles.title}>
        {'New Career'}
      </h1>

      <Route exact path="/new-career" component={PlayerInformation} />
      <Route exact path="/new-career/team" component={TeamInformation} />
      <Route exact path="/new-career/squad" component={Squad} />
    </section>
  </section>
);

export default NewCareer;