export interface IterableObject<T> {
  [x: string]: T;
}


export interface IpcRequest<T> {
  responsechannel?: string;
  params?: T;
}


export interface OfferRequest {
  playerid: number;
  wages: number;
  fee?: number;
}
