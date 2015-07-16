var React = require('react');

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

    this.props.nextStep();
  }
});

var CareerFields = React.createClass({
  render: function(){
    return(
      <form>
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

    this.props.nextStep();
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
    }

    return(
      <div className="container-fluid" id="welcome-splash">
        <CurrentStep
            fieldValues={fieldValues}
            nextStep={this.nextStep}
        />
      </div>
    );
  },

  nextStep: function(){
    this.setState({
      step: this.state.step + 1
    });
  }
});

module.exports = Index;
