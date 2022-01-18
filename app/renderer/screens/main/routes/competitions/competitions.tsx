import React from 'react';
import IpcService from 'renderer/lib/ipc-service';
import Application from 'main/constants/application';
import Connector from 'renderer/screens/main/components/connector';
import Standings from 'renderer/screens/main/components/standings';
import MatchResults from 'renderer/screens/main/components/match-results';
import * as IPCRouting from 'shared/ipc-routing';
import * as profileActions from 'renderer/screens/main/redux/profile/actions';
import * as MainScreenTypes from 'renderer/screens/main/types';
import { RouteComponentProps } from 'react-router';
import { Spin, Tabs, Typography, Select, Col, Row, Alert, Button } from 'antd';
import { parseCompType, parseCupRound } from 'shared/util';
import { CompTypePrettyNames } from 'shared/enums';
import { getLetter } from 'renderer/lib/util';


/**
 * Constants, variables, and types
 */

const GUTTER_H = 8;
const GUTTER_V = 8;
const GRID_COL_WIDTH = 8;
const NUM_STANDINGS = 10;
const NUM_CUP_MATCHES = 10;


interface MainComponentProps extends MainScreenTypes.ApplicationState, RouteComponentProps {
  dispatch: Function;
}


interface CompetitionTypeProps extends MainScreenTypes.CompTypeResponse {
  joining: boolean;
  onTeamClick: ( id: number ) => void;
  onJoin: ( id: number ) => void;
  team: any;
  teamCompetitions: any;
}


/**
 * Utility Components
 */

function TierSelector( props: { placeholder: string; onChange?: any; defaultValue: string; tiers: string[] }) {
  const { Option } = Select;

  return (
    <Select
      placeholder={props.placeholder}
      onChange={props?.onChange}
      defaultValue={props.defaultValue}
    >
      {props.tiers.map( ( tier: string ) => (
        <Option key={tier} value={tier}>
          {tier}
        </Option>
      ))}
    </Select>
  );
}


function JoinCompetitionComponent( props: CompetitionTypeProps & { competition: MainScreenTypes.BaseCompetition }) {
  // bail early if it has already started
  if( props.competition.started ) {
    return null;
  }

  // can the player join this competition?
  const nosquad = props.team.Players.length < Application.SQUAD_MIN_LENGTH;
  const joined = props.teamCompetitions.some( ( c: any ) => c.id === props.competition.id );

  return (
    <article style={{ width: '33%' }}>
      <p><em>{'Not started.'}</em></p>
      {nosquad && props.competition.regionId === props.team.Country.ContinentId && props.competition.isOpen && (
        <Alert
          type="warning"
          message="You don't have enough players in your squad to join."
        />
      )}
      {!nosquad && props.competition.regionId === props.team.Country.ContinentId && props.competition.isOpen && (
        <Button
          block
          type="primary"
          disabled={props.joining || joined || nosquad}
          onClick={() => props.onJoin( props.competition.id )}
        >
          {props.joining
            ? <Spin size="small" />
            : joined ? 'Joined' : 'Join'
          }
        </Button>
      )}
    </article>
  );
}


/**
 * Competition-related Components
 */

function CompetitionTypeLeague( props: CompetitionTypeProps & { competition: MainScreenTypes.LeagueResponse }) {
  // grab default filter value
  const [ defaultFilter ] = props.competition.started
    ? props.competition.divisions
    : [ null ]
  ;

  // track the state of our tier filter
  const [ filter, setFilter ] = React.useState( defaultFilter?.name );

  return (
    <section>
      <Typography.Title ellipsis level={2}>
        {props.competition.name}
        {props.competition.regioncode ? ': ' + props.competition.regioncode : ''}
      </Typography.Title>
      <JoinCompetitionComponent {...props} />
      {props.competition.started && (
        <TierSelector
          placeholder="Choose a division"
          tiers={props.competition.divisions.map( division => division.name )}
          onChange={( value: string ) => setFilter( value )}
          defaultValue={filter}
        />
      )}
      {props.competition.started && props.competition.divisions
        .filter( division => division.name === filter )
        .map( division => (
          <article key={props.competition.id + division.name}>
            <Row gutter={[ GUTTER_H, GUTTER_V ]}>
              {division.conferences.map( ( conference, idx ) => (
                <Col key={props.competition.id + division.name + idx} span={GRID_COL_WIDTH}>
                  {'standings' in conference && (
                    <Standings
                      pageSize={NUM_STANDINGS}
                      title={division.name + ( division.conferences.length > 1 ? ` | Conference ${getLetter( idx+1 )}` : '' )}
                      dataSource={conference.standings.map( ( s: any ) => ({
                        id: s.competitorInfo.id,
                        name: s.competitorInfo.name,
                        ...s,
                      }))}
                      onClick={props.onTeamClick}
                    />
                  )}
                  {'round' in conference && (
                    <MatchResults
                      sliceData={NUM_CUP_MATCHES}
                      title={parseCupRound( conference.round ) + ( division.conferences.length > 1 ? ` | Conference ${getLetter( idx+1 )}` : '' )}
                      dataSource={conference.round}
                      onClick={props.onTeamClick}
                    />
                  )}
                </Col>
              ))}
            </Row>
          </article>
        ))
      }
    </section>
  );
}


