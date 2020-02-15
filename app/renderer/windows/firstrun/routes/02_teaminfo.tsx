import React, { Component, FormEvent } from 'react';
import { Form, Button, Input, Select, Icon } from 'antd';
import { Continent, Country } from 'main/lib/database/types';
import { validateForm, handleInputChange, Field, FormContext } from '../common';


const FormItem = Form.Item;
const { Option, OptGroup } = Select;


interface State {
  [x: string]: Field;
}


interface Props {
  continents: Continent[];
  onSubmit: Function;
}


class Two extends Component<Props, State> {
  private plaintxtfields = [ 'name' ]

  public state: State = {
    name: {
      value: '',
      validateStatus: 'success' as 'success',
      errorMsg: null,
      pristine: true,
      placeholder: 'Team Name',
      icontype: 'user',
      regex: /^[\w ]+$/
    }
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

  private handleSubmit = ( evt: FormEvent<HTMLFormElement> ) => {
    evt.preventDefault();

    // massage the data and pass it back to
    // the parent route
    this.props.onSubmit({ foo: 'bar' }, 'finish' );
  }

  public render() {
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
            >
              {/* Render continents and their countries as option groups */}
              {this.props.continents.map( ( continent: Continent ) => (
                <OptGroup key={continent.code} label={continent.name}>
                  {continent.countries.map( ( country: Country ) => (
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
