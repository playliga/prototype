var React = require('react');
var assign = require('object-assign');

var BasicFields = require('./ftsetup/BasicFields.react');
var CareerFields = require('./ftsetup/CareerFields.react');
var SquadFields = require('./ftsetup/SquadFields.react');

var TeamAPIUtils = require('../utils/TeamAPIUtils');
var TeamStore = require('../stores/TeamStore');

var UserAPIUtils = require('../utils/UserAPIUtils');
var UserStore = require('../stores/UserStore');

require('../dbsetup/CountriesData').init();
require('../dbsetup/FreeAgentsData').init();

//------------------
var promises = [];
promises.push( require( '../dbsetup/northamerica/invite.js' ).init() );
promises.push( require( '../dbsetup/northamerica/premier.js' ).init() );

Promise.all( promises ).then( function( data ) {
  console.log( data );
}).catch( function( err ) {
  console.log( err );
});
//------------------

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
    var agentsTeamObj = TeamStore.find('freeagents');
    fieldValues.squadList.map(function(playerObj){
      // if the playerObj is found in the team's squad, remove it.
      var pos = agentsTeamObj.doc.squad.map(function(e){ return e.id }).indexOf(playerObj.id);
      if(pos >= 0) agentsTeamObj.doc.squad.splice(pos, 1);
    });

    TeamAPIUtils.update(agentsTeamObj.doc);
    
    // init the user object and team.
    var userTeamObj = TeamStore.initTeam(fieldValues.teamname);
    userTeamObj.country = fieldValues.teamCountryObj;
    userTeamObj.squad = fieldValues.squadList;
    userTeamObj.budget = 2000.00;

    var userObj = UserStore.initUser(fieldValues.username);
    userObj.country = fieldValues.userCountryObj;

    // first save the team obj then the user.
    TeamAPIUtils.create(userTeamObj).then(function(savedTeamObj){
      userObj.team = savedTeamObj;
      return UserAPIUtils.create(userObj);
    }).then(function(savedUserObj){
      // start...
    });
  }
});

module.exports = Index;
