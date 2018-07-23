// @flow
import { ipcRenderer } from 'electron';
import React, { Component, Fragment } from 'react';
import { Form, Text } from 'informed';
import { random, startCase } from 'lodash';
import cuid from 'cuid';
import Ratings from 'react-ratings-declarative';
import styles from '../new-career.scss';
import userImage from './user.png';


const validate = value => (
  value.length > 1 ? null : ''
);

const SkillTemplates = [
  { name: 'Easy', value: 0.5 },
  { name: 'Fair', value: 1 },
  { name: 'Normal', value: 1.5 },
  { name: 'Tough', value: 2.0 },
  { name: 'Hard', value: 2.5 },
  { name: 'Very Hard', value: 3 },
  { name: 'Expert', value: 3.5 },
  { name: 'Elite', value: 4 }
];

type SquadState = {
  search: string
};

class SquadInformation extends Component<{}, SquadState> {
  state = {
    search: ''
  };

  static animals = ipcRenderer.sendSync( 'adjective-animal', 100 )
    .map( item => ({
      username: startCase( item ).replace( '-', ' ' ),
      skillTemplate: SkillTemplates[ random( 0, 1 ) ],
      transferValue: 'Free Agent',
      weaponTemplate: random( 5 ) > 4 ? 'Sniper' : 'Rifle'
    }) );

  renderTableBody = () => (
    <Fragment>
      {SquadInformation.animals.filter( value => (
        value.username.toLowerCase().includes( this.state.search.toLowerCase() )
      ) ).map( ( item: Object, index: number ) => (
        <div key={index} className={styles.row}>
          <div className={styles.cell}>
            <div className={styles.avatar}>
              <img src={userImage} alt={'User'} />
            </div>
            <div className={styles.title}>
              {item.username}
            </div>
            <div className={styles.subtitle}>
              {'Playstyle: '}
              {item.weaponTemplate}
            </div>
          </div>
          <div className={styles.cell}>
            <Ratings
              rating={item.skillTemplate.value}
              widgetDimensions={'16px'}
              widgetRatedColors={'salmon'}
            >
              {Array.from( Array( 5 ) ).map( () => (
                <Ratings.Widget key={cuid()} />
              ) )}
            </Ratings>
          </div>
          <div className={styles.cell}>
            {item.transferValue}
          </div>
        </div>
      ) )}
    </Fragment>
  );

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
              <div className={styles.table}>
                <div className={styles.thead}>
                  <div className={styles.cell}>
                    {'Name'}
                  </div>
                  <div className={styles.cell}>
                    {'Skill Level'}
                  </div>
                  <div className={styles.cell}>
                    {'Transfer Value'}
                  </div>
                </div>

                <div className={styles.tbody}>
                  {this.renderTableBody()}
                </div>
              </div>
            </section>
          </Fragment>
        )}
      </Form>
    );
  }
}

export default SquadInformation;