import { Model } from 'sequelize';
import { BelongsToSetAssociationMixin } from 'sequelize/types';


/**
 * Sequelize models are not written in typescript
 * so their typings will be defined here.
 */

declare module 'main/database/models' {


  export class Country extends Model {}


  export class Team extends Model {
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    public setCountry: BelongsToSetAssociationMixin<Country, number>;
  }


  export class Player extends Model {
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    public setTeam: BelongsToSetAssociationMixin<Team, number>;
    public setCountry: BelongsToSetAssociationMixin<Country, number>;
  }


  export class Profile extends Model {
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    public setTeam: BelongsToSetAssociationMixin<Team, number>;
    public setPlayer: BelongsToSetAssociationMixin<Player, number>;
  }


}
