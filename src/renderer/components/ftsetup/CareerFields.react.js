var React = require('react');
var Select = require('react-select');
var CountryStore = require('../../stores/CountryStore');

var selectedValue = 'US';

function getStateFromStores(){
  return {
    countries: CountryStore.getAll()
  };
}

var CareerFields = React.createClass({
  getInitialState: function(){
    return getStateFromStores();
  },

  componentDidMount: function(){
    CountryStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function(){
    CountryStore.removeChangeListener(this._onChange);
  },

  render: function(){
    var options = [];
    
    if(typeof(this.state.countries) !== 'undefined' && options.length === 0){
      this.state.countries.map(function(country){
        options.push({ value: country.id, label: country.doc.name });
      });
    };

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
          <Select
              name="form-field-name"
              options={options}
              onChange={this._selectOnChange}
          />
        </div>
        <button className="btn btn-primary" onClick={this._saveAndContinue}>Save and Continue</button>
      </form>
    );
  },

  _selectOnChange: function(val){
    selectedValue = val;
  },

  _onChange: function(){
    this.setState(getStateFromStores());
  },

  _saveAndContinue: function(e){
    e.preventDefault();
    
    var data = {
      teamname: this.refs.teamname.getDOMNode().value,
      teamCountryCode: selectedValue
    }

    this.props.saveValues(data);
    this.props.nextStep();
  }
});

module.exports = CareerFields;
