var React = require('react');
var Sample = React.createClass({
  render: function(){
    return(
      <h1>Hello, world.</h1>
    );
  }
});

React.render(<Sample />, document.getElementById('app'));
