import React from 'react';
import Connector from 'renderer/screens/main/components/connector';
import { RouteComponentProps } from 'react-router';
import { Alert, Col, Row, Typography, Switch, Card } from 'antd';
import { ApplicationState } from 'renderer/screens/main/types';
import * as profileActions from 'renderer/screens/main/redux/profile/actions';


interface Props extends ApplicationState, RouteComponentProps {
  dispatch: Function;
}


function handleOnChange( checked: boolean, props: Props ) {
  props.dispatch( profileActions.updateSettings({ id: props.profile.data.id, cs16_enabled: checked }) );
}


function Settings( props: Props ) {
  const { settings } = props.profile.data;

  return (
    <div id="settings" className="content">
      <section>
        <Alert
          type="warning"
          message="Warning: This feature is currently experimental. Use at your own risk!"
        />
        <Card style={{ marginTop: 10 }}>
          <Row>
            <Col span={20}>
              <Typography.Text>{'Classic Mode'}</Typography.Text>
            </Col>
            <Col span={4} style={{ textAlign: 'right' }}>
              <Switch
                checked={settings.cs16_enabled}
                onChange={checked => handleOnChange( checked, props )}
              />
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              <Typography.Text type="secondary">
                {'This will launch CS 1.6 instead of CS:GO when playing matches.'}
              </Typography.Text>
            </Col>
          </Row>
        </Card>
      </section>
    </div>
  );
}


export default Connector.connect( Settings );
