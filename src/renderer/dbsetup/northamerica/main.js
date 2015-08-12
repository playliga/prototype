var teamArr = [
  {
    name: '', tag: '', country: 'US', squad: [
      { username: '', skillTemplate: 'Hard', weaponTemplate: 'Rifle' },
      { username: '', skillTemplate: 'Hard', weaponTemplate: 'Rifle' },
      { username: '', skillTemplate: 'Tough', weaponTemplate: 'Sniper' },
      { username: '', skillTemplate: 'Tough', weaponTemplate: 'Rifle' },
      { username: '', skillTemplate: 'Tough', weaponTemplate: 'Rifle' }
    ]
  },
];

var DBSetupUtil = require('../../utils/DBSetupUtil');

module.exports = {
  init: function() {
    return DBSetupUtil.doWork( [ 'US', 'CA' ], teamArr ); 
  }
};
