import React from 'react';
import { Progress, Typography } from 'antd';
import './exp-bar.scss';


interface Props {
  next: number;
  prev: number;
  title?: string;
  total: number;
}


function ExpBar( props: Props ) {
  return (
    <div id="exp-bar">
      {!!props.title && (
        <section className="title">
          <Typography.Text>
            {'Total'}
          </Typography.Text>
        </section>
      )}
      <section className="bar">
        <Typography.Text type="secondary">
          {props.prev || 0}
        </Typography.Text>
        <Progress
          percent={props.total}
          showInfo={false}
        />
        <Typography.Text type="secondary">
          {props.next}
        </Typography.Text>
      </section>
    </div>
  );
}


export default ExpBar;
