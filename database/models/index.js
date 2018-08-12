/* eslint-disable import/no-dynamic-require */
import fs from 'fs';
import path from 'path';
import Sequelize from 'sequelize';
import DBConfig from '../config/config.json';

const basename = path.basename( __filename );
const env = process.env.NODE_ENV || 'development';
const sequelize = new Sequelize( DBConfig[ env ] );
const db = {};

fs
  .readdirSync( __dirname )
  .filter( file => (
    file.indexOf( '.' ) !== 0 && file !== basename && file.slice( -3 ) === '.js'
  ) )
  .forEach( ( file ) => {
    const model = require( path.join( __dirname, file ) );
    db[ model.name ] = model.init( sequelize );
  });

Object.keys( db ).forEach( ( modelName ) => {
  if( db[ modelName ].associate ) {
    db[ modelName ].associate( db );
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
