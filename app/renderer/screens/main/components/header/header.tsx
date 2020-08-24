import React from 'react';
import moment from 'moment';
import { PageHeader, Button, Spin, Typography } from 'antd';
import { UserOutlined, CaretRightOutlined } from '@ant-design/icons';
import { green } from '@ant-design/colors';
import { ApplicationState } from 'renderer/screens/main/types';
import './header.scss';


interface Props extends ApplicationState {
  isMatchday?: boolean;
  loading?: boolean;
  onNextDay: () => void;
  onPlay: () => void;
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
          props.isMatchday
            ? (
              <Button
                icon={<CaretRightOutlined />}
                key="2"
                onClick={props.onPlay}
                style={{ backgroundColor: green[ 5 ], borderColor: green[ 5 ] }}
                type="primary"
              >
                {'Play'}
              </Button>
            )
            : (
              <Button
                key="2"
                disabled={props.loading}
                onClick={props.onNextDay}
                type="primary"
              >
                {'Next'}
              </Button>
            )
        ]}
      />
    </div>
  );
}
