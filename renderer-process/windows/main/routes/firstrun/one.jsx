// @flow
import React, { Component } from 'react';
import { Form, Button, Input, Select, Icon } from 'antd';
import { validateForm, handleInputChange } from './common';
import { FormContext } from './firstrun';

import type { Field } from './common';


const FormItem = Form.Item;
const { Option, OptGroup } = Select;


type State = {
  [x: string]: Field
};

type Props = {
  continents: Array<Object>,
  onSubmit: Function
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

    // massage the data and pass it back to
    // the parent route
    this.props.onSubmit({ foo: 'bar' }, 'two' );
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
              {/* Render continents and their countries as option groups */}
              {/* @TODO move this to a common lib to be re-used */}
              {this.props.continents.map( ( continent: Object ) => (
                <OptGroup key={continent.code} label={continent.name}>
                  {continent.countries.map( ( country: Object ) => (
                    <Option key={country.name} value={country.name}>
                      {country.emoji}
                      {country.name}
                    </Option>
                  ) )}
                </OptGroup>
              ) )}
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

/* REACT.CONTEXT HOC */
export default ( props: Props ) => (
  <FormContext.Consumer>
    {formdata => (
      <One
        {...props}
        {...formdata}
      />
    )}
  </FormContext.Consumer>
);