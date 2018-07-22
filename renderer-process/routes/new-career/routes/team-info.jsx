import React, { Fragment } from 'react';
import { Form, Text } from 'informed';
import styles from '../new-career.scss';


const validate = value => (
  value.length > 1 ? null : ''
);

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

export default TeamInformation;