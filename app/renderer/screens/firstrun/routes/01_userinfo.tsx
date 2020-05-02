import React, { Component, FormEvent } from 'react';
import { Form, Button, Input, Select, Icon } from 'antd';
import { getEmojiFlag } from 'countries-list';
import { validateForm, handleInputChange, Field, FormContext } from '../common';


const FormItem = Form.Item;
const { Option, OptGroup } = Select;


interface State {
  [x: string]: Field;
}


interface Props {
  continents: any[];
  onSubmit: Function;
}


class One extends Component<Props, State> {
  private plaintxtfields = [ 'fname', 'lname', 'alias' ]

  public state: State = {
    fname: {
      value: '',
      validateStatus: 'success' as 'success',
      errorMsg: null,
      pristine: true,
      placeholder: 'First Name',
      icontype: 'user'
    },
    lname: {
      value: '',
      validateStatus: 'success' as 'success',
      errorMsg: null,
      pristine: true,
      placeholder: 'Last Name',
      icontype: 'user'
    },
    alias: {
      value: '',
      validateStatus: 'success' as 'success',
      errorMsg: null,
      pristine: true,
      placeholder: 'Alias',
      icontype: 'robot',
      regex: /^[\w]+$/,
      regexErrorMsg: 'Only alphanumeric & underscores allowed.'
    },
    country: {
      value: '',
      validateStatus: '' as 'success',
      errorMsg: null,
      pristine: true,
      placeholder: '',
      icontype: ''
    },
  }

  private handleInputChange = ( evt: React.ChangeEvent ) => {
    const field = this.state[ evt.target.id ];
    this.setState(
      handleInputChange(
        evt.target as HTMLInputElement,
        field
      )
    );
  }

  private handleSelectChange = ( value: string ) => {
    const country = this.state.country;
    country.value = value;
    country.pristine = false;
    this.setState({ country });
  }

  private handleSubmit = ( evt: FormEvent<HTMLFormElement> ) => {
    evt.preventDefault();

    // build the payload
    const payload = {
      name: `${this.state.fname.value} ${this.state.lname.value}`,
      alias: this.state.alias.value,
      country: this.state.country.value
    };

    // pass it back to the parent route
    this.props.onSubmit( payload, 'two' );
  }

  public render() {
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
                  value={field.value || undefined}
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
              onChange={this.handleSelectChange}
            >
              {/* Render continents and their countries as option groups */}
              {/* @TODO move this to a common lib to be re-used */}
              {this.props.continents.map( ( continent: any ) => (
                <OptGroup key={continent.code} label={continent.name}>
                  {continent.Countries.map( ( country: any ) => (
                    <Option key={country.name} value={country.name}>
                      {getEmojiFlag(country.code)}
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
