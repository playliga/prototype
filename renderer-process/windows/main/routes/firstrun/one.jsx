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


class One extends Component<Props, State> {
  plaintxtfields = [ 'fname', 'lname', 'alias' ]

  state = {
    fname: {
      value: '',
      validateStatus: 'success',
      errorMsg: null,
      pristine: true,
      placeholder: 'First Name',
      icontype: 'user'
    },
    lname: {
      value: '',
      validateStatus: 'success',
      errorMsg: null,
      pristine: true,
      placeholder: 'Last Name',
      icontype: 'user'
    },
    alias: {
      value: '',
      validateStatus: 'success',
      errorMsg: null,
      pristine: true,
      placeholder: 'Alias',
      icontype: 'robot',
      regex: /^[\w]+$/,
      regexErrorMsg: 'Only alphanumeric & underscores allowed.'
    }
  }

  handleInputChange = ( evt: Object ) => {
    const field = this.state[ evt.target.id ];
    this.setState( handleInputChange( evt.target, field ) );
  }

  handleSubmit = ( evt: Object ) => {
    evt.preventDefault();
    this.props.history.push( '/firstrun/two' );
  }

  render() {
    return (
      <section className="content">
        <h1>{'Welcome!'}</h1>

        <Form onSubmit={this.handleSubmit}>
          {this.plaintxtfields.map( ( id: string, idx: number ) => {
            const field = this.state[ id ];

            return (
              <FormItem
                key={id}
                hasFeedback={!field.pristine}
                validateStatus={field.validateStatus}
                help={field.errorMsg || ''}
              >
                <Input
                  autoFocus={idx === 0}
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
            {'Next'}
          </Button>
        </Form>
      </section>
    );
  }
}

export default One;