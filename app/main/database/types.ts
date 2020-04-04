export interface DatabaseConfig {
  basepath: string;
  connections: string[];
}


export interface DatabaseRecord {
  _id: string;
  [x: string]: unknown;
}
