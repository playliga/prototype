// @flow
import React, { Component } from 'react';
import { Form, Button, Input, Select, Icon } from 'antd';
import { validateForm, handleInputChange } from './common';
import type { Field } from './common';


const FormItem = Form.Item;
const { Option, OptGroup } = Select;


type State = {
  [x: string]: Field
};

type Props = {
  history: Object
};


class Two extends Component<Props, State> {
  plaintxtfields = [ 'name' ]

  state = {
    name: {
      value: '',
      validateStatus: 'success',
      errorMsg: null,
      pristine: true,
      placeholder: 'Team Name',
      icontype: 'user',
      regex: /^[\w ]+$/
    }
  }

  handleInputChange = ( evt: Object ) => {
    const field = this.state[ evt.target.id ];
    this.setState( handleInputChange( evt.target, field ) );
  }

  handleSubmit = ( evt: Object ) => {
    evt.preventDefault();
    this.props.history.push( '/firstrun/finish' );
  }

  render() {
    return (
      <section className="content">
        <h1>{'Team Info!'}</h1>

        <Form onSubmit={this.handleSubmit}>
          {this.plaintxtfields.map( ( id: string ) => {
            const field = this.state[ id ];

            return (
              <FormItem
                key={id}
                hasFeedback={!field.pristine}
                validateStatus={field.validateStatus}
                help={field.errorMsg || ''}
              >
                <Input
                  autoFocus
                  id={id}
                  placeholder={field.placeholder}
                  value={field.value || null}
                  addonBefore={<Icon type={field.icontype} />}
                  onChange={this.handleInputChange}
                />
              </FormItem>
            );
          })}
          <FormItem>
            <Select
              showSearch
              placeholder="Select a Country"
              optionFilterProp="children"
            >
              <OptGroup label={'North America'}>
                <Option value="1">Jack</Option>
                <Option value="2">Lucy</Option>
                <Option value="3">Tom</Option>
              </OptGroup>
            </Select>
          </FormItem>
          <Button
            type="primary"
            htmlType="submit"
            disabled={validateForm( this.state )}
          >
            {'Finish'}
          </Button>
        </Form>
      </section>
    );
  }
}

export default Two;