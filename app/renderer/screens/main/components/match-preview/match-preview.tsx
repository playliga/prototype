import React from 'react';
import { Typography, Tooltip, Card, Spin, Space, Avatar, Empty } from 'antd';
import { PlayCircleFilled, UserOutlined } from '@ant-design/icons';
import { NextMatchResponse } from 'renderer/screens/main/types';
import './match-preview.scss';


interface Props {
  data: NextMatchResponse;
  onPlay: ( id: number ) => void;
}


export default function MatchPreview( props: Props ) {
  const onClickHandler = () => props.onPlay( props.data.competitionId );
  const cardactions = [
    <Tooltip title="Play!" key="play">
      <PlayCircleFilled
        onClick={onClickHandler}
      />
    </Tooltip>
  ];

  return (
    <Card
      title="Next Match"
      actions={props.data ? cardactions : null}
    >
      {/* LOADING */}
      {props.data === undefined && <Spin size="small" />}

      {/* NO DATA */}
      {props.data === null && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No upcoming matches."
        />
      )}

      {props.data && (
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
      )}
    </Card>
  );
}
