import React from 'react';
import IpcService from 'renderer/lib/ipc-service';
import Tiers from 'shared/tiers';
import * as IPCRouting from 'shared/ipc-routing';
import { useParams, RouteComponentProps } from 'react-router';
import { Affix, PageHeader, Spin, Typography } from 'antd';
import { Line } from 'react-chartjs-2';
import { TeamInfoResponse } from 'shared/types';


/**
 * Module constants, variables, and typings
 */

// typings
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

function Team( props: RouteComponentProps ) {
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
          title={'Team Info'}
          onBack={() => props.history.goBack()}
        />
      </Affix>

      <section className="content">
        {/* BASIC INFORMATION, TEAM LOGO, AND DIVISION HISTORY */}
        <article id="info-container">
          <aside>
            <Typography.Title level={2} ellipsis>
              {basicInfo.name}
            </Typography.Title>
            <Typography.Text>
              <span className={`fp ${basicInfo.Country.code.toLowerCase()}`} />
              <span className="small-caps">{basicInfo.Country.name}</span>
            </Typography.Text>
            <img
              className="img-responsive"
              src={basicInfo.logo}
            />
          </aside>
          <aside>
            <Typography.Title level={4}>
              {'League History'}
            </Typography.Title>
            <div id="chart-container">
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
            </div>
          </aside>
        </article>
      </section>
    </div>
  );
}


export default Team;
