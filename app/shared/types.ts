export interface IterableObject<T> {
  [x: string]: T;
}


export interface IpcRequest<T> {
  responsechannel?: string;
  params?: T;
}


export interface OfferRequest {
  teamid?: number;
  playerid: number;
  wages: number;
  fee?: number;
}
