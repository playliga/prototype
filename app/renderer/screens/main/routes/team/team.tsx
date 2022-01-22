import React from 'react';
import IpcService from 'renderer/lib/ipc-service';
import Tiers from 'shared/tiers';
import Connector from 'renderer/screens/main/components/connector';
import PlayerCard from 'renderer/screens/main/components/player-card';
import * as IPCRouting from 'shared/ipc-routing';
import { ipcRenderer } from 'electron';
import { useParams, RouteComponentProps } from 'react-router';
import { Affix, Col, PageHeader, Row, Spin, Typography } from 'antd';
import { Line } from 'react-chartjs-2';
import { TeamInfoResponse } from 'shared/types';
import { ApplicationState } from 'renderer/screens/main/types';


/**
 * Module constants, variables, and typings
 */

// constants
const GUTTER_H = 8;
const GUTTER_V = 8;
const GRID_COL_WIDTH = 8;


// typings
interface Props extends RouteComponentProps, ApplicationState {
  dispatch: Function;
}


interface RouteParams {
  id?: string;
}


interface DivisionResponse {
  name: string;
  tier: number;
  season: number;
}


/**
 * HELPER FUNCTIONS
 */

function getYAxisLabel( label: number ) {
  return Tiers.find( t => t.order === label ).name;
}


/**
 * Team Route Component
 */

function Team( props: Props ) {
  const { id } = useParams<RouteParams>();
  const [ basicInfo, setBasicInfo ] = React.useState<TeamInfoResponse>( null );
  const [ divisions, setDivisions ] = React.useState<DivisionResponse[]>( null );
  const [ loading, setLoading ] = React.useState( true );

  React.useEffect( () => {
    IpcService
      .send( IPCRouting.Database.TEAM_INFO, { params: { id } })
      .then( res => { setBasicInfo( res ); setLoading( false ); })
    ;
    IpcService
      .send( IPCRouting.Database.TEAM_DIVISIONS, { params: { id } })
      .then( res => { setDivisions( res ); setLoading( false ); })
    ;
  }, []);

  if( loading || !basicInfo || !divisions ) {
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
                className="img-responsive"
                src={basicInfo.logo}
              />
            </aside>
          )}
          <aside>
            <Line
              data={{
                labels: divisions.map( d => `S${d.season}` ),
                datasets: [{
                  data: divisions.map( d => Tiers[ d.tier ].order ),
                  borderColor: 'purple',
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
      </section>
    </div>
  );
}


export default Connector.connect( Team );
