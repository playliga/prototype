var React = require('react');

var BasicFields = React.createClass({
  render: function(){
    return(
      <form>
        <h1>Basic Info</h1>
        <div className="form-group">
          <input  type="text"
                  className="form-control"
                  ref="username"
                  placeholder="Your username"
                  defaultValue={this.props.fieldValues.username}
          />
        </div>
        <div className="form-group">
          <select className="form-control">
            <option>Country</option>
            <option>1</option>
            <option>2</option>
            <option>3</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={this._saveAndContinue}>Save and Continue</button>
      </form>
    );
  },

  _saveAndContinue: function(e){
    e.preventDefault();

    var data = {
      username: this.refs.username.getDOMNode().value
    }
    
    this.props.saveValues(data);
    this.props.nextStep();
  }
});

module.exports = BasicFields
