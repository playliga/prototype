import React from 'react';
import dedent from 'dedent';
import { List, Avatar, Typography, Badge } from 'antd';
import ReactMarkdown from 'react-markdown';
import './inbox-preview.scss';


// @todo: get this from the email model
interface Data {
  id: number;
  subject: string;
  content: string;
  read: boolean;
  Persona: any;
}


interface Props {
  data: Data[];
  selected?: number;
  onClick?: ( id: number ) => void;
}


function InboxPreviewTitle( props: Data ) {
  return (
    <div className="inbox-preview-title">
      <section>
        <Typography.Text strong>
          {props.subject}
          {!props.read && (
            <Badge dot />
          )}
        </Typography.Text>
        <br />
        <Typography.Text type="secondary">
          {props.Persona.fname} {props.Persona.lname}
        </Typography.Text>
      </section>
      <section>
        <Typography.Text type="secondary" style={{ fontVariant: 'small-caps' }}>
          {'09/27'}
        </Typography.Text>
      </section>
    </div>
  );
}


function InboxPreviewBody( props: any ) {
  const dedented = dedent( props.content );

  return (
    <div className="inbox-preview-body">
      <ReactMarkdown source={dedented} />
    </div>
  );
}


export function InboxPreviewItem( props: Partial<Props> & Data ) {
  const isactive = props.selected === props.id;
  const classname = isactive
    ? 'active'
    : ''
  ;
  const cb = () => {
    if( props.onClick ) {
      props.onClick( props.id );
    }
  };

  return (
    <List.Item onClick={() => cb()}>
      <List.Item.Meta
        className={classname}
        avatar={<Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />}
        title={<InboxPreviewTitle {...props} />}
        description={<InboxPreviewBody {...props} />}
      />
    </List.Item>
  );
}


function InboxPreview( props: Props ) {
  return (
    <List
      className="inbox-preview"
      dataSource={props.data}
      renderItem={data => (
        <InboxPreviewItem
          {...data}
          selected={props.selected}
          onClick={props.onClick}
        />
      )}
    />
  );
}


export default InboxPreview;
