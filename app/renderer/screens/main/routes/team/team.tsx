import React from 'react';
import moment from 'moment';
import ColorThief from 'colorthief';
import IpcService from 'renderer/lib/ipc-service';
import Tiers from 'shared/tiers';
import Connector from 'renderer/screens/main/components/connector';
import PlayerCard from 'renderer/screens/main/components/player-card';
import * as IPCRouting from 'shared/ipc-routing';
import { ipcRenderer } from 'electron';
import { useParams, RouteComponentProps } from 'react-router';
import { Affix, Card, Col, Menu, PageHeader, Row, Space, Spin, Typography } from 'antd';
import { CaretLeftFilled } from '@ant-design/icons';
import { Line } from 'react-chartjs-2';
import { CompTypePrettyNames } from 'shared/enums';
import { ApplicationState } from 'renderer/screens/main/types';
import { Match } from 'main/lib/league/types';


/**
 * Module constants, variables, and typings
 */

// constants
const GUTTER_H = 8;
const GUTTER_V = 8;
const GRID_COL_WIDTH = 8;


// variables
const { SubMenu } = Menu;


// typings
interface Props extends RouteComponentProps, ApplicationState {
  dispatch: Function;
}


interface RouteParams {
  id?: string;
}


interface TeamInfoResponse {
  id: number;
  name: string;
  logo: string;
  Country: { code: string; name: string };
  Players?: { id: number; alias: string }[];
}


interface DivisionResponse {
  name: string;
  tier: number;
  season: number;
}


interface CompetitionResponse {
  id: number;
  name: string;
  Competitions: {
    id: number;
    season: number;
    Compdef: {
      id: number;
      name: string;
    };
  }[];
}


interface MatchResponse {
  id: number;
  competition: string;
  season: number;
  description?: string;
  date: string;
  match: Match & {
    [N in 'team1' | 'team2']: Partial<TeamInfoResponse> & {
      seed: number;
      shortName: string;
    };
  };
}


/**
 * HELPER FUNCTIONS
 */

function getYAxisLabel( label: number ) {
  return Tiers.find( t => t.order === label ).name;
}


function padSeasonNumber( season: number ) {
  return `S${String( season ).padStart( 2, '0' )}`;
}


/**
 * HELPER COMPONENTS
 */

function MatchResult( props: MatchResponse ) {
  const team1win = props.match.m[ 0 ] > props.match.m[ 1 ];
  const team2win = props.match.m[ 1 ] > props.match.m[ 0 ];
  const team1text = [
    <span key="team1_flag" className={`fp ${props.match.team1.Country.code.toLowerCase()}`} />,
    props.match.team1.name
  ];
  const team2text = [
    <span key="team2_flag" className={`fp ${props.match.team2.Country.code.toLowerCase()}`} />,
    props.match.team2.name
  ];

  return (
    <Card.Grid style={{ width: '50%' }}>
      <p className="small-caps">
        <Typography.Text type="secondary">
          {props.competition + ' '}
          {padSeasonNumber( props.season ) + ' '}
          {props.description && `(${props.description})`}
        </Typography.Text>
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Space direction="vertical">
          {team1win
            ? <p>{team1text}</p>
            : <p><Typography.Text type="secondary">{team1text}</Typography.Text></p>
          }
          {team2win
            ? <p>{team2text}</p>
            : <p><Typography.Text type="secondary">{team2text}</Typography.Text></p>
          }
        </Space>
        <Space size="middle">
          <Space direction="vertical">
            <p>
              {team1win
                ? [ props.match.m[ 0 ], <CaretLeftFilled key="team1" /> ]
                : <Typography.Text type="secondary">{props.match.m[ 0 ]}</Typography.Text>
              }
            </p>
            <p>
              {team2win
                ? [ props.match.m[ 1 ], <CaretLeftFilled key="team1" /> ]
                : <Typography.Text type="secondary">{props.match.m[ 1 ]}</Typography.Text>
              }
            </p>
          </Space>
          <Space direction="vertical" align="center">
            <Typography.Text type="secondary">
              {moment( props.date ).format( 'MM/DD/YY' )}
            </Typography.Text>
            <p>{props.match.data.map}</p>
          </Space>
        </Space>
      </div>
    </Card.Grid>
  );
}


/**
 * Team Route Component
 */