function CompetitionTypeCup( props: CompetitionTypeProps & { competition: MainScreenTypes.CupResponse }) {
  // util function to filter out unplayed rounds
  const skipUnplayed = ( round: any ) => {
    return round.every( ( match: any ) => match.team1.id || match.team2.id );
  };

  // grab the rounds
  const [ cupdata ] = props.competition?.data || [];
  const rounds = cupdata?.rounds?.filter( skipUnplayed ) || [];

  // track the state of our tier filter
  const defaultFilter = props.competition.started
    ? parseCupRound( rounds[ 0 ] )
    : null
  ;
  const [ filter, setFilter ] = React.useState( defaultFilter );

  // render jsx
  return (
    <section>
      <Typography.Title ellipsis level={2}>
        {props.competition.name}
        {props.competition.regioncode ? ': ' + props.competition.regioncode : ''}
      </Typography.Title>
      <JoinCompetitionComponent {...props} />
      {props.competition.started && (
        <TierSelector
          placeholder="Choose a cup round"
          tiers={rounds.map( parseCupRound )}
          onChange={( value: string ) => setFilter( value )}
          defaultValue={filter}
        />
      )}
      {props.competition.started && (
        <article>
          <Row gutter={[ GUTTER_H, GUTTER_V ]}>
            {rounds
              .filter( ( round: any ) => parseCupRound( round ) === filter )
              .map( ( round: any ) => (
                <Col key={props.competition.id + JSON.stringify( round )} span={GRID_COL_WIDTH}>
                  <MatchResults
                    pageSize={NUM_CUP_MATCHES}
                    title={parseCupRound( round )}
                    dataSource={round}
                    onClick={props.onTeamClick}
                  />
                </Col>
              ))
            }
          </Row>
        </article>
      )}
    </section>
  );
}


function CompetitionTypeGlobalCircuit( props: CompetitionTypeProps & { competition: MainScreenTypes.GlobalCircuitResponse }) {
  // util functions
  const skipEmptyStandings = ( stage: MainScreenTypes.GlobalCircuitStageResponse ) => {
    return stage.standings.length > 0;
  };
  const skipUnplayed = ( round: any ) => {
    return round.every( ( match: any ) => match.team1.id || match.team2.id );
  };

  // grab the stages
  const stages = props.competition.started
    ? props.competition.stages
    : []
  ;

  // track the state of our tier filter
  const [ defaultFilter ] = props.competition.started
    ? stages.filter( skipEmptyStandings )
    : [ null ]
  ;
  const [ filter, setFilter ] = React.useState( defaultFilter?.stageName );

  return (
    <section>
      <Typography.Title ellipsis level={2}>
        {props.competition.name}
        {props.competition.regioncode ? ': ' + props.competition.regioncode : ''}
      </Typography.Title>
      <JoinCompetitionComponent {...props} />
      {props.competition.started && (
        <TierSelector
          placeholder="Choose a stage"
          tiers={props.competition.stages.filter( skipEmptyStandings ).map( stage => stage.stageName )}
          onChange={( value: string ) => setFilter( value )}
          defaultValue={filter}
        />
      )}
      {props.competition.started && props.competition.stages
        .filter( stage => stage.stageName === filter )
        .filter( skipEmptyStandings )
        .map( stage => (
          <article key={props.competition.id + stage.stageName}>
            {'rounds' in stage && (
              <React.Fragment>
                {'standings' in stage && (
                  <Typography.Title level={3}>
                    {'Playoffs'}
                  </Typography.Title>
                )}
                <Row gutter={[ GUTTER_H, GUTTER_V ]}>
                  {stage.rounds.filter( skipUnplayed ).map( round => (
                    <Col key={props.competition.id + JSON.stringify( round )} span={GRID_COL_WIDTH}>
                      <MatchResults
                        pageSize={NUM_CUP_MATCHES}
                        title={parseCupRound( round )}
                        dataSource={round}
                        onClick={props.onTeamClick}
                      />
                    </Col>
                  ))}
                </Row>
              </React.Fragment>
            )}
            {'standings' in stage && (
              <React.Fragment>
                {'rounds' in stage && (
                  <Typography.Title level={3}>
                    {'Group Stage'}
                  </Typography.Title>
                )}
                <Row gutter={[ GUTTER_H, GUTTER_V ]}>
                  {stage.standings.map( ( group: any, groupNum: number ) => (
                    <Col key={props.competition.id + JSON.stringify( group )} span={GRID_COL_WIDTH}>
                      <Standings
                        pageSize={NUM_STANDINGS}
                        title={`${stage.stageName} | Group ${getLetter( groupNum + 1 )}`}
                        dataSource={group.map( ( s: any ) => ({
                          id: s.competitorInfo.id,
                          name: s.competitorInfo.name,
                          ...s,
                        }))}
                        onClick={props.onTeamClick}
                      />
                    </Col>
                  ))}
                </Row>
              </React.Fragment>
            )}
          </article>
        ))
      }
    </section>
  );
}


