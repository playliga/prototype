import React from 'react';
import moment from 'moment';
import { ipcRenderer } from 'electron';
import { UserOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { red } from '@ant-design/colors';
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
  Tag,
  Space
} from 'antd';

import * as IPCRouting from 'shared/ipc-routing';
import { OfferRequest, OfferReview } from 'shared/types';
import { OfferStatus } from 'shared/enums';
import { formatCurrency, getWeeklyWages, getMonthlyWages } from 'renderer/lib/util';
import IpcService from 'renderer/lib/ipc-service';


/**
 * Utility functions
 */

function handleSendFinish( fee: number, weeklywages: number, player: any ) {
  const playerid = player.id;
  const wages = getMonthlyWages( weeklywages );
  const params: OfferRequest = { playerid, wages, fee };

  IpcService
    .send( IPCRouting.Offer.SEND, { params })
    .then( () => ipcRenderer.send( IPCRouting.Offer.CLOSE ) )
  ;
}


function handleReviewFinish( offerdata: any, status: string ) {
  const params: OfferReview = { offerid: offerdata.id, status };
  IpcService.send( IPCRouting.Offer.REVIEW, { params });
}


function handleCancel() {
  ipcRenderer.send( IPCRouting.Offer.CLOSE );
}


function getPendingOffers( items: any[] ) {
  if( !items ) {
    return [];
  }

  return items.filter( i => i.status === OfferStatus.PENDING );
}


function teamAcceptedOffer( items: any[] ) {
  if( !items ) {
    return false;
  }

  const idx = items.findIndex( i => i.status === OfferStatus.ACCEPTED );
  return idx >= 0;
}


