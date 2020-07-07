import Sequelize, { Model } from 'sequelize';


/**
 * Sequelize models are not written in typescript
 * so their typings will be defined here.
 */

declare module 'main/database/models' {


  class BaseModel extends Model {
    public readonly id: number;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    public static autoinit( sequelize: Sequelize.Sequelize ): void;
    public static associate( models: any ): void;
  }


  export class Continent extends BaseModel {
    public readonly code: string;
    public readonly name: string;
  }


  export class Country extends BaseModel {
    public readonly code: string;
    public readonly name: string;
    public readonly Continent?: Continent;
  }


  export class Compdef extends BaseModel {
    public readonly name: string;
    public readonly season: number;
    public readonly tiers: any[];
    public readonly Continents?: Continent[];
  }


  export class Competition extends BaseModel {
    public readonly data: any;
    public setCompdef: Sequelize.BelongsToSetAssociationMixin<Compdef, number>;
    public setContinents: Sequelize.BelongsToManySetAssociationsMixin<Continent, number>;
  }


  export class Team extends BaseModel {
    public readonly name: string;
    public readonly tier: number;
    public readonly Country?: Country;

    public static findByRegionId( id: number ): Promise<Team[]>;
    public setCountry: Sequelize.BelongsToSetAssociationMixin<Country, number>;
    public getPersonas: Sequelize.HasManyGetAssociationsMixin<Persona>;
  }


  export class Player extends BaseModel {
    public alias: string;
    public tier: number;
    public transferListed: boolean;
    public transferValue: number;
    public monthlyWages: number;
    public eligibleDate: Date;
    public starter: boolean;
    public readonly Team?: Team;

    public setTeam: Sequelize.BelongsToSetAssociationMixin<Team, number>;
    public setCountry: Sequelize.BelongsToSetAssociationMixin<Country, number>;
  }


  export class Profile extends BaseModel {
    public currentDate: Date;
    public readonly Team?: Team;
    public readonly Player?: Player;

    public setTeam: Sequelize.BelongsToSetAssociationMixin<Team, number>;
    public setPlayer: Sequelize.BelongsToSetAssociationMixin<Player, number>;
    public static getActiveProfile(): Promise<Profile>;
  }


  export class PersonaType extends BaseModel {
    public readonly name: string;
  }


  export class Persona extends BaseModel {
    public readonly fname: string;
    public readonly lname: string;
    public readonly Team?: Team;
    public readonly PersonaType?: PersonaType;
    public readonly Country?: Country;

    public setPersonaType: Sequelize.BelongsToSetAssociationMixin<PersonaType, number>;
    public setTeam: Sequelize.BelongsToSetAssociationMixin<Team, number>;
    public static getManagerByTeamId( id: number, type?: string ): Promise<Persona>;
  }


  export class Email extends BaseModel {
    public subject: string;
    public content: string;
    public sentAt: Date;

    public static send( payload: {
      from: Persona;
      to: Player;
      subject: string;
      content: string;
      sentAt: Date;
    }): Promise<number>;
    public setPersona: Sequelize.BelongsToSetAssociationMixin<Persona, number>;
    public setPlayer: Sequelize.BelongsToSetAssociationMixin<Player, number>;
  }


  export class ActionQueue extends BaseModel {
    public type: string;
    public actionDate: Date;
    public payload: any;
  }


  export class TransferOffer extends BaseModel {
    public status: string;
    public fee: number;
    public wages: number;
    public msg: string;

    public setTeam: Sequelize.BelongsToSetAssociationMixin<Team, number>;
    public setPlayer: Sequelize.BelongsToSetAssociationMixin<Player, number>;
    public static getPlayerOffers( id: number ): Promise<TransferOffer[]>;
  }


}
