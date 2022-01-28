import React from 'react';
import Application from 'main/constants/application';
import IpcService from 'renderer/lib/ipc-service';
import PlayerCard from 'renderer/screens/main/components/player-card';
import { Button, Card, Col, Row, Space, Spin, Typography } from 'antd';
import { CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { shuffle } from 'lodash';
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
const NUM_PLAYERS = 6;


// typings
interface Props {
  onSubmit: Function;
  formdata: any[];
}


/**
 * HELPER FUNCTIONS
 */

function handleOnClickPlayer( existing: any[], player: any ) {
  const found = existing.some( p => p.id === player.id );

  if( found ) {
    return existing.filter( p => p.id !== player.id );
  }

  return [ ...existing, player ];
}


function handleAutoSelect( existing: any[], players: any[] ) {
  if( existing.length === Application.SQUAD_MIN_LENGTH ) {
    return existing;
  }

  const eligible = players.filter( p => !existing.some( e => e.id === p.id ) );
  const needed = Application.SQUAD_MIN_LENGTH - existing.length;
  return [ ...existing, ...shuffle( eligible ).slice( 0, needed ) ];
}


/**
 * Main Component
 */

function Three( props: Props ) {
  const [ , teaminfo ] = props.formdata;
  const [ freeagents, setFreeAgents ] = React.useState<any[]>( null );
  const [ squad, setSquad ] = React.useState<any[]>( [] );
  const [ fetching, setFetching ] = React.useState( false );

  const getFreeAgents = () => {
    setFetching( true );
    IpcService
      .send( IPCRouting.Database.PROFILE_SQUAD_FREE_AGENTS, { params: { country: teaminfo.country, limit: NUM_PLAYERS } })
      .then( data => { setFreeAgents( data ); setFetching( false ); })
    ;
  };

  React.useEffect( () => {
    // wait for route transition to finish before
    // fetching the data to reduce jarring animations
    snooze( 1000 ).then( getFreeAgents );
  }, []);

  return (
    <section id="squadselect" className="content">
      <h1>{'Squad Information'}</h1>
      <p>{`Pick your ${Application.SQUAD_MIN_LENGTH} teammates from the list of free agents.`}</p>
      <Space direction="horizontal">
        {Array.from( Array( Application.SQUAD_MIN_LENGTH ) ).map( ( _, idx ) => {
          const item = squad[ idx ];
          return (
            <Card
              key={idx}
              bordered={!!item}
              className={!item && 'empty'}
              actions={!!item && [
                <CloseCircleOutlined
                  key={item.id}
                  onClick={() => setSquad( handleOnClickPlayer( squad, item ) )}
                />
              ]}
            >
              {item
                ? <Typography.Text ellipsis><span className={`fp ${item.Country.code.toLowerCase()}`} /> {item.alias}</Typography.Text>
                : <PlusOutlined />
              }
            </Card>
          );
        })}
      </Space>
      <article>
        <Button
          block
          type="primary"
          className="content-small content-center"
          disabled={squad.length < Application.SQUAD_MIN_LENGTH}
          onClick={() => props.onSubmit( squad, 'finish' )}
        >
          {'Next'}
        </Button>
      </article>
      <Row gutter={[ GUTTER_H, GUTTER_V ]}>
        <Col span={GRID_COL_WIDTH}>
          <Button
            block
            disabled={squad.length === Application.SQUAD_MIN_LENGTH}
            onClick={() => setSquad( handleAutoSelect( squad, freeagents ) )}
          >
            {'Automatically select'}
          </Button>
        </Col>
        <Col span={GRID_COL_WIDTH_SMALL}>
          <Button block onClick={getFreeAgents}>
            {'Randomize'}
          </Button>
        </Col>
      </Row>
      <Row gutter={[ GUTTER_H, GUTTER_V ]}>
        {( !freeagents || fetching ) && (
          <Col span={GRID_COL_WIDTH} offset={GRID_COL_WIDTH}>
            <Spin size="large" />
          </Col>
        )}
        {( !!freeagents && !fetching ) && freeagents.map( player => {
          const selected = squad.some( p => p.id === player.id );
          return (
            <Col key={player.id} span={GRID_COL_WIDTH}>
              <PlayerCard
                disableManagerActions
                player={player}
                disabled={selected || squad.length === Application.SQUAD_MIN_LENGTH}
                selected={selected}
                onClick={( player: any ) => setSquad( handleOnClickPlayer( squad, player ) )}
              />
            </Col>
          );
        })}
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