function isEligibleForNegotiations( currentDate: Date, eligibleDate: Date | null ) {
  // eligible by default
  if( !eligibleDate ) {
    return true;
  }

  // otherwise, check if eligible by
  // checking against today's date
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


function BuyTabs( props: any ) {
  const [ fee, setFee ] = React.useState( props.initialFee );
  const [ wages, setWages ] = React.useState( props.initialWages );

  // set up bools
  const freeagent = props.player && !props.player.Team;
  const haspending = getPendingOffers( props.offers ).length > 0;
  const teamaccepted = teamAcceptedOffer( props.offers );
  const iseligible = isEligibleForNegotiations( props.profile?.currentDate, props.player?.eligibleDate );

  const { earnings } = props.profile.Team;
  const totalcost = ( wages || props.player.monthlyWages ) + ( fee || props.player.monthlyWages );
  const cannotafford = totalcost > earnings;

  return (
    <Tabs
      defaultActiveKey="make"
      type="card"
      size="small"
    >
      {/* RENDER BUY FORM */}
      <Tabs.TabPane tab="Make Offer" key="make">
        <Form layout="vertical" onFinish={() => props.onFinish( fee, wages, props.player )}>
          {!iseligible && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No player actions available."
            />
          )}
          {iseligible && !freeagent && !teamaccepted && (
            <Form.Item label="Transfer Fee" validateStatus={cannotafford && 'error'} help={cannotafford && 'You cannot afford this player\'s transfer fee.'}>
              <InputNumber
                disabled={haspending}
                value={fee}
                step={500}
                min={0}
                style={{ width: '100%' }}
                formatter={val => formatCurrency( val as number )}
                parser={val => val?.replace( /\$\s?|(,*)/g, '' ) || 0 }
                onChange={val => setFee( val )}
              />
            </Form.Item>
          )}
          {iseligible && (
            <Form.Item label="Player Wage" validateStatus={cannotafford && 'error'} help={cannotafford && 'You cannot afford this player\'s wages.'}>
              <InputNumber
                disabled={haspending}
                value={wages}
                step={500}
                min={0}
                style={{ width: '100%' }}
                formatter={val => formatCurrency( val as number )}
                parser={val => val?.replace( /\$\s?|(,*)/g, '' ) || 0 }
                onChange={val => setWages( val )}
              />
            </Form.Item>
          )}
          <Form.Item>
            <div className="button-container">
              <Button
                disabled={haspending || !iseligible || cannotafford || props.loading}
                type="primary"
                size="middle"
                htmlType="submit"
                style={{ marginBottom: 10 }}
              >
                {props.loading && <Spin size="small" style={{ marginRight: 5 }}/>}
                {haspending
                  ? 'Pending Offer'
                  : 'Send offer'
                }
              </Button>
              <Button size="middle" onClick={props.onCancel}>
                {'Cancel'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Tabs.TabPane>

      {/* VIEW PAST OFFERS */}
      <Tabs.TabPane tab="Past Offers" key="past">
        {!props.offers || props.offers.length <= 0 && (
          <Empty description="No past offers" />
        )}

        {props.offers && props.offers.length > 0 && (
          <Table
            rowKey="id"
            size="small"
            dataSource={props.offers}
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
  );
}


function ReviewActions( props: any ) {
  return (
    <Space>
      <Button
        type="primary"
        shape="circle"
        size="small"
        icon={<CheckOutlined />}
        onClick={props.onAccept}
      />
      <Button
        danger
        shape="circle"
        size="small"
        icon={<CloseOutlined />}
        onClick={props.onReject}
      />
    </Space>
  );
}


function ReviewTabs( props: any ) {
  // set up bools
  const pending = getPendingOffers( props.offers );

  return (
    <Tabs
      defaultActiveKey="review"
      type="card"
      size="small"
    >
      <Tabs.TabPane tab="Review Offers" key="review">
        <Form>
          {pending.length <= 0 && (
            <Form.Item>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No offers to review."
              />
            </Form.Item>
          )}

          {pending.length > 0 && (
            <Form.Item>
              <Table
                rowKey="id"
                size="small"
                dataSource={pending}
                pagination={{ pageSize: 3, hideOnSinglePage: true }}
              >
                <Table.Column
                  title="From"
                  dataIndex="Team"
                  render={t => t.name}
                />
                <Table.Column
                  title="Fee"
                  dataIndex="fee"
                  render={f => formatCurrency( f )}
                />
                <Table.Column
                  title="Actions"
                  key="actions"
                  render={item => (
                    <ReviewActions
                      onAccept={() => props.onFinish( item, OfferStatus.ACCEPTED )}
                      onReject={() => props.onFinish( item, OfferStatus.REJECTED )}
                    />
                  )}
                />
              </Table>
            </Form.Item>
          )}
        </Form>

        <div className="button-container">
          <Button size="middle" onClick={props.onCancel}>
            {'Cancel'}
          </Button>
        </div>
      </Tabs.TabPane>
    </Tabs>
  );
}


function Offer() {
  const [ player, setPlayer ] = React.useState( null as any );
  const [ offers, setOffers ] = React.useState( null as any );
  const [ profile, setProfile ] = React.useState( null as any );
  const [ fee, setFee ] = React.useState( 0 );
  const [ wages, setWages ] = React.useState( 0 );
  const [ loading, setLoading ] = React.useState( false );

  // grab the player data
  React.useEffect( () => {
    IpcService
      .send( IPCRouting.Offer.GET_DATA, {} )
      .then( ({ playerdata, profiledata, offerdata }) => {
        setFee( playerdata.transferValue );
        setWages( getWeeklyWages( playerdata.monthlyWages ) );
        setOffers( offerdata );
        setProfile( profiledata );
        setPlayer( playerdata );
      });
  }, []);

  if( !player || !profile ) {
    return (
      <div id="offer-root" className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  // set up bools
  const freeagent = !player.Team;
  const ismine = !freeagent && profile.Team.id === player.Team.id;
  const totalcost = player.monthlyWages + player.transferValue;

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
            <span className={`fp ${player.Country.code.toLowerCase()}`} />
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
        column={4}
        style={{ marginTop: 20, marginBottom: 20 }}
      >
        <Descriptions.Item label="Wage">
          {formatCurrency( getWeeklyWages( player.monthlyWages ) )}{'/wk'}
        </Descriptions.Item>
        <Descriptions.Item label="Transfer Value">
          {formatCurrency( player.transferValue )}
        </Descriptions.Item>
        <Descriptions.Item label="Your Earnings">
          <span style={profile.Team.earnings < totalcost ? { color: red.primary } : {}}>{formatCurrency( profile.Team.earnings )}</span>
        </Descriptions.Item>
        <Descriptions.Item label="Transfer Status">
          {player.transferList || freeagent ? 'Listed' : 'Not Listed'}
        </Descriptions.Item>
      </Descriptions>

      {/* NOT MY PLAYER; I CAN BUY */}
      {!ismine && (
        <BuyTabs
          {...{ player, profile, offers }}
          initialFee={fee}
          initialWages={wages}
          loading={loading}
          onCancel={handleCancel}
          onFinish={( fee: number, weeklywages: number, player: any ) => { setLoading( true ); handleSendFinish( fee, weeklywages, player ); }}
        />
      )}

      {/* MY PLAYER; REVIEW OFFERS */}
      {ismine && (
        <ReviewTabs
          {...{ player, profile, offers }}
          onCancel={handleCancel}
          onFinish={handleReviewFinish}
        />
      )}
    </div>
  );
}


export default Offer;
