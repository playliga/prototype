import React from 'react';
import moment from 'moment';
import { PageHeader, Button, Spin, Typography } from 'antd';
import { UserOutlined, SlidersOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { green } from '@ant-design/colors';
import { ApplicationState } from 'renderer/screens/main/types';
import './header.scss';


interface Props extends ApplicationState {
  isMatchday?: boolean;
  loading?: boolean;
  onNextDay: () => void;
  onPlay: ( sim?: boolean ) => void;
}


function Title( props: ApplicationState ) {
  const { data } = props.profile;

  return (
    <div>
      <section>
        <span>{data.Player.alias}</span>
      </section>
      <section className="teamname-container">
        <span className={`fp ${data.Team.Country.code.toLowerCase()}`} />
        <span>{data.Team.name}</span>
      </section>
    </div>
  );
}


export default function Header( props: Props ) {
  const { data } = props.profile;
  const playbutton = { backgroundColor: green[ 5 ], borderColor: green[ 5 ] };

  if( !data ) {
    return (
      <div id="header">
        <PageHeader
          ghost={false}
          title={<Spin />}
        />
      </div>
    );
  }

  return (
    <div id="header">
      <PageHeader
        avatar={{ icon: <UserOutlined /> }}
        ghost={false}
        title={<Title {...props} />}
        extra={[
          <Typography.Text key="1" className="date-container">
            {moment( data.currentDate ).format( 'ddd, MMM DD, YYYY' )}
          </Typography.Text>,
          <div key="2" className="btn-container">
            {props.isMatchday
              ? ([
                <Button
                  disabled={props.loading}
                  icon={<PlayCircleOutlined />}
                  key="2a"
                  onClick={() => props.onPlay()}
                  style={props.loading ? null : playbutton}
                  type="primary"
                >
                  {'Play'}
                </Button>,
                <Button
                  disabled={props.loading}
                  icon={<SlidersOutlined />}
                  key="2b"
                  onClick={() => props.onPlay( true )}
                  type="primary"
                >
                  {'Sim'}
                </Button>
              ])
              : (
                <Button
                  disabled={props.loading}
                  key="2a"
                  onClick={props.onNextDay}
                  type="primary"
                >
                  {'Next'}
                </Button>
              )
            }
          </div>
        ]}
      />
    </div>
  );
}
