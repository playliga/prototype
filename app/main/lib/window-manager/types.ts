import { BrowserWindow } from 'electron';


export interface Window {
  id: string;
  handle: BrowserWindow;
}


export interface Windows {
  [x: string]: Window;
}
