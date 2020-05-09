import React, { Component } from 'react';
import { Form, Button, Input } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { IterableObject } from 'shared/types';
import { validateForm, handleInputChange, Field, FormContext } from '../common';
import { CountrySelector } from '../components';


const FormItem = Form.Item;


interface Props {
  continents: any[];
  onSubmit: Function;
}


class Two extends Component<Props, IterableObject<Field>> {
  private plaintxtfields = [ 'name' ]

  public state: IterableObject<Field> = {
    name: {
      value: '',
      validateStatus: 'success' as 'success',
      errorMsg: null,
      pristine: true,
      placeholder: 'Team Name',
      icon: <UserOutlined />,
      regex: /^[\w ]+$/
    },
    country: {
      value: '',
      validateStatus: '' as 'success',
      errorMsg: null,
      pristine: true,
      placeholder: '',
      icon: null
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

  private handleSubmit = () => {
    // build the payload
    const payload = {
      name: this.state.name.value,
      country: this.state.country.value
    };

    // pass it back to the parent route
    this.props.onSubmit( payload, 'finish' );
  }

  public render() {
    return (
      <section className="content">
        <h1>{'Team Information'}</h1>

        <Form onFinish={this.handleSubmit}>
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
                  addonBefore={field.icon}
                  onChange={this.handleInputChange}
                />
              </FormItem>
            );
          })}
          <FormItem>
            <CountrySelector
              onChange={this.handleSelectChange}
              continents={this.props.continents}
            />
          </FormItem>
          <Button
            block
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

/* REACT.CONTEXT HOC */
export default ( props: Props ) => (
  <FormContext.Consumer>
    {formdata => (
      <Two
        {...props}
        {...formdata}
      />
    )}
  </FormContext.Consumer>
);
