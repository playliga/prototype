// @flow
import React, { Component } from 'react';
import type { Node } from 'react';

import './animated-link.scss';

type Props = {
  delay?: number,
  animationType?: string,
  children: Node,
  onClick: Function
};

type State = {
  on: boolean
};

class AnimatedLink extends Component<Props, State> {
  props: Props;
  state: State;

  static defaultProps = {
    delay: 100,
    animationType: 'blink'
  };

  state = {
    on: false
  };

  handleClick = () => {
    this.setState({ on: true });

    setTimeout( () => {
      this.props.onClick();
      this.setState({ on: false });
    }, this.props.delay );
  };

  render() {
    return(
      <span
        role={'presentation'}
        onClick={this.handleClick}
        className={this.state.on ? this.props.animationType : ''}
      >
        {this.props.children}
      </span>
    );
  }
}

export default AnimatedLink;