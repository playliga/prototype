var React = require('react');
var assign = require('object-assign');

var BasicFields = require('./ftsetup/BasicFields.react');
var CareerFields = require('./ftsetup/CareerFields.react');
var SquadFields = require('./ftsetup/SquadFields.react');

require('../dbsetup/CountriesData').init();
require('../dbsetup/FreeAgentsData').init();

var fieldValues = {
  username: null,
  userCountryCode: null,
  teamname: null,
  teamCountryCode: null,
  squadList: null
};

var LoadingScreen = React.createClass({
  render: function(){
    return(
      <h1 className="no-margin-top">Loading that jawn...</h1>
    );
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
      case 4:
        CurrentStep = LoadingScreen;
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
    // TODO: update freeagents team store by removing the players that the user selected.
    // TODO: initialize other stuff...
    this.nextStep(); // shows the loading component
  }
});

module.exports = Index;
