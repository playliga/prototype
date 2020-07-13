import path from 'path';
import is from 'electron-is';
import { ipcMain, Menu, IpcMainEvent } from 'electron';

import * as IPCRouting from 'shared/ipc-routing';
import * as WorldGen from 'main/lib/worldgen';
import { IpcRequest, OfferRequest, OfferReview } from 'shared/types';
import { TransferOffer, Profile } from 'main/database/models';
import { Player } from 'main/database/models';
import { Screen } from 'main/lib/screen-manager/types';
import ScreenManager from 'main/lib/screen-manager';
import DefaultMenuTemplate from 'main/lib/default-menu';
import { OfferStatus } from 'shared/enums';


/**
 * Module level variables, constants, and types
 */

// variables
let _screen: Screen;
let _playerid: number;


// constants
const PORT = process.env.PORT || 3000;
const WIDTH = 550;
const HEIGHT = 550;
const CONFIG = {
  url: is.production()
    ? `file://${path.join( __dirname, 'dist/renderer/screens/offer/index.html' )}`
    : `http://localhost:${PORT}/screens/offer/index.html`,
  opts: {
    backgroundColor: '#f5f5f5', // "whitesmoke"
    width: WIDTH,
    height: HEIGHT,
    minWidth: WIDTH,
    minHeight: HEIGHT,
    maximizable: false,
    resizable: false,
    movable: false,
    minimizable: false
  }
};


/**
 * Screen IPC handlers
 */

async function openWindowHandler( evt: IpcMainEvent, playerid: number ) {
  // this will be used later in order to
  // pass the data back to the modal
  _playerid = playerid;

  // our parent is the main screen
  const MainScreen = ScreenManager.getScreenById( IPCRouting.Main._ID );

  // attach parent to the default opts
  const opts = {
    ...CONFIG.opts,
    parent: MainScreen.handle,
    modal: true
  };

  _screen = ScreenManager.createScreen( IPCRouting.Offer._ID, CONFIG.url, opts );
  _screen.handle.setMenu( DefaultMenuTemplate );

  // the `setMenu` function above doesn't work on
  // osx so we'll have to accomodate for that
  if( is.osx() ) {
    Menu.setApplicationMenu( DefaultMenuTemplate );
  }
}


async function getDataHandler( evt: IpcMainEvent, request: IpcRequest<any> ) {
  // bail if no response channel
  if( !request.responsechannel || !_playerid ) {
    return;
  }

  // get relevant data
  const offerdata = await TransferOffer.getPlayerOffers( _playerid );
  const profiledata = await Profile.getActiveProfile();
  const playerdata = await Player.findByPk( _playerid, {
    include: [{ all: true }]
  });

  // send the data back to the renderer
  evt.sender.send(
    request.responsechannel,
    JSON.stringify({ playerdata, profiledata, offerdata })
  );
}


function sendOfferHandler( evt: IpcMainEvent, request: IpcRequest<OfferRequest> ) {
  const { responsechannel, params } = request;
  const sendresponse = () => evt.sender.send( responsechannel || '', null );

  // bail if no params found
  if( !params ) {
    sendresponse();
    return;
  }

  // let world gen handle the offer
  WorldGen
    .Offer
    .parse( params )
    .then( () => sendresponse() )
  ;
}


async function reviewOfferHandler( evt: IpcMainEvent, request: IpcRequest<OfferReview> ) {
  const { responsechannel, params } = request;
  const sendresponse = () => evt.sender.send( responsechannel || '', null );

  // bail if no params found
  if( !params ) {
    sendresponse();
    return;
  }

  // update the offer
  const offerdata = await TransferOffer.findByPk( params.offerid, { include: [{ all: true }]} );
  offerdata.status = params.status;
  await offerdata.save();

  // if rejected, bail now
  if( offerdata.status === OfferStatus.REJECTED ) {
    return sendresponse();
  }

  // otherwise, let the player decide now
  WorldGen
    .Offer
    .parse({
      teamdata: offerdata.Team,
      playerid: offerdata.Player.id,
      fee: offerdata.fee,
      wages: offerdata.wages,
    })
    .then( () => sendresponse() )
  ;
}


function closeWindowHandler() {
  _screen.handle.close();
}


export default () => {
  // ipc listeners
  ipcMain.on( IPCRouting.Offer.CLOSE, closeWindowHandler );
  ipcMain.on( IPCRouting.Offer.GET_DATA, getDataHandler );
  ipcMain.on( IPCRouting.Offer.OPEN, openWindowHandler );
  ipcMain.on( IPCRouting.Offer.SEND, sendOfferHandler );
  ipcMain.on( IPCRouting.Offer.REVIEW, reviewOfferHandler );
};
