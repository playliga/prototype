/**
 * QoL module to help with browser window management.
 *
 * @module
 */
import is from 'electron-is';
import { BrowserWindow, Menu, screen } from 'electron';
import { Constants } from '@liga/shared';

/**
 * Menu Item identifier enum.
 *
 * @enum
 */
export enum MenuItemIdentier {
  APPNAME = 0,
  FILE = 1,
  EDIT = 2,
  VIEW = 3,
  WINDOW = 4,
  HELP = 5,
}

/**
 * @interface
 */
interface WindowConfig {
  id: string;
  url: string;
  options: Electron.BrowserWindowConstructorOptions;
  parentId?: string;
  buildMenu?: () => Electron.Menu;
}

/**
 * BrowserWindow base configuration.
 *
 * @constant
 */
const baseWindowConfig: Electron.BrowserWindowConstructorOptions = {
  backgroundColor: 'black',
  webPreferences: {
    preload: is.main() && MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
  },
};

/**
 * BrowserWindow shared configurations.
 *
 * @constant
 */
const sharedWindowConfigs: Record<string, Electron.BrowserWindowConstructorOptions> = {
  frameless: {
    ...baseWindowConfig,
    frame: false,
    maximizable: false,
    resizable: false,
    movable: false,
    minimizable: false,
  },
};

/**
 * Contains a collection of the BrowserWindow instances created.
 *
 * Each instance is stored by a unique name
 * so it can later be retrieved on by name.
 *
 * @constant
 */
const windows: Record<string, Electron.BrowserWindow> = {};

/**
 * Holds application window configs.
 *
 * @constant
 */
export const WINDOW_CONFIGS: Record<string, WindowConfig> = {
  [Constants.WindowIdentifier.Landing]: {
    id: Constants.WindowIdentifier.Landing,
    url: is.main() && LANDING_WINDOW_WEBPACK_ENTRY,
    options: {
      ...baseWindowConfig,
    },
  },
  [Constants.WindowIdentifier.Main]: {
    id: Constants.WindowIdentifier.Main,
    url: is.main() && MAIN_WINDOW_WEBPACK_ENTRY,
    options: {
      ...baseWindowConfig,
    },
    buildMenu: () =>
      Menu.buildFromTemplate([
        ...((is.osx() ? [{ role: 'appMenu' }] : []) as Array<Electron.MenuItem>),
        {
          label: 'File',
          submenu: [
            {
              label: 'Threading',
              click: () => {
                get(Constants.WindowIdentifier.Threading);
              },
            },
            {
              label: 'Settings',
              click: () => {
                // open up the modal and once it's ready
                // we send the route we want to load
                const win = get(Constants.WindowIdentifier.Modal);
                const data: ModalRequest = { target: '/settings' };
                win.once('ready-to-show', () =>
                  win.webContents.send(Constants.IPCRoute.WINDOW_SEND, data),
                );
              },
            },
            { type: 'separator' },
            {
              label: 'Save and Exit to Main Menu',
              click: () => {
                get(Constants.WindowIdentifier.Landing);
                get(Constants.WindowIdentifier.Main).close();
              },
            },
            { role: 'quit' },
          ],
        },
        ...((is.dev() ? [{ role: 'viewMenu' }] : []) as Array<Electron.MenuItem>),
      ]),
  },
  [Constants.WindowIdentifier.Modal]: {
    id: Constants.WindowIdentifier.Modal,
    url: is.main() && MODAL_WINDOW_WEBPACK_ENTRY,
    parentId: Constants.WindowIdentifier.Main,
    options: {
      ...sharedWindowConfigs.frameless,
      frame: true,
      height: 600,
      width: 800,
    },
    buildMenu: () =>
      Menu.buildFromTemplate([
        ...((is.osx() ? [{ role: 'appMenu' }] : []) as Array<Electron.MenuItem>),
        {
          label: 'File',
          submenu: [
            // for some reason `role: 'close'` does not work on mac modals
            // so we explicitly call the `.close()` method below
            is.osx()
              ? {
                  label: 'Close Window',
                  click: () => get(Constants.WindowIdentifier.Modal).close(),
                }
              : { role: 'close' },
          ],
        },
        ...((is.dev() ? [{ role: 'viewMenu' }] : []) as Array<Electron.MenuItem>),
      ]),
  },
  [Constants.WindowIdentifier.Splash]: {
    id: Constants.WindowIdentifier.Splash,
    url: is.main() && SPLASH_WINDOW_WEBPACK_ENTRY,
    options: {
      ...sharedWindowConfigs.frameless,
      height: 400,
      width: 300,
    },
  },
  [Constants.WindowIdentifier.Threading]: {
    id: Constants.WindowIdentifier.Threading,
    url: is.main() && THREADING_WINDOW_WEBPACK_ENTRY,
    options: {
      height: 384,
      width: 512,
      x: 0,
      y: 0,
      webPreferences: {
        contextIsolation: false,
        nodeIntegration: true,
        nodeIntegrationInWorker: true,
      },
    },
  },
};

/**
 * Creates the BrowserWindow. Re-uses existing
 * window if it has already been created.
 *
 * @param id The unique identifier for the window.
 * @function
 */
export function create(id: string) {
  // if the provided screen id already exists with
  // an active handle then return that instead
  if (windows[id]) {
    return windows[id];
  }

  // load window details
  const { url, options, parentId, buildMenu } = WINDOW_CONFIGS[id];

  // determine screen size if none was provided
  if (!options.width && !options.height) {
    const display = screen.getPrimaryDisplay();
    options.width = Math.floor(display.workArea.width * 0.85);
    options.height = Math.floor(display.workArea.height * 0.85);
  }

  // create the browser window
  const window: BrowserWindow = new BrowserWindow({
    ...options,
    // have to set these in tandum otherwise the
    // parent window does not get disabled
    parent: parentId && get(parentId),
    modal: !!parentId,
  });
  window.loadURL(url);
  window.setMenu((!!buildMenu && buildMenu()) || null);

  // on osx all windows share the same menu so
  // it must be set during the 'focus' event
  if (is.osx()) {
    window.on('focus', () => Menu.setApplicationMenu((!!buildMenu && buildMenu()) || null));
  }

  // de-reference the window object when its closed
  window.on('closed', () => delete windows[id]);

  // add to the collection of window objects
  windows[id] = window;
  return window;
}

/**
 * Gets a window by specified id.
 *
 * @param id        The id of the window.
 * @param doCreate  Create the window if it does not already exist.
 * @function
 */
export function get(id: string, doCreate = true) {
  if (id in windows) {
    return windows[id];
  }

  if (!doCreate) {
    return null;
  }

  // create the window using its found config
  return create(id);
}

/**
 * Sends an IPC message to all instantiated windows.
 *
 * @param channel The IPC channel.
 * @function
 */
export function sendAll(channel: string) {
  Object.keys(windows)
    .map((id) => windows[id])
    .forEach((window) => window.webContents.send(channel));
}
