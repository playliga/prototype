import React from 'react';
import { Button } from 'antd';
import { FormContext } from '../common';


interface Props {
  onSubmit: Function;
}


function Three( props: Props ) {
  return (
    <section className="content">
      <h1>{'Squad Information'}</h1>
      <Button
        block
        type="primary"
        onClick={() => props.onSubmit( null, 'finish' )}
      >
        {'Next'}
      </Button>
    </section>
  );
}


export default ( props: Props ) => (
  <FormContext.Consumer>
    {formdata => (
      <Three
        {...props}
        {...formdata}
      />
    )}
  </FormContext.Consumer>
);
