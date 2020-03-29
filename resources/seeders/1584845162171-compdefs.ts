const data = [
  {
    id: 'esea',
    name: 'ESEA',
    regions: [ 'eu', 'na' ],
    season: 32,
    tiers: [
      {
        name: 'Premier',
        minlen: 20,
        confsize: 20,
      },
      {
        name: 'Advanced',
        minlen: 20,
        confsize: 20,
      },
      {
        name: 'Main',
        minlen: 20,
        confsize: 20,
      },
      {
        name: 'Intermediate',
        minlen: 56,
        confsize: 8,
      },
      {
        name: 'Open',
        minlen: 96,
        confsize: 8,
      },
    ]
  },
  {
    id: 'eslpro',
    name: 'ESL Pro',
    regions: [ 'eu' ],
    season: 12,
    tiers: 0
  }
];


export default class Seeder {
  static up( docs: any ) {
    return docs.compdefs.insert( data );
  }

  static down( db: any ) {
    // @todo: should return a promise
  }
}
