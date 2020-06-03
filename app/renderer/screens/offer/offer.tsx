import React from 'react';
import { ipcRenderer } from 'electron';
import { Typography, Statistic, Avatar, Descriptions, Tabs, InputNumber, Form, Empty, Button, Spin } from 'antd';
import { getEmojiFlag } from 'countries-list';
import { UserOutlined } from '@ant-design/icons';
import { OfferRequest } from 'shared/types';
import { formatCurrency, getWeeklyWages } from 'renderer/lib/util';
import IpcService from 'renderer/lib/ipc-service';


function handleFinish( fee: number, wages: number, playerdata: any ) {
  const teamid = playerdata.Team?.id;
  const playerid = playerdata.id;
  const params: OfferRequest = { playerid, teamid, wages, fee };

  IpcService
    .send( '/screens/offer/send', { params })
    .then( () => ipcRenderer.send( '/screens/offer/close' ) )
  ;
}


function handleOnCancel() {
  ipcRenderer.send( '/screens/offer/close' );
}


function Offer() {
  const [ data, setData ] = React.useState( null as any );
  const [ fee, setFee ] = React.useState( 0 );
  const [ wages, setWages ] = React.useState( 0 );

  // grab the player data
  React.useEffect( () => {
    IpcService
      .send( '/screens/offer/getdata', {} )
      .then( playerdata => {
        setData( playerdata );
        setFee( playerdata.transferValue );
        setWages( getWeeklyWages( playerdata.monthlyWages ) );
      });
  }, []);

  if( !data ) {
    return (
      <div id="offer-root" className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div id="offer-root">
      {/* GENERAL INFO */}
      <header id="top">
        <section className="avatar">
          <Avatar
            shape="square"
            size={64}
            icon={<UserOutlined />}
          />
        </section>
        <section className="general-info">
          <Typography.Title>
            {data.alias}
          </Typography.Title>
          <Typography.Title level={2}>
            {data.Team ? data.Team.name : 'Free Agent'}
          </Typography.Title>
          <Typography.Text type="secondary">
            {getEmojiFlag( data.Country.code )} {data.Country.name}
          </Typography.Text>
        </section>
        <section className="asking-price">
          <Statistic
            title="Asking Price"
            prefix="$"
            value={data.transferValue}
          />
        </section>
      </header>

      {/* TRANSFER INFO */}
      <Descriptions
        bordered
        layout="vertical"
        size="small"
        column={3}
        style={{ marginTop: 20 }}
      >
        <Descriptions.Item label="Wage">
          {formatCurrency( getWeeklyWages( data.monthlyWages ) )}{'/wk'}
        </Descriptions.Item>
        <Descriptions.Item label="Transfer Value">
          {formatCurrency( data.transferValue )}
        </Descriptions.Item>
        <Descriptions.Item label="Transfer Status">
          {data.transferList ? 'Listed' : 'Not Listed'}
        </Descriptions.Item>
      </Descriptions>

      {/* OFFER STATUS */}
      <Tabs
        defaultActiveKey="1"
        type="card"
        size="small"
        style={{ marginTop: 20 }}
      >
        {/* CURRENT OFFER */}
        <Tabs.TabPane tab="Current Offer" key="1">
          <Form onFinish={() => handleFinish( fee, wages, data )}>
            <Form.Item label="Transfer Fee">
              <InputNumber
                value={fee}
                step={500}
                style={{ width: '100%' }}
                formatter={val => formatCurrency( val as number )}
                parser={val => val?.replace( /\$\s?|(,*)/g, '' ) || 0 }
                onChange={val => setFee( val as number )}
              />
            </Form.Item>
            <Form.Item label="Player Wage">
              <InputNumber
                value={wages}
                step={500}
                style={{ width: '100%' }}
                formatter={val => formatCurrency( val as number )}
                parser={val => val?.replace( /\$\s?|(,*)/g, '' ) || 0 }
                onChange={val => setWages( val as number )}
              />
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 16, span: 8 }}>
              <Button type="primary" style={{ marginRight: 10 }} htmlType="submit">
                {'Send offer'}
              </Button>
              <Button onClick={handleOnCancel}>
                {'Cancel'}
              </Button>
            </Form.Item>
          </Form>
        </Tabs.TabPane>

        {/* PAST OFFERS */}
        <Tabs.TabPane tab="Past Offers" key="2">
          <Empty description="No past offers" />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}


export default Offer;
