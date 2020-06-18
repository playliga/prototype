import React from 'react';
import { ipcRenderer } from 'electron';
import { getEmojiFlag } from 'countries-list';
import { UserOutlined } from '@ant-design/icons';
import {
  Typography,
  Statistic,
  Avatar,
  Descriptions,
  Tabs,
  InputNumber,
  Form,
  Empty,
  Button,
  Spin,
  Table,
  Tag
} from 'antd';

import { OfferRequest } from 'shared/types';
import { OfferStatus } from 'shared/enums';
import * as IPCRouting from 'shared/ipc-routing';
import { formatCurrency, getWeeklyWages } from 'renderer/lib/util';
import IpcService from 'renderer/lib/ipc-service';


/**
 * Utility functions
 */

function handleFinish( fee: number, wages: number, playerdata: any ) {
  const playerid = playerdata.id;
  const params: OfferRequest = { playerid, wages, fee };

  IpcService
    .send( IPCRouting.Offer.SEND, { params })
    .then( () => ipcRenderer.send( IPCRouting.Offer.CLOSE ) )
  ;
}


function handleOnCancel() {
  ipcRenderer.send( IPCRouting.Offer.CLOSE );
}


function hasPendingOffers( items: any[] ) {
  if( !items ) {
    return false;
  }

  const idx = items.findIndex( i => i.status === OfferStatus.PENDING );
  return idx >= 0;
}


/**
 * React functional components
 */

function OfferStatusTag( props: any ) {
  let color;

  switch( props.status ) {
    case OfferStatus.REJECTED:
      color = 'red';
      break;
    case OfferStatus.PENDING:
    default:
      color = 'orange';
      break;
  }

  return (
    <Tag color={color}>
      {props.status.toUpperCase()}
    </Tag>
  );
}


function Offer() {
  const [ playerdata, setPlayerData ] = React.useState( null as any );
  const [ offerdata, setOfferData ] = React.useState( null as any );
  const [ fee, setFee ] = React.useState( 0 );
  const [ wages, setWages ] = React.useState( 0 );

  // set up bools
  const freeagent = playerdata && !playerdata.Team;
  const haspending = hasPendingOffers( offerdata );

  // grab the player data
  React.useEffect( () => {
    IpcService
      .send( IPCRouting.Offer.GET_DATA, {} )
      .then( ({ pdata, odata }) => {
        setOfferData( odata );
        setFee( pdata.transferValue );
        setWages( getWeeklyWages( pdata.monthlyWages ) );
        setPlayerData( pdata );
      });
  }, []);

  if( !playerdata ) {
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
            {playerdata.alias}
          </Typography.Title>
          <Typography.Title level={2}>
            {freeagent ? 'Free Agent' : playerdata.Team.name }
          </Typography.Title>
          <Typography.Text>
            {getEmojiFlag( playerdata.Country.code )}
            <Typography.Text type="secondary">
              {playerdata.Country.name}
            </Typography.Text>
          </Typography.Text>
        </section>
        <section className="asking-price">
          <Statistic
            title="Asking Price"
            prefix="$"
            value={playerdata.transferValue}
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
          {formatCurrency( getWeeklyWages( playerdata.monthlyWages ) )}{'/wk'}
        </Descriptions.Item>
        <Descriptions.Item label="Transfer Value">
          {formatCurrency( playerdata.transferValue )}
        </Descriptions.Item>
        <Descriptions.Item label="Transfer Status">
          {playerdata.transferList ? 'Listed' : 'Not Listed'}
        </Descriptions.Item>
      </Descriptions>

      {/* OFFER STATUS */}
      <Tabs
        defaultActiveKey="make"
        type="card"
        size="small"
        style={{ marginTop: 20 }}
      >
        {/* CURRENT OFFER */}
        <Tabs.TabPane tab="Make Offer" key="make">
          <Form
            layout="vertical"
            onFinish={() => handleFinish( fee, wages, playerdata )}
          >
            <Form.Item label="Transfer Fee">
              <InputNumber
                disabled={haspending}
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
                disabled={haspending}
                value={wages}
                step={500}
                style={{ width: '100%' }}
                formatter={val => formatCurrency( val as number )}
                parser={val => val?.replace( /\$\s?|(,*)/g, '' ) || 0 }
                onChange={val => setWages( val as number )}
              />
            </Form.Item>
            <Form.Item>
              <div className="button-container">
                <Button
                  disabled={haspending}
                  type="primary"
                  size="middle"
                  htmlType="submit"
                  style={{ marginBottom: 10 }}
                >
                  {haspending
                    ? 'Pending Offer'
                    : 'Send offer'
                  }
                </Button>
                <Button
                  size="middle"
                  onClick={handleOnCancel}
                >
                  {'Cancel'}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Tabs.TabPane>

        {/* PAST OFFERS */}
        <Tabs.TabPane tab="Past Offers" key="past">
          {!offerdata || offerdata.length <= 0 && (
            <Empty description="No past offers" />
          )}

          {offerdata && offerdata.length > 0 && (
            <Table
              rowKey="id"
              size="small"
              dataSource={offerdata}
              pagination={{ pageSize: 3, hideOnSinglePage: true }}
            >
              <Table.Column
                title="Fee"
                dataIndex="fee"
                render={f => formatCurrency( f )}
              />
              <Table.Column
                title="Wage"
                dataIndex="wages"
                render={w => formatCurrency( w )}
              />
              <Table.Column
                title="Status"
                dataIndex="status"
                render={s => <OfferStatusTag status={s} />}
              />
            </Table>
          )}
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}


export default Offer;
