import * as React from 'react';
import { connect } from 'react-redux';
import { IterableObject } from 'shared/types';


class Connector extends React.Component<any> {
  private static parseSelectors( state: any, selectors: IterableObject<any> ) {
    const vals: IterableObject<any> = {};
    Object
      .keys( selectors )
      .forEach( s => vals[s] = selectors[s]( state ) )
    ;
    return vals;
  }

  public static mapStateToProps( state: any, selectors: IterableObject<any> ) {
    return {
      ...state,
      ...Connector.parseSelectors( state, selectors )
    };
  }

  public static mapDispatchToProps( dispatch: Function ) {
    return { dispatch };
  }

  public static connect( Cmp: any, selectors = {}) {
    return connect(
      state => Connector.mapStateToProps( state, selectors ),
      Connector.mapDispatchToProps
    )( Cmp );
  }
}


export default Connector;
