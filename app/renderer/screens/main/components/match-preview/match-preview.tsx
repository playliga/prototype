import React from 'react';
import { Typography, Space, Avatar, Empty } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { UpcomingMatchResponse } from 'renderer/screens/main/types';
import './match-preview.scss';


interface Props {
  data: UpcomingMatchResponse;
}


export default function MatchPreview( props: Props ) {
  if( !props.data ) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_DEFAULT}
        description="No upcoming matches."
      />
    );
  }

  return (
    <>
      <div style={{ textAlign: 'center' }}>
        <Typography.Title level={4} style={{ marginBottom: 0 }}>
          {props.data.competition}: {props.data.region}
        </Typography.Title>
        <Typography.Text>
          {props.data.division}
        </Typography.Text>
      </div>
      <div className="match-preview-body">
        <Space direction="vertical">
          <Avatar size={100} icon={<UserOutlined />} />
          <span>{props.data.match.team1.name}</span>
        </Space>
        <Typography.Text strong className="vs">
          {'VS'}
        </Typography.Text>
        <Space direction="vertical">
          <Avatar size={100} icon={<UserOutlined />} />
          <span>{props.data.match.team2.name}</span>
        </Space>
      </div>
    </>
  );
}
