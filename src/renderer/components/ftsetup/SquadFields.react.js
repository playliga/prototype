var React = require('react');

var SquadFields = React.createClass({
  render: function(){
    return(
      <form>
        <h1>Select Squad</h1>
        <div className="form-group">
          <button className="btn btn-primary" onClick={this._saveAndContinue}>Finish</button>
        </div>
      </form>
    );
  },

  _saveAndContinue: function(e){
    e.preventDefault();

    this.props.submitFinal();
  }
});

module.exports = SquadFields;
