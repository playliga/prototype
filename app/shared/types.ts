export interface IterableObject<T> {
  [x: string]: T;
}


export interface IpcRequest<T> {
  responsechannel?: string;
  params?: T;
}


export interface OfferRequest {
  teamdata?: any;
  playerid: number;
  wages: number;
  fee?: number;
}


export interface OfferReview {
  offerid: number;
  status: string;
  fee?: number;
}
