import React from 'react';
import Connector from 'renderer/screens/main/components/connector';
import GameSettings from 'main/constants/gamesettings';
import { RouteComponentProps } from 'react-router';
import { Col, Row, Typography, Switch, Card, Select } from 'antd';
import { ApplicationState } from 'renderer/screens/main/types';
import * as profileActions from 'renderer/screens/main/redux/profile/actions';
import './settings.scss';


interface Props extends ApplicationState, RouteComponentProps {
  dispatch: Function;
}


function Settings( props: Props ) {
  const { settings } = props.profile.data;

  const handleOnChange = ( data: any ) => {
    props.dispatch( profileActions.updateSettings({
      id:props.profile.data.id,
      ...data
    }));
  };

  return (
    <div id="settings" className="content">
      <section>
        <Typography.Title level={2}>
          {'General'}
        </Typography.Title>
        <Card>
          <Row>
            <Col span={20}>
              <Typography.Text>{'Classic Mode'}</Typography.Text>
              <Typography.Text type="warning">{' (Experimental)'}</Typography.Text>
            </Col>
            <Col span={4} style={{ textAlign: 'right' }}>
              <Switch
                checked={settings.cs16_enabled}
                onChange={checked => handleOnChange({ cs16_enabled: checked })}
              />
            </Col>
          </Row>
          <Typography.Text type="secondary">
            {'This will launch CS 1.6 instead of CS:GO when playing matches.'}
          </Typography.Text>
        </Card>
      </section>
      <section>
        <Typography.Title level={2}>
          {'Match Rules'}
        </Typography.Title>
        <Card>
          <Card.Grid hoverable={false}>
            <Row>
              <Col span={20}>
                <Typography.Text>{'Max Rounds'}</Typography.Text>
              </Col>
              <Col span={4}>
                <Select
                  defaultValue={settings.maxrounds || GameSettings.SERVER_CVAR_MAXROUNDS}
                  onChange={value => handleOnChange({ maxrounds: value })}
                >
                  <Select.Option value={6}>{'6'}</Select.Option>
                  <Select.Option value={10}>{'10'}</Select.Option>
                  <Select.Option value={30}>{'30'}</Select.Option>
                </Select>
              </Col>
            </Row>
          </Card.Grid>
          <Card.Grid hoverable={false}>
            <Row>
              <Col span={20}>
                <Typography.Text>{'Freezetime'}</Typography.Text>
              </Col>
              <Col span={4}>
                <Select
                  defaultValue={settings.freezetime || GameSettings.SERVER_CVAR_FREEZETIME}
                  onChange={value => handleOnChange({ freezetime: value })}
                >
                  <Select.Option value={7}>{'7s'}</Select.Option>
                  <Select.Option value={15}>{'15s'}</Select.Option>
                </Select>
              </Col>
            </Row>
          </Card.Grid>
        </Card>
      </section>
    </div>
  );
}


export default Connector.connect( Settings );
