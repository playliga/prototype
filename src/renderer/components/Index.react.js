var React = require('react');
var assign = require('object-assign');

var fieldValues = {
  username: null,
  user_countrycode: null,
  teamname: null,
  team_countrycode: null
};

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
    console.log(this.props.fieldValues);
  }
});

var Index = React.createClass({
  getInitialState: function(){
    return({
      step: 1
    });
  },
  render: function(){
    var CurrentStep = null;

    switch(this.state.step){
      case 1:
        CurrentStep = BasicFields;
        break;
      case 2:
        CurrentStep = CareerFields;
        break;
      case 3:
        CurrentStep = SquadFields;
        break;
    }

    return(
      <div className="container-fluid" id="welcome-splash">
        <CurrentStep
            fieldValues={fieldValues}
            nextStep={this.nextStep}
            saveValues={this.saveValues}
            submitFinal={this.submitFinal}
        />
      </div>
    );
  },

  nextStep: function(){
    this.setState({
      step: this.state.step + 1
    });
  },
  saveValues: function(field_value){
    return function(){
      fieldValues = assign({}, fieldValues, field_value);
    }.bind(this)()
  },
  submitFinal: function(){
    // process everything and begin the career
  }
});

module.exports = Index;
