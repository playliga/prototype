class Competitor {
  public id: number;
  public name: string;
  public tier: number;

  constructor( id: number, name: string, tier: number = null ) {
    this.id = id;
    this.name = name;
    this.tier = tier;
  }
}


export default Competitor;
