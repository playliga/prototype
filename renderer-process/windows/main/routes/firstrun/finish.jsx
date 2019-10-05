// @flow
import React, { Component } from 'react';
import { Spin } from 'antd';
import { FormContext } from './firstrun';


type Props = {
  // @TODO
};


// eslint-disable-next-line
class Finish extends Component<Props> {
  render() {
    return (
      <section className="content">
        <h1>{'Finishing...'}</h1>
        <Spin />
      </section>
    );
  }
}

/* REACT.CONTEXT HOC */
export default ( props: Props ) => (
  <FormContext.Consumer>
    {formdata => (
      <Finish
        {...props}
        {...formdata}
      />
    )}
  </FormContext.Consumer>
);