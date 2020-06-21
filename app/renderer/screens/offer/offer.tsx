import React from 'react';
import moment from 'moment';
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

import * as IPCRouting from 'shared/ipc-routing';
import { OfferRequest } from 'shared/types';
import { OfferStatus } from 'shared/enums';
import { formatCurrency, getWeeklyWages, getMonthlyWages } from 'renderer/lib/util';
import IpcService from 'renderer/lib/ipc-service';


/**
 * Utility functions
 */

function handleFinish( fee: number, weeklywages: number, player: any ) {
  const playerid = player.id;
  const wages = getMonthlyWages( weeklywages );
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


function teamAcceptedOffer( items: any[] ) {
  if( !items ) {
    return false;
  }

  const idx = items.findIndex( i => i.status === OfferStatus.ACCEPTED );
  return idx >= 0;
}


function isEligibleForNegotiations( currentDate: Date, eligibleDate: Date ) {
  if( !currentDate || !eligibleDate ) {
    return false;
  }

  return moment( currentDate ).isSameOrAfter( eligibleDate );
}

/**
 * React functional components
 */

function OfferStatusTag( props: any ) {
  let color;

  switch( props.status ) {
    case OfferStatus.ACCEPTED:
      color = 'green';
      break;
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
  const [ player, setPlayer ] = React.useState( null as any );
  const [ offer, setOffer ] = React.useState( null as any );
  const [ profile, setProfile ] = React.useState( null as any );
  const [ fee, setFee ] = React.useState( 0 );
  const [ wages, setWages ] = React.useState( 0 );

  // set up bools
  const freeagent = player && !player.Team;
  const haspending = hasPendingOffers( offer );
  const teamaccepted = teamAcceptedOffer( offer );
  const iseligible = isEligibleForNegotiations( profile?.currentDate, player?.eligibleDate );

  // grab the player data
  React.useEffect( () => {
    IpcService
      .send( IPCRouting.Offer.GET_DATA, {} )
      .then( ({ playerdata, profiledata, offerdata }) => {
        setFee( playerdata.transferValue );
        setWages( getWeeklyWages( playerdata.monthlyWages ) );
        setOffer( offerdata );
        setProfile( profiledata );
        setPlayer( playerdata );
      });
  }, []);

  if( !player ) {
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
            {player.alias}
          </Typography.Title>
          <Typography.Title level={2}>
            {freeagent ? 'Free Agent' : player.Team.name }
          </Typography.Title>
          <Typography.Text>
            {getEmojiFlag( player.Country.code )}
            <Typography.Text type="secondary">
              {player.Country.name}
            </Typography.Text>
          </Typography.Text>
        </section>
        <section className="asking-price">
          <Statistic
            title="Asking Price"
            prefix="$"
            value={player.transferValue}
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
          {formatCurrency( getWeeklyWages( player.monthlyWages ) )}{'/wk'}
        </Descriptions.Item>
        <Descriptions.Item label="Transfer Value">
          {formatCurrency( player.transferValue )}
        </Descriptions.Item>
        <Descriptions.Item label="Transfer Status">
          {player.transferList || freeagent ? 'Listed' : 'Not Listed'}
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
            onFinish={() => handleFinish( fee, wages, player )}
          >
            {!iseligible && (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No player actions available."
              />
            )}
            {iseligible && !freeagent && !teamaccepted && (
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
            )}
            {iseligible && (
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
            )}
            <Form.Item>
              <div className="button-container">
                <Button
                  disabled={haspending || !iseligible}
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
          {!offer || offer.length <= 0 && (
            <Empty description="No past offers" />
          )}

          {offer && offer.length > 0 && (
            <Table
              rowKey="id"
              size="small"
              dataSource={offer}
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
