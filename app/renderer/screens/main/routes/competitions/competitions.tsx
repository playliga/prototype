import React from 'react';
import IpcService from 'renderer/lib/ipc-service';
import Connector from 'renderer/screens/main/components/connector';
import Standings from 'renderer/screens/main/components/standings';
import MatchResults from 'renderer/screens/main/components/match-results';
import Application from 'main/constants/application';
import * as IPCRouting from 'shared/ipc-routing';
import * as MainScreenTypes from 'renderer/screens/main/types';
import { RouteComponentProps, useHistory } from 'react-router';
import { Spin, Tabs, Typography, Select, Col, Row } from 'antd';
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
const NUM_STANDINGS_CIRCUITS = 12;
const NUM_CUP_MATCHES = 10;


interface MainComponentProps extends MainScreenTypes.ApplicationState, RouteComponentProps {
  dispatch: Function;
}


interface Filter {
  activeTabKey?: string;
  conference?: string;
  division?: any;
  round?: string;
  stage?: any;
}


interface CompetitionTypeProps extends MainScreenTypes.CompTypeResponse {
  filterdata?: Record<string, Filter>;
  onTeamClick: ( id: number ) => void;
  onFilterChange: ( data: any ) => void;
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


function CompetitionStatusComponent( props: CompetitionTypeProps & { competition: MainScreenTypes.BaseCompetition }) {
  // bail early if it has already started
  if( props.competition.started ) {
    return null;
  }

  return (
    <article style={{ width: '33%' }}>
      <p><em>{'Not started.'}</em></p>
    </article>
  );
}


/**
 * Competition-related Components
 */

// util function to filter out unplayed rounds
function skipUnplayed( round: any ) {
  return round.every( ( match: any ) => match.team1.id || match.team2.id );
}


function CompetitionTypeLeagueConferences( props: Partial<CompetitionTypeProps> & { conferences: MainScreenTypes.StandingsResponse[]; division: MainScreenTypes.LeagueDivisionResponse; filterOverride: Filter }) {
  // track the state of our tier filter
  const genConferenceLabel = ( cid: number ) => `Conference ${getLetter( cid+1 )}`;
  const [ filter, setFilter ] = React.useState( props.filterOverride?.conference || genConferenceLabel( 0 ) );

  React.useEffect( () => {
    props.onFilterChange( filter );
  }, [ filter ]);

  return (
    <React.Fragment>
      <TierSelector
        placeholder="Choose a conference"
        tiers={props.conferences.map( ( _, idx ) => genConferenceLabel( idx ) )}
        onChange={( value: string ) => setFilter( value )}
        defaultValue={filter}
      />
      {props.conferences
        .filter( ( _, idx ) => genConferenceLabel( idx ) === filter )
        .map( ( conference, idx ) => (
          <aside key={idx + JSON.stringify( conference )}>
            {'rounds' in conference && (
              <React.Fragment>
                <Typography.Title level={3}>
                  {'Promotional Playoffs'}
                </Typography.Title>
                <Row gutter={[ GUTTER_H, GUTTER_V ]}>
                  {conference.rounds.filter( skipUnplayed ).map( round => (
                    <Col key={idx + JSON.stringify( round )} span={GRID_COL_WIDTH}>
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
            {'standings' in conference && (
              <React.Fragment>
                {'rounds' in conference && (
                  <Typography.Title level={3}>
                    {'Group Stage'}
                  </Typography.Title>
                )}
                <Row gutter={[ GUTTER_H, GUTTER_V ]}>
                  <Col span={GRID_COL_WIDTH}>
                    <Standings
                      pageSize={NUM_STANDINGS}
                      title={props.division.name}
                      dataSource={conference.standings.map( ( s: any ) => ({
                        id: s.competitorInfo.id,
                        name: s.competitorInfo.name,
                        ...s,
                      }))}
                      onClick={props.onTeamClick}
                    />
                  </Col>
                </Row>
              </React.Fragment>
            )}
          </aside>
        ))
      }
    </React.Fragment>
  );
}


function CompetitionTypeLeague( props: CompetitionTypeProps & { competition: MainScreenTypes.LeagueResponse }) {
  // grab default filter value
  const [ defaultFilter ] = props.competition.started
    ? props.competition.divisions
    : [ null ]
  ;

  // track the state of our tier filter
  const [ filter, setFilter ] = React.useState( props.filterdata[ props.competition.id ]?.division || defaultFilter?.name );

  React.useEffect( () => {
    props.onFilterChange({ division: filter });
  }, [ filter ]);

  return (
    <section>
      <Typography.Title ellipsis level={2}>
        {props.competition.name}
        {props.competition.regioncode ? ': ' + props.competition.regioncode : ''}
      </Typography.Title>
      <CompetitionStatusComponent {...props} />
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
            {division.conferences.length > 1 && (
              <CompetitionTypeLeagueConferences
                filterOverride={props.filterdata[ props.competition.id ]}
                division={division}
                conferences={division.conferences}
                onTeamClick={props.onTeamClick}
                onFilterChange={data => props.onFilterChange({ conference: data })}
              />
            )}
            {division.conferences.length === 1 && division.conferences.map( ( conference, idx ) => (
              <aside key={idx + JSON.stringify( conference )}>
                {'rounds' in conference && (
                  <React.Fragment>
                    <Typography.Title level={3}>
                      {'Promotional Playoffs'}
                    </Typography.Title>
                    <Row gutter={[ GUTTER_H, GUTTER_V ]}>
                      {conference.rounds.filter( skipUnplayed ).map( round => (
                        <Col key={idx + JSON.stringify( round )} span={GRID_COL_WIDTH}>
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
                {'standings' in conference && (
                  <React.Fragment>
                    {'rounds' in conference && (
                      <Typography.Title level={3}>
                        {'Group Stage'}
                      </Typography.Title>
                    )}
                    <Row gutter={[ GUTTER_H, GUTTER_V ]}>
                      <Col span={GRID_COL_WIDTH}>
                        <Standings
                          pageSize={NUM_STANDINGS}
                          title={division.name}
                          dataSource={conference.standings.map( ( s: any ) => ({
                            id: s.competitorInfo.id,
                            name: s.competitorInfo.name,
                            ...s,
                          }))}
                          onClick={props.onTeamClick}
                        />
                      </Col>
                    </Row>
                  </React.Fragment>
                )}
              </aside>
            ))}
          </article>
        ))
      }
    </section>
  );
}


function CompetitionTypeCup( props: CompetitionTypeProps & { competition: MainScreenTypes.CupResponse }) {
  // grab the rounds
  const [ cupdata ] = props.competition?.data || [];
  const rounds = cupdata?.rounds?.filter( skipUnplayed ) || [];

  // track the state of our tier filter
  const defaultFilter = props.competition.started
    ? parseCupRound( rounds[ 0 ] )
    : null
  ;
  const [ filter, setFilter ] = React.useState( props.filterdata[ props.competition.id ]?.round || defaultFilter );

  React.useEffect( () => {
    props.onFilterChange({ round: filter });
  }, [ filter ]);

  // render jsx
  return (
    <section>
      <Typography.Title ellipsis level={2}>
        {props.competition.name}
        {props.competition.regioncode ? ': ' + props.competition.regioncode : ''}
      </Typography.Title>
      <CompetitionStatusComponent {...props} />
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


function CompetitionTypeGlobalCircuitPlayoffs( props: Partial<CompetitionTypeProps> & { rounds: any; filterOverride?: Filter }) {
  // track the state of our tier filter
  const rounds = props.rounds.filter( skipUnplayed ) || [];
  const defaultFilter = parseCupRound( rounds[ 0 ] );
  const [ filter, setFilter ] = React.useState( props.filterOverride?.round || defaultFilter );

  React.useEffect( () => {
    props.onFilterChange( filter );
  }, [ filter ]);

  return (
    <React.Fragment>
      <TierSelector
        placeholder="Choose a cup round"
        tiers={rounds.map( parseCupRound )}
        onChange={( value: string ) => setFilter( value )}
        defaultValue={filter}
      />
      <Row gutter={[ GUTTER_H, GUTTER_V ]}>
        {props.rounds
          .filter( ( round: any ) => parseCupRound( round ) === filter )
          .map( ( round: any ) => (
            <Col key={JSON.stringify( round )} span={GRID_COL_WIDTH}>
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
    </React.Fragment>
  );
}


function CompetitionTypeGlobalCircuit( props: CompetitionTypeProps & { competition: MainScreenTypes.GlobalCircuitResponse }) {
  // util functions
  const skipEmptyStandings = ( stage: MainScreenTypes.GlobalCircuitStageResponse ) => {
    return stage.standings.length > 0;
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
  const [ filter, setFilter ] = React.useState( props.filterdata[ props.competition.id ]?.stage || defaultFilter?.stageName );

  React.useEffect( () => {
    props.onFilterChange({ stage: filter });
  }, [ filter ]);

  return (
    <section>
      <Typography.Title ellipsis level={2}>
        {props.competition.name}
        {props.competition.regioncode ? ': ' + props.competition.regioncode : ''}
      </Typography.Title>
      <CompetitionStatusComponent {...props} />
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
                <CompetitionTypeGlobalCircuitPlayoffs
                  filterOverride={props.filterdata[ props.competition.id ]}
                  onTeamClick={props.onTeamClick}
                  rounds={stage.rounds}
                  onFilterChange={data => props.onFilterChange({ round: data })}
                />
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
                        pageSize={NUM_STANDINGS_CIRCUITS}
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
  const season_override = props.filterdata?.activeSeasonYear;
  const season = season_override || Math.max( ...props.Competitions.map( competition => competition.season ) );
  const ids = props.Competitions
    .filter( competition => season_override ? competition.seasonYear === season : competition.season === season )
    .map( competition => competition.id )
  ;

  // now fetch the details for the listed competitions
  const [ competitions, setCompetitions ] = React.useState<MainScreenTypes.BaseCompetition[]>([]);

  React.useEffect( () => {
    IpcService
      .send( IPCRouting.Competition.FIND_ALL, { params: { ids } })
      .then( res => setCompetitions( res ) )
    ;
  }, [ props.id, season_override ]);

  // render the competition based off types
  const [ isleague, iscup, iscircuit ] = parseCompType( props.name );

  return (
    <React.Fragment>
      {competitions.map( competition => {
        const existingfilter = props.filterdata[competition.id];
        const onFilterChange = ( data: any ) => props.onFilterChange({ [competition.id]: { ...existingfilter, ...data } });
        if( isleague ) {
          return (
            <CompetitionTypeLeague
              {...props}
              key={competition.id}
              competition={competition as MainScreenTypes.LeagueResponse}
              onFilterChange={onFilterChange}
            />
          );
        } else if( iscup ) {
          return (
            <CompetitionTypeCup
              {...props}
              key={competition.id}
              competition={competition as MainScreenTypes.CupResponse}
              onFilterChange={onFilterChange}
            />
          );
        } else if( iscircuit ) {
          return (
            <CompetitionTypeGlobalCircuit
              {...props}
              key={competition.id}
              competition={competition as MainScreenTypes.GlobalCircuitResponse}
              onFilterChange={onFilterChange}
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
  // figure out filter data if there
  // was any from a previous route
  const history: any = useHistory();
  const [ entry ] = history.entries.slice( -1 );
  const refererData = entry.state?.refererData;

  // component state
  const [ comptypes, setComptypes ] = React.useState<MainScreenTypes.CompTypeResponse[]>([]);
  const [ teamCompetitions, setTeamCompetitions ] = React.useState<any[]>([]);
  const [ filterdata, setFilterdata ] = React.useState<Record<string, Filter | string>>( refererData || {} );
  const [ seasonYears, setSeasonYears ] = React.useState<Record<string, any>[]>([]);

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

  // season selector
  //
  // - ex: 2021-2020, 2020-2019
  React.useEffect( () => {
    setSeasonYears([ ...Array( ( props.profile.data.currentSeasonYear + 1 ) - Application.PRESEASON_FIRST_YEAR ) ].map( ( _, idx ) => ({
      key: props.profile.data.currentSeasonYear - idx,
      label: `${props.profile.data.currentSeasonYear - idx} - ${( props.profile.data.currentSeasonYear - idx ) + 1}`
    })));
  }, [ props.profile.data ]);

  // show loading bar if not ready yet
  if( !comptypes || comptypes.length === 0 ) {
    return (
      <div id="competitions" className="content">
        <Spin size="large" />
      </div>
    );
  }

  // render the main component
  return (
    <div id="competitions" className="content">
      <Typography.Paragraph strong>
        {'Select Season'}
      </Typography.Paragraph>
      <Select
        defaultValue={filterdata.activeSeasonYear as string || seasonYears[ 0 ].key}
        onChange={key => setFilterdata({ ...filterdata, activeSeasonYear: key })}
      >
        {seasonYears.map( year => (
          <Select.Option
            key={year.key}
            value={year.key}
          >
            {year.label}
          </Select.Option>
        ))}
      </Select>
      <Tabs
        defaultActiveKey="1"
        activeKey={filterdata.activeTabKey as string}
        onChange={key => setFilterdata({ ...filterdata, activeTabKey: key })}
      >
        {comptypes.map( comptype => (
          <TabPane tab={CompTypePrettyNames[ comptype.name ]} key={comptype.id}>
            <CompetitionType
              {...comptype}
              filterdata={filterdata as Record<string, Filter>}
              onFilterChange={data => setFilterdata({ ...filterdata, ...data })}
              onTeamClick={id => props.history.push( `/competitions/team/${id}`, { refererData: filterdata })}
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