function CompetitionType( props: CompetitionTypeProps ) {
  // grab the latest season
  const season = Math.max( ...props.Competitions.map( competition => competition.season ) );
  const ids = props.Competitions.filter( competition => competition.season === season ).map( competition => competition.id );

  // now fetch the details for the listed competitions
  const [ competitions, setCompetitions ] = React.useState<MainScreenTypes.BaseCompetition[]>([]);

  React.useEffect( () => {
    IpcService
      .send( IPCRouting.Competition.FIND_ALL, { params: { ids } })
      .then( res => setCompetitions( res ) )
    ;
  }, [ props.id ]);

  // render the competition based off types
  const [ isleague, iscup, iscircuit ] = parseCompType( props.name );

  return (
    <React.Fragment>
      {competitions.map( competition => {
        if( isleague ) {
          return (
            <CompetitionTypeLeague
              {...props}
              key={competition.id}
              competition={competition as MainScreenTypes.LeagueResponse}
            />
          );
        } else if( iscup ) {
          return (
            <CompetitionTypeCup
              {...props}
              key={competition.id}
              competition={competition as MainScreenTypes.CupResponse}
            />
          );
        } else if( iscircuit ) {
          return (
            <CompetitionTypeGlobalCircuit
              {...props}
              key={competition.id}
              competition={competition as MainScreenTypes.GlobalCircuitResponse}
            />
          );
        }

        return null;
      })}
    </React.Fragment>
  );
}


/**
 * Main Route Component
 */

const { TabPane } = Tabs;


function Competitions( props: MainComponentProps ) {
  const [ comptypes, setComptypes ] = React.useState<MainScreenTypes.CompTypeResponse[]>([]);
  const [ teamCompetitions, setTeamCompetitions ] = React.useState<any[]>([]);
  const [ joining, setJoining ] = React.useState( false );

  // grab comptypes on load
  React.useEffect( () => {
    IpcService
      .send( IPCRouting.Competition.COMPTYPES )
      .then( res => setComptypes( res ) )
    ;
  }, []);

  // grab user's joined competitions
  React.useEffect( () => {
    IpcService
      .send( IPCRouting.Database.GENERIC, {
        params: {
          model: 'Competition',
          method: 'findAllByTeam',
          args: props.profile.data.Team.id
        }
      })
      .then( res => setTeamCompetitions( res ) )
    ;
  }, [ props.profile.data ]);

  // show loading bar if not ready yet
  if( !comptypes || comptypes.length === 0 ) {
    return (
      <div id="competitions" className="content">
        <Spin size="large" />
      </div>
    );
  }

  // event handlers
  const handleOnJoin = async ( id: number ) => {
    setJoining( true );
    const newprofile = await IpcService.send( IPCRouting.Competition.JOIN, { params: { id } });
    props.dispatch( profileActions.findFinish( newprofile ) );
    setJoining( false );
  };

  // render the main component
  return (
    <div id="competitions" className="content">
      <Tabs defaultActiveKey="1">
        {comptypes.map( comptype => (
          <TabPane tab={CompTypePrettyNames[ comptype.name ]} key={comptype.id}>
            <CompetitionType
              {...comptype}
              joining={joining}
              onTeamClick={id => props.history.push( `/competitions/team/${id}` )}
              onJoin={handleOnJoin}
              team={props.profile.data.Team}
              teamCompetitions={teamCompetitions}
            />
          </TabPane>
        ))}
      </Tabs>
    </div>
  );
}


export default Connector.connect( Competitions );
