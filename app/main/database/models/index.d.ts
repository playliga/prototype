import { Model, Sequelize } from 'sequelize';
import { BelongsToSetAssociationMixin } from 'sequelize/types';


/**
 * Sequelize models are not written in typescript
 * so their typings will be defined here.
 */

declare module 'main/database/models' {


  class BaseModel extends Model {
    public static autoinit( sequelize: Sequelize ): void;
    public static associate( models: any ): void;
  }


  export class Country extends BaseModel {}


  export class Team extends BaseModel {
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    public setCountry: BelongsToSetAssociationMixin<Country, number>;
  }


  export class Player extends BaseModel {
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    public setTeam: BelongsToSetAssociationMixin<Team, number>;
    public setCountry: BelongsToSetAssociationMixin<Country, number>;
  }


  export class Profile extends BaseModel {
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    public setTeam: BelongsToSetAssociationMixin<Team, number>;
    public setPlayer: BelongsToSetAssociationMixin<Player, number>;
  }


}
