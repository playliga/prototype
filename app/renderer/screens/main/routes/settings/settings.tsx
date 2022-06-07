import React from 'react';
import Connector from 'renderer/screens/main/components/connector';
import Application from 'main/constants/application';
import GameSettings from 'main/constants/gamesettings';
import IpcService from 'renderer/lib/ipc-service';
import { RouteComponentProps } from 'react-router';
import { Col, Row, Typography, Switch, Card, Select, Button, InputNumber, Form, Input } from 'antd';
import { ApplicationState } from 'renderer/screens/main/types';
import { parseMapForMatch } from 'shared/util';
import * as profileActions from 'renderer/screens/main/redux/profile/actions';
import * as IPCRouting from 'shared/ipc-routing';
import './settings.scss';


interface Props extends ApplicationState, RouteComponentProps {
  dispatch: Function;
}


function Settings( props: Props ) {
  const { settings } = props.profile.data;
  const [ working, setWorking ] = React.useState( false );

  const handleOnChange = ( data: any ) => {
    props.dispatch( profileActions.updateSettings({
      id:props.profile.data.id,
      ...data
    }));
  };

  return (
    <div id="settings" className="content">
      {/* GENERAL SETTINGS */}
      <section>
        <Typography.Title level={2}>
          {'General'}
        </Typography.Title>
        <Card>
          <Card.Grid hoverable={false}>
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
          </Card.Grid>
        </Card>
      </section>

      {/* MATCH RULES */}
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
          <Card.Grid hoverable={false}>
            <Row>
              <Col span={20}>
                <Typography.Text>{'Map Override'}</Typography.Text>
              </Col>
              <Col span={4}>
                <Select
                  defaultValue={settings.map_override || null}
                  onChange={value => handleOnChange({ map_override: value })}
                >
                  <Select.Option value={null}>{'None'}</Select.Option>
                  {Application.MAP_POOL.map( map => (
                    <Select.Option
                      value={map}
                      key={map}
                    >
                      {parseMapForMatch(map, settings.cs16_enabled)}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
            </Row>
          </Card.Grid>
        </Card>
      </section>

      {/* DEBUGGING SETTINGS */}
      <section>
        <Typography.Title level={2}>
          {'Debug'}
        </Typography.Title>
        <Card>
          <Card.Grid hoverable={false}>
            <Row>
              <Col span={20}>
                <Typography.Text>{'Regenerate Player Stats'}</Typography.Text>
              </Col>
              <Col span={4}>
                <Button
                  block
                  loading={working}
                  type="primary"
                  onClick={() => {
                    setWorking( true );
                    IpcService
                      .send( IPCRouting.Database.PROFILE_SQUAD_TRAIN_ALL )
                      .then( () => setWorking( false ) )
                    ;
                  }}
                >
                  {'Regenerate'}
                </Button>
              </Col>
            </Row>
            <Typography.Text type="secondary">
              {'Initiates a training session for all players in the database. This may take some time!'}
            </Typography.Text>
          </Card.Grid>
          <Card.Grid hoverable={false}>
            <Row>
              <Col span={20}>
                <Typography.Text>{'Simulation Modes'}</Typography.Text>
              </Col>
              <Col span={4}>
                <Select
                  defaultValue={settings.sim_mode || Application.SIM_MODE_DEFAULT}
                  onChange={value => handleOnChange({ sim_mode: value })}
                >
                  <Select.Option value={Application.SIM_MODE_DEFAULT}>{'Default'}</Select.Option>
                  <Select.Option value={Application.SIM_MODE_ALWAYS_WIN}>{'Always Win'}</Select.Option>
                  <Select.Option value={Application.SIM_MODE_ALWAYS_LOSE}>{'Always Lose'}</Select.Option>
                </Select>
              </Col>
            </Row>
          </Card.Grid>
        </Card>

        {/* CALENDAR SUB-SETTINGS */}
        <aside>
          <Typography.Text type="secondary">
            <span className="small-caps">
              {'Calendar Loop'}
            </span>
          </Typography.Text>
          <Card>
            <Card.Grid hoverable={false}>
              <Row>
                <Col span={18}>
                  <Typography.Text>{'Loop Until'}</Typography.Text>
                </Col>
                <Col span={6}>
                  <Form.Item>
                    <Input.Group compact>
                      <Form.Item noStyle>
                        <InputNumber
                          min={1}
                          max={999}
                          defaultValue={settings.sim_loop_iterations || Application.CALENDAR_LOOP_MAX_ITERATIONS}
                          onChange={value => handleOnChange({ sim_loop_iterations: value })}
                        />
                      </Form.Item>
                      <Form.Item noStyle>
                        <Select
                          defaultValue={settings.sim_loop_multiplier || Application.CALENDAR_LOOP_UNIT_MULTIPLIERS[ 0 ]}
                          onChange={value => handleOnChange({ sim_loop_multiplier: value })}
                        >
                          {Application.CALENDAR_LOOP_UNIT_MULTIPLIERS.map( unit => (
                            <Select.Option key="unit" value={unit}>{unit}</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Input.Group>
                  </Form.Item>
                </Col>
              </Row>
            </Card.Grid>
            <Card.Grid hoverable={false}>
              <Row>
                <Col span={18}>
                  <Typography.Text>{'Ignore Loop Exits'}</Typography.Text>
                </Col>
                <Col span={6} style={{ textAlign: 'right' }}>
                  <Switch
                    checked={settings.sim_ignore_bail}
                    onChange={checked => handleOnChange({ sim_ignore_bail: checked })}
                  />
                </Col>
              </Row>
              <Typography.Text type="secondary">
                {'Usually the calendar loop is stopped for things like matchdays and e-mails. This ignores that.'}
              </Typography.Text>
            </Card.Grid>
          </Card>
        </aside>
      </section>
    </div>
  );
}


export default Connector.connect( Settings );
