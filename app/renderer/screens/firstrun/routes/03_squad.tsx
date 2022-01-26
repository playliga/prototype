import React from 'react';
import Application from 'main/constants/application';
import IpcService from 'renderer/lib/ipc-service';
import PlayerCard from 'renderer/screens/main/components/player-card';
import { Button, Col, Row, Spin } from 'antd';
import { snooze } from 'shared/util';
import { FormContext } from '../common';
import * as IPCRouting from 'shared/ipc-routing';


/**
 * Module constants, variables, and typings
 */

// constants
const GUTTER_H = 8;
const GUTTER_V = 8;
const GRID_COL_WIDTH = 8;
const GRID_COL_WIDTH_SMALL = GRID_COL_WIDTH - 4;
const NUM_PLAYERS_PER_ROW = 4;
const NUM_PLAYERS = 3 * NUM_PLAYERS_PER_ROW;


// typings
interface Props {
  onSubmit: Function;
  formdata: any[];
}


/**
 * Main Component
 */

function Three( props: Props ) {
  const [ , teaminfo ] = props.formdata;
  const [ freeagents, setFreeAgents ] = React.useState<any[]>( null );
  const [ squad, setSquad ] = React.useState<any[]>( [] );

  React.useEffect( () => {
    const params = {
      country: teaminfo.country,
      limit: NUM_PLAYERS
    };

    // wait for route transition to finish before
    // fetching the data to reduce jarring animations
    snooze( 1000 )
      .then( () => IpcService.send( IPCRouting.Database.PROFILE_SQUAD_FREE_AGENTS, { params }))
      .then( data => setFreeAgents( data ) )
    ;
  }, []);

  return (
    <section id="squadselect" className="content">
      <h1>{'Squad Information'}</h1>
      <p>{'Pick your squad from this list of free agents.'}</p>
      <article>
        <Button
          block
          type="primary"
          className="content-small content-center"
          disabled={squad.length < Application.SQUAD_MIN_LENGTH}
          onClick={() => props.onSubmit( null, 'finish' )}
        >
          {'Next'}
        </Button>
      </article>
      <Row gutter={[ GUTTER_H, GUTTER_V ]}>
        <Col span={GRID_COL_WIDTH}>
          <Button block>{'Automatically select'}</Button>
        </Col>
        <Col span={GRID_COL_WIDTH_SMALL}>
          <Button block>{'Randomize'}</Button>
        </Col>
      </Row>
      <Row gutter={[ GUTTER_H, GUTTER_V ]}>
        {!freeagents && (
          <Col span={GRID_COL_WIDTH} offset={GRID_COL_WIDTH}>
            <Spin size="large" />
          </Col>
        )}
        {!!freeagents && freeagents.map( player => (
          <Col key={player.id} span={GRID_COL_WIDTH}>
            <PlayerCard
              disableManagerActions
              player={player}
              selected={squad.includes( player.id )}
              onClick={( player: any ) => setSquad([ ...squad, player.id ])}
            />
          </Col>
        ))}
      </Row>
    </section>
  );
}


export default ( props: Props ) => (
  <FormContext.Consumer>
    {formdata => (
      <Three
        {...props}
        {...formdata}
      />
    )}
  </FormContext.Consumer>
);
