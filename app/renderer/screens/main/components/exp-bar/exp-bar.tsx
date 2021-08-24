import React from 'react';
import { Progress, Typography } from 'antd';
import { blue, green } from '@ant-design/colors';
import './exp-bar.scss';


interface Props {
  next: number;
  prev: number;
  title?: string;
  total: number;
  success?: number;
}


function ExpBar( props: Props ) {
  return (
    <div id="exp-bar">
      {!!props.title && (
        <section className="title">
          <Typography.Text>
            {props.title}
          </Typography.Text>
        </section>
      )}
      <section className="bar">
        <Typography.Text type="secondary">
          {props.prev || 0}
        </Typography.Text>
        {/* PROGRESS BAR SHOWS THE GAINS AS BLUE, SO INVERT THE COLORS */}
        {props.success && props.success > 0
          ? (
            <Progress
              strokeLinecap="square"
              percent={props.total}
              strokeColor={green.primary}
              success={{ percent: props.success || 0, strokeColor: blue.primary }}
              showInfo={false}
            />
          ) : (
            <Progress
              strokeLinecap="square"
              percent={props.total}
              showInfo={false}
            />
          )
        }
        <Typography.Text type="secondary">
          {props.next}
        </Typography.Text>
      </section>
    </div>
  );
}


export default ExpBar;
