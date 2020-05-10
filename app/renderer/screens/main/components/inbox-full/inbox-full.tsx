import React from 'react';
import dedent from 'dedent';
import { Card, Avatar, Typography } from 'antd';
import ReactMarkdown from 'react-markdown';
import './inbox-full.scss';


// @todo: get this from the email model
interface Data {
  id: number;
  subject: string;
  content: string;
  Persona: any;
}


interface Props {
  data: Data;
}


function InboxFullTitle( props: Data ) {
  return (
    <div className="inbox-full-title">
      <section>
        <Typography.Text type="secondary">
          {props.Persona.fname} {props.Persona.lname}
        </Typography.Text>
      </section>
      <section>
        <Typography.Text type="secondary" style={{ fontVariant: 'small-caps' }}>
          {'may 14 2020'}
        </Typography.Text>
      </section>
    </div>
  );
}


function InboxFullBody( props: Data ) {
  const dedented = dedent( props.content );

  return (
    <div className="inbox-full-body">
      <Typography.Title>
        {props.subject}
      </Typography.Title>
      <ReactMarkdown source={dedented} />
    </div>
  );
}


function InboxFull( props: Props ) {
  return (
    <Card
      className="inbox-full"
    >
      <Card.Meta
        avatar={<Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />}
        title={<InboxFullTitle {...props.data} />}
        description={<InboxFullBody {...props.data} />}
      />
    </Card>
  );
}


export default InboxFull;
