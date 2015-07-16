var React = require('react');

var CareerFields = React.createClass({
  render: function(){
    return(
      <form>
        <h1>Team Info</h1>
        <div className="form-group">
          <input  type="text"
                  className="form-control"
                  ref="teamname"
                  placeholder="Your team's name"
                  defaultValue={this.props.fieldValues.teamname}
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
      teamname: this.refs.teamname.getDOMNode().value
    }

    this.props.saveValues(data);
    this.props.nextStep();
  }
});

module.exports = CareerFields;
