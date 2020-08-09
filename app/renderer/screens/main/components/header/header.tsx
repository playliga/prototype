import React from 'react';
import moment from 'moment';
import { PageHeader, Button, Spin, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { ApplicationState } from 'renderer/screens/main/types';
import './header.scss';


interface Props extends ApplicationState {
  onNextDay: () => void;
}


function Title( props: ApplicationState ) {
  const { data } = props.profile;

  return (
    <div>
      <section>
        <span>{data.Player.alias}</span>
      </section>
      <section className="teamname-container">
        <span
          key="1"
          className={`fp ${data.Team.Country.code.toLowerCase()}`}
        />
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
          <Typography.Text key="0" className="date-container">
            {moment( data.currentDate ).format( 'ddd, MMM DD, YYYY' )}
          </Typography.Text>,
          <Button key="1" type="primary" onClick={props.onNextDay}>
            {'Next'}
          </Button>
        ]}
      />
    </div>
  );
}
