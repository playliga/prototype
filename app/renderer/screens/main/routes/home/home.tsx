import React, { Component } from 'react';
import { List, Avatar } from 'antd';
import { random } from 'lodash';


function InboxPreviewItem( props: any ) {
  return (
    <List.Item onClick={() => props.onClick()}>
      <List.Item.Meta
        avatar={<Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />}
        description="Just introducing myself. I'm your assistance manager and really think..."
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{'Hello'}</span>
            <span>{'May 2020'}</span>
          </div>
        }
      />
    </List.Item>
  );
}


function InboxPreview( props: any ) {
  const data = Array( 5 )
    .fill( null )
    .map( () => ({ key: random( 0, 100 ) }))
  ;

  return (
    <List
      header="Inbox"
      dataSource={data}
      renderItem={() => <InboxPreviewItem onClick={props.onClick} />}
    />
  );
}


class Home extends Component<any> {
  public render() {
    return (
      <div id="home" className="content">
        <InboxPreview
          onClick={() => this.props.history.push( '/inbox' )}
        />
      </div>
    );
  }
}


export default Home;
