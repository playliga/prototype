var React = require('react');
var assign = require('object-assign');

var BasicFields = require('./ftsetup/BasicFields.react');
var CareerFields = require('./ftsetup/CareerFields.react');
var SquadFields = require('./ftsetup/SquadFields.react');

var TeamActionCreators = require('../actions/TeamActionCreators');
var TeamStore = require('../stores/TeamStore');

var UserActionCreators = require('../actions/UserActionCreators');
var UserStore = require('../stores/UserStore');

require('../dbsetup/CountriesData').init();
require('../dbsetup/FreeAgentsData').init();

function getStateFromStores(){
  return {
    teams: TeamStore.getAll()
  };
}

var fieldValues = {
  username: null,
  userCountryObj: null,
  teamname: null,
  teamCountryObj: null,
  squadList: null
};

var LoadingScreen = React.createClass({
  render: function(){
    return(
      <div className="progress">
        <div className="progress-bar progress-bar-striped active" role="progressbar" style={{width: '100%' }}>
          <span className="sr-only">Working...</span>
        </div>
      </div>
    );
  }
});

var Index = React.createClass({
  getInitialState: function(){
    return assign({
      step: 1
    }, getStateFromStores());
  },

  componentDidMount: function(){
    TeamStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function(){
    TeamStore.removeChangeListener(this._onChange);
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
  
  _onChange: function(){
    this.setState(getStateFromStores);
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
    this.nextStep(); // shows the loading component

    // update free agents team store by removing the players that the user selected
    var playerIdArr = [];
    fieldValues.squadList.map(function(playerObj){
      playerIdArr.push(playerObj.id);
    });

    TeamActionCreators.removePlayers(this.state.teams[0].doc, playerIdArr);
    
    // TODO: create the user's team
    var teamObj = TeamStore.initTeam(fieldValues.teamname);
    teamObj.country = fieldValues.countryObj;
    teamObj.squad = fieldValues.squadList;

    // TODO: create the user object
    // using the team object returned by the database.
  }
});

module.exports = Index;
