// @flow
import { app } from 'electron';
import WindowManager from 'main/lib/window-manager';
import { SplashWindow, MainWindow } from 'main/window-handlers';


function handleOnReady() {
  SplashWindow();
  MainWindow();
}

function handleAllClosed() {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if( process.platform !== 'darwin' ) {
    app.quit();
  }
}

function handleOnActivate() {
  const windows = WindowManager.getWindows();

  if( Object.keys( windows ) === 0 ) {
    SplashWindow();
  }
}

export default () => {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on( 'ready', handleOnReady );

  // Quit when all windows are closed.
  app.on( 'window-all-closed', handleAllClosed );

  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on( 'activate', handleOnActivate );
};
