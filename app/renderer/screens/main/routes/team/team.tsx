import React from 'react';
import moment from 'moment';
import IpcService from 'renderer/lib/ipc-service';
import Tiers from 'shared/tiers';
import { useParams, RouteComponentProps } from 'react-router';
import { Dictionary, groupBy } from 'lodash';
import { Line } from 'react-chartjs-2';
import { Affix, Button, Card, Dropdown, Menu, PageHeader, Space, Spin, Typography } from 'antd';
import { CaretLeftFilled, DownOutlined } from '@ant-design/icons';
import { CompTypes } from 'shared/enums';
import { TeamInfoResponse } from 'shared/types';
import * as IPCRouting from 'shared/ipc-routing';

interface RouteParams {
  id?: string;
}


/**
 * HELPER FUNCTIONS
 */

function getYAxisLabel( label: number ) {
  return Tiers.find( t => t.order === label ).name;
}


function getMatchTitle( competition: string, season: number ) {
  return `${competition} S${String( season ).padStart( 2, '0' )}`;
}


function sortBySeason( items: Dictionary<any[]> ) {
  const sortregex = /S\d{0,2}$/;
  const sorteditems: Dictionary<any[]> = {};
  Object
    .keys( items )
    .sort( ( a, b ) => a.match( sortregex )[ 0 ].localeCompare( b.match( sortregex )[ 0 ] ) )
    .forEach( item => sorteditems[ item ] = items[ item ] )
  ;
  return sorteditems;
}


/**
 * DROPDOWN OVERLAY COMPONENT
 */

interface MenuOverlayProps {
  items: string[];
  onClick: ( item: any ) => void;
}


function MenuOverlay( props: MenuOverlayProps ) {
  return (
    <Menu onClick={e => props.onClick( e.key )}>
      {props.items.map( item => (
        <Menu.Item key={item}>
          {item}
        </Menu.Item>
      ))}
    </Menu>
  );
}


/**
 * MATCH RESULT COMPONENT
 */

function MatchResult( props: any ) {
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
          {props.competition} {props.description && `(${props.description})`}
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

function Team( props: RouteComponentProps ) {
  const { id } = useParams<RouteParams>();
  const [ data, setData ] = React.useState<TeamInfoResponse>();
  const [ loading, setLoading ] = React.useState( true );
  const [ filter, setFilter ] = React.useState();
  const [ filterType, setFilterType ] = React.useState<string>();

  React.useEffect( () => {
    IpcService
      .send( IPCRouting.Database.TEAM_GET, {
        params: { id }
      })
      .then( res => { setData( res ); setLoading( false ); })
    ;
  }, []);

  if( loading || !data ) {
    return (
      <div id="team">
        <PageHeader
          ghost={false}
          title={<Spin />}
        />
      </div>
    );
  }

  // create dropdowns per match type
  const dropdowns = data.matches && groupBy(
    data.matches,
    match => match.type[ 0 ] ? CompTypes.LEAGUE : CompTypes.LEAGUE_CUP
  );

  // do we need to filter the match data?
  let matchdata = data.matches;

  if( filter ) {
    matchdata = data.matches.filter( match => getMatchTitle( match.competition, match.season ) === filter );
  }

  return (
    <div id="team">
      {/* RENDER THE HEADER */}
      <Affix>
        <PageHeader
          ghost={false}
          title={'Team Info'}
          onBack={() => props.history.goBack()}
        />
      </Affix>

      {/* RENDER THE TEAM INFO */}
      <section className="content">
        <Space direction="vertical">
          <Typography.Title>
            <span className={`fp ${data.Country.code.toLowerCase()}`} />
            {data.name}
          </Typography.Title>
        </Space>

        {/* RENDER THE LINE CHART */}
        <div style={{ position: 'relative', height: 250 }}>
          <Line
            data={{
              labels: data.prevDivisions.map( d => `S${d.season}` ),
              datasets: [{
                data: data.prevDivisions.map( d => Tiers[ d.tier ].order ),
                borderColor: 'salmon',
                fill: false,
              }],
            }}
            options={{
              maintainAspectRatio: false,
              legend: false,
              tooltips: false,
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
        </div>

        {/* RENDER THE FILTER DROPDOWNS */}
        {dropdowns && (
          <Space>
            {Object.keys( dropdowns ).map( dropdown => {
              // split the dropdown items by competition/season
              const menuitems = dropdowns && groupBy(
                dropdowns[ dropdown ],
                match => getMatchTitle( match.competition, match.season )
              );
              const isactive = filter && filterType === dropdown;

              return (
                <Dropdown key={dropdown} trigger={[ 'click' ]} overlay={(
                  <MenuOverlay
                    items={Object.keys( sortBySeason( menuitems ) )}
                    onClick={item => { setFilter( item ); setFilterType( dropdown ); }}
                  />
                )}>
                  <Button type={isactive ? 'primary' : 'default'}>
                    {isactive
                      ? filter
                      : `Filter by ${dropdown === CompTypes.LEAGUE ? 'League' : 'Cup'}`
                    }
                    <DownOutlined />
                  </Button>
                </Dropdown>
              );
            })}
          </Space>
        )}

        {/* RENDER THE MAIN CONTENT */}
        <Card className="ant-card-contain-grid" style={{ marginTop: 20 }}>
          {matchdata.map( match => (
            <MatchResult
              key={match.id}
              {...match}
            />
          ))}
        </Card>
      </section>
    </div>
  );
}


export default Team;
