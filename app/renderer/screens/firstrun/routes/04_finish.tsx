import React, { Component } from 'react';
import { Spin } from 'antd';
import { FormContext } from '../common';


class Finish extends Component<unknown> {
  public render() {
    return (
      <section className="content">
        <h1>{'Finishing...'}</h1>
        <Spin />
      </section>
    );
  }
}


/* REACT.CONTEXT HOC */
export default ( props: {} ) => (
  <FormContext.Consumer>
    {formdata => (
      <Finish
        {...props}
        {...formdata}
      />
    )}
  </FormContext.Consumer>
);
