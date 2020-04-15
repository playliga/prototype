export interface IterableObject<T> {
  [x: string]: T;
}


export interface IpcRequest<T> {
  responsechannel?: string;
  params?: T;
}
