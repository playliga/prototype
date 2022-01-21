import path from 'path';
import is from 'electron-is';
import ScreenManager from 'main/lib/screen-manager';
import Worldgen from 'main/lib/worldgen';
import DefaultMenuTemplate from 'main/lib/default-menu';
import EmailDialogue from 'main/constants/emaildialogue';
import * as IPCRouting from 'shared/ipc-routing';
import { ipcMain, Menu, IpcMainEvent } from 'electron';
import { IpcRequest, OfferRequest, OfferReview } from 'shared/types';
import { TransferOffer, Profile } from 'main/database/models';
import { Player } from 'main/database/models';
import { Screen } from 'main/lib/screen-manager/types';
import { OfferStatus } from 'shared/enums';
import { AppLogo } from 'main/lib/cached-image';


/**
 * Module level variables, constants, and types
 */

// variables
let _screen: Screen;
let _playerid: number;
const applogo = new AppLogo();


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
    minimizable: false,
    icon: applogo.getPath(),
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
  Worldgen
    .Offer
    .parse( params )
    .then( () => sendresponse() )
  ;
}


async function reviewOfferHandler( evt: IpcMainEvent, request: IpcRequest<OfferReview> ) {
  const { responsechannel, params } = request;

  // update the main screen with the new profile data before
  // returning the response to the calling screen
  const sendresponse = async () => {
    ScreenManager
      .getScreenById( IPCRouting.Main._ID )
      .handle
      .webContents
      .send( IPCRouting.Database.PROFILE_GET, JSON.stringify( await Profile.getActiveProfile() ) )
    ;
    evt.sender.send( responsechannel || '', null );
    return Promise.resolve();
  };

  // bail if no params found
  if( !params ) {
    await sendresponse();
    return;
  }

  // grab offer data
  const offerdata = await TransferOffer.findByPk( params.offerid, { include: [{ all: true }]} );
  offerdata.status = params.status;

  // is there a price adjustment?
  if( params.fee && params.fee !== offerdata.fee ) {
    offerdata.status = OfferStatus.PENDING;
    offerdata.msg = EmailDialogue.USER_PENDING_REASON_FEE_ADJUSTMENT;
  }

  // update the offer
  await offerdata.save();

  // if rejected, bail now
  if( offerdata.status === OfferStatus.REJECTED ) {
    await sendresponse();
    return;
  }

  // otherwise, pass it on for worldgen to parse
  Worldgen
    .Offer
    .parse({
      teamdata: offerdata.Team,
      playerid: offerdata.Player.id,
      fee: params.fee || offerdata.fee,
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
