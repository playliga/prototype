import * as React from 'react';
import { connect } from 'react-redux';


class Connector extends React.Component<{}> {
  public static mapStateToProps( state: object ) {
    return state;
  }

  public static mapDispatchToProps( dispatch: Function ) {
    return { dispatch };
  }

  // @ts-ignore
  public static connect( Cmp ) {
    return connect(
      Connector.mapStateToProps,
      Connector.mapDispatchToProps
    )( Cmp );
  }
}

export default Connector;
