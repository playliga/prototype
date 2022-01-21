import React from 'react';
import IpcService from 'renderer/lib/ipc-service';
import * as IPCRouting from 'shared/ipc-routing';
import { useParams, RouteComponentProps } from 'react-router';
import { Affix, PageHeader, Spin, Typography } from 'antd';
import { TeamInfoResponse } from 'shared/types';


/**
 * Module constants, variables, and typings
 */

// typings
interface RouteParams {
  id?: string;
}


/**
 * Team Route Component
 */

function Team( props: RouteComponentProps ) {
  const { id } = useParams<RouteParams>();
  const [ basicInfo, setBasicInfo ] = React.useState<TeamInfoResponse>( null );
  const [ loading, setLoading ] = React.useState( true );

  React.useEffect( () => {
    IpcService
      .send( IPCRouting.Database.TEAM_INFO, { params: { id } })
      .then( res => { setBasicInfo( res ); setLoading( false ); })
    ;
  }, []);

  if( loading || !basicInfo ) {
    return (
      <div id="team">
        <PageHeader ghost={false} title={<Spin />} />
      </div>
    );
  }

  return (
    <div id="team">
      {/* RENDER THE HEADER */}
      <Affix>
        <PageHeader
          ghost={false}
          title={'Team Info'}
          onBack={() => props.history.goBack()}
        />
      </Affix>

      {/* RENDER THE TEAM INFO */}
      <section className="content">
        <Typography.Title>
          <span className={`fp ${basicInfo.Country.code.toLowerCase()}`} />
          {basicInfo.name}
        </Typography.Title>
        <img className="img-responsive" src={basicInfo.logo} />
      </section>
    </div>
  );
}


export default Team;
