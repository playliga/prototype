import React from 'react';
import IpcService from 'renderer/lib/ipc-service';
import { Button } from 'antd';
import { FormContext } from '../common';
import * as IPCRouting from 'shared/ipc-routing';


interface Props {
  onSubmit: Function;
  formdata: any[];
}


function Three( props: Props ) {
  const [ , teaminfo ] = props.formdata;
  const [ freeagents, setFreeAgents ] = React.useState<any[]>( null );

  React.useEffect( () => {
    IpcService
      .send( IPCRouting.Database.PROFILE_SQUAD_FREE_AGENTS, { params: { country: teaminfo.country }} )
      .then( data => setFreeAgents( data ) )
    ;
  }, []);

  console.log( freeagents );

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