function Team( props: Props ) {
  const { id } = useParams<RouteParams>();
  const [ basicInfo, setBasicInfo ] = React.useState<TeamInfoResponse>( null );
  const [ divisions, setDivisions ] = React.useState<DivisionResponse[]>( null );
  const [ competitions, setCompetitions ] = React.useState<CompetitionResponse[]>( null );
  const [ matches, setMatches ] = React.useState<MatchResponse[]>( null );
  const [ loading, setLoading ] = React.useState( true );
  const [ fetchingMatches, setFetchingMatches ] = React.useState( true );
  const [ competitionFilter, setCompetitionFilter ] = React.useState<string[]>( null );
  const [ lineColor, setLineColor ] = React.useState<number[]>();
  const logoRef = React.useRef( null );

  // fetch initial data
  React.useEffect( () => {
    IpcService
      .send( IPCRouting.Database.TEAM_INFO, { params: { id } })
      .then( res => { setBasicInfo( res ); setLoading( false ); })
    ;
    IpcService
      .send( IPCRouting.Database.TEAM_DIVISIONS, { params: { id } })
      .then( res => { setDivisions( res ); setLoading( false ); })
    ;
    IpcService
      .send( IPCRouting.Database.TEAM_COMPETITIONS, { params: { id } })
      .then( res => {
        setCompetitions( res );
        setLoading( false );
        setCompetitionFilter([ String( res[ 0 ].Competitions[ 0 ].id ) ]);
      })
    ;
  }, []);

  // fetch data when filter is toggled
  React.useEffect( () => {
    if( competitionFilter ) {
      const [ competitionId ] = competitionFilter;
      setFetchingMatches( !fetchingMatches );
      IpcService
        .send( IPCRouting.Database.TEAM_MATCHES, { params: { id, competitionId } })
        .then( res => { setMatches( res ); setFetchingMatches( false ); })
      ;
    }
  }, [ competitionFilter ]);

  if( loading || !basicInfo || !divisions || !competitions || !competitionFilter ) {
    return (
      <div id="team">
        <PageHeader ghost={false} title={<Spin />} />
      </div>
    );
  }

  return (
    <div id="team">
      <Affix>
        <PageHeader
          ghost={false}
          onBack={() => props.history.goBack()}
          title={(
            <React.Fragment>
              <span className={`fp ${basicInfo.Country.code.toLowerCase()}`} />
              <span>{basicInfo.name}</span>
            </React.Fragment>
          )}
        />
      </Affix>

      <section className="content">
        {/* TEAM LOGO, AND LEAGUE HISTORY */}
        <Typography.Title level={2}>
          {'League History'}
        </Typography.Title>
        <article id="history-container">
          {basicInfo.logo && (
            <aside>
              <img
                ref={logoRef}
                className="img-responsive"
                src={basicInfo.logo}
                onLoad={() => {
                  if( logoRef.current ) {
                    const ct = new ColorThief();
                    setLineColor( ct.getColor( logoRef.current ) );
                  }
                }}
              />
            </aside>
          )}
          <aside>
            <Line
              data={{
                labels: divisions.map( d => `S${d.season}` ),
                datasets: [{
                  data: divisions.map( d => Tiers[ d.tier ].order ),
                  borderColor: lineColor ? `rgb(${lineColor.join(', ')})` : 'salmon',
                  fill: false,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                legend: false,
                tooltips: false,
                elements: {
                  point: {
                    pointStyle: 'cross'
                  },
                  line: {
                    tension: 0,
                  }
                },
                scales: {
                  xAxes: [{
                    offset: true,
                    gridLines: {
                      borderDash: [ 5, 5 ],
                      drawBorder: false,
                    },
                  }],
                  yAxes: [{
                    offset: true,
                    gridLines: {
                      borderDash: [ 5, 5 ],
                      drawBorder: false,
                    },
                    ticks: {
                      beginAtZero: true,
                      stepSize: 1,
                      max: 4,
                      padding: 10,
                      callback: getYAxisLabel
                    }
                  }]
                }
              }}
            />
          </aside>
        </article>

        {/* SQUAD INFORMATION */}
        <Typography.Title level={2}>
          {'Squad'}
        </Typography.Title>
        <Row gutter={[ GUTTER_H, GUTTER_V ]}>
          {basicInfo.Players.map( player => (
            <Col key={player.id} span={GRID_COL_WIDTH}>
              <PlayerCard
                disableManagerActions={id !== props.profile.data.Team.id}
                player={player}
                me={props.profile.data.Player.id === player.id}
                onClick={(p: any ) => ipcRenderer.send( IPCRouting.Offer.OPEN, p.id )}
                onClickDetails={(p: any ) => ipcRenderer.send( IPCRouting.Offer.OPEN, p.id )}
              />
            </Col>
          ))}
        </Row>

        {/* COMPETITION DROPDOWNS */}
        <Typography.Title level={2}>
          {'Competitions and match history'}
        </Typography.Title>
        <Menu
          mode="horizontal"
          onClick={({ key }) => setCompetitionFilter([ key as string ])}
          defaultSelectedKeys={competitionFilter}
        >
          {competitions.map( comptype => (
            <SubMenu
              key={comptype.id}
              title={CompTypePrettyNames[ comptype.name ]}
              disabled={comptype.Competitions.length === 0}
              popupClassName="ant-menu-small-sub-menu"
            >
              {comptype.Competitions.map( competition => (
                <Menu.Item key={competition.id}>
                  {competition.Compdef.name + ' '}
                  {padSeasonNumber( competition.season )}
                </Menu.Item>
              ))}
            </SubMenu>
          ))}
        </Menu>

        {/* MATCH HISTORY */}
        {!!matches && matches.length > 0 && (
          <Card
            className="ant-card-contain-grid"
            style={{ marginTop: 20 }}
            loading={fetchingMatches}
          >
            {matches.map( match => (
              <MatchResult key={match.id} {...match} />
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}


export default Connector.connect( Team );
