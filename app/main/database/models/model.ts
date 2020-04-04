import { IterableObject } from 'main/types';
import Database from '../database';


export default class Model {
  // built-in property appended to all nedb records
  public _id = '';

  // the nedb connection id
  public static connection = '';

  // base model can contain any kind of props
  // mapping it to the database record
  [x: string]: any;

  /**
   * Constructor
   *
   * Dynamically loads the provided properties
   * into the model's property list.
   */
  constructor( props: IterableObject<any> = {} ) {
    Object
      .keys( props )
      .forEach( k => this[ k ] = props[ k ] )
    ;
  }

  /**
   * Getter for the datastore.
   *
   * Loads the datastore from the Database singleton object.
   */
  public get datastore() {
    // access child static properties using `this.constructor`
    const ctr = this.constructor as unknown as Model;
    return Database.datastores[ ctr.connection ];
  }

  /**
   * Save the model to the db.
   *
   * If the model has already been saved then it will
   * perform an update instead of a fresh insert.
   */
  public save(): Promise<unknown> {
    // if this is a new model instance that hasn't been saved to the
    // db yet (_id is still blank), remove it from the instance.
    //
    // (we want nedb to generate one for us)
    if( this._id.length === 0 ) {
      delete this._id;
    }

    // if _id is already set in our object,
    // we're updating instead of an insert
    if( this._id && this._id.length > 0 ) {
      return this.datastore.update({ _id: this._id }, this );
    }

    // if inserting a new record, we must wait for the
    // response in order to update our _id property
    return new Promise( resolve => {
      this.datastore.insert( this ).then( r => {
        this._id = r._id;
        resolve( r );
      });
    });
  }

  /**
   * Find records and transform them into a model instances.
   */
  public static find( query = {} ): Promise<Model[]> {
    return new Promise( resolve => {
      Database.datastores[ this.connection ]
        .find( query )
        .then( records => {
          const formatted = records.map( r => new this({ ...r }) );
          resolve( formatted );
        })
      ;
    });
  }

  public static findOne( query = {} ): Promise<Model> {
    return new Promise( resolve => {
      Database.datastores[ this.connection ]
        .findOne( query )
        .then( record => resolve( new this({ ...record }) ) )
      ;
    });
  }
}
