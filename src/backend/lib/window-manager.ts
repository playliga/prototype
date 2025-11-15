/**
 * QoL module to help with browser window management.
 *
 * @module
 */
import path from 'node:path';
import AppInfo from 'package.json';
import { BrowserWindow, Menu, screen, shell } from 'electron';
import { Constants, Util, is } from '@liga/shared';

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
  icon: is.dev() && path.join(__dirname, '../../src/frontend/assets/icon.ico'),
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
    buildMenu: () => (is.dev() ? Menu.buildFromTemplate([{ role: 'viewMenu' }]) : null),
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
              label: 'Achievements',
              click: () => send(Constants.WindowIdentifier.Modal, { target: '/achievements' }),
            },
            {
              label: 'Settings',
              accelerator: is.osx() ? 'Cmd+,' : 'Ctrl+,',
              click: () => send(Constants.WindowIdentifier.Modal, { target: '/settings' }),
            },
            {
              label: 'Threading',
              click: () => {
                get(Constants.WindowIdentifier.Threading);
              },
            },
            { type: 'separator' },
            {
              label: 'Save and Exit to Main Menu',
              accelerator: is.osx() ? 'Cmd+s' : 'Ctrl+s',
              click: () => {
                get(Constants.WindowIdentifier.Landing);
                get(Constants.WindowIdentifier.Main).close();
              },
            },
            { role: 'quit' },
          ],
        },
        ...((is.dev()
          ? [{ role: 'viewMenu' }]
          : [
              {
                label: 'View',
                submenu: [
                  {
                    role: 'toggleFullScreen',
                  },
                ],
              },
            ]) as Array<Electron.MenuItem>),
        {
          label: 'Help',
          submenu: [
            {
              label: 'Report Issue',
              click: () => send(Constants.WindowIdentifier.Modal, { target: '/issues/create' }),
            },
            {
              label: 'My Reported Issues',
              click: () => send(Constants.WindowIdentifier.Modal, { target: '/issues/all' }),
            },
            {
              label: 'Search Feature Requests',
              click: async () => {
                const query = new URLSearchParams('is:open is:issue type:feature');
                await shell.openExternal(
                  `${AppInfo.repository.url.replace('.git', '')}/issues?q=${query.toString().replace('=', '')}`,
                );
              },
            },
            { type: 'separator' },
            {
              label: 'View the Changelog',
              click: () =>
                send(Constants.WindowIdentifier.Modal, { target: '/markdown/changelog' }),
            },
            {
              label: "What's New",
              click: () =>
                send(Constants.WindowIdentifier.Modal, { target: '/markdown/whats-new' }),
            },
            {
              label: 'Discord Server',
              click: async () => {
                await shell.openExternal('https://discord.gg/ZaEwHfDD5N');
              },
            },
            { type: 'separator' },
            { role: 'about' },
          ],
        },
      ]),
  },
  [Constants.WindowIdentifier.Modal]: {
    id: Constants.WindowIdentifier.Modal,
    url: is.main() && MODAL_WINDOW_WEBPACK_ENTRY,
    parentId: Constants.WindowIdentifier.Main,
    options: {
      ...sharedWindowConfigs.frameless,
      frame: true,
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

  // load parent window details
  let parentWindow: BrowserWindow;

  if (parentId) {
    // if the provided parent id is not created, try to
    // attach to whatever window is currently open
    if (!get(parentId, false)) {
      const [firstOpenWindow] = BrowserWindow.getAllWindows();
      parentWindow = firstOpenWindow;
    } else {
      parentWindow = get(parentId);
    }
  }

  // determine screen size if none was
  // provided and it is not a modal
  if (!parentWindow && !options.width && !options.height) {
    const display = screen.getPrimaryDisplay();
    options.width = Math.floor(display.workArea.width * 0.85);
    options.height = Math.floor(display.workArea.height * 0.85);
  }

  // if it's a modal, base its size off of the parent
  if (parentWindow && !options.width && !options.height) {
    const [width, height] = parentWindow.getSize();
    options.width = Math.floor(width * 0.5);
    options.height = Math.floor(height * 0.85);
  }

  // create the browser window
  const window: BrowserWindow = new BrowserWindow({
    ...options,
    // have to set these in tandum otherwise the
    // parent window does not get disabled
    parent: parentWindow,
    modal: !!parentWindow,
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
 * Disables the menu for the specified id.
 *
 * @param id The id of the window.
 * @function
 */
export function disableMenu(id: string) {
  const win = get(id, false);
  const config = WINDOW_CONFIGS[id].buildMenu();

  if (!win) {
    return;
  }

  for (const item of config.items) {
    item.enabled = false;
    if (item.submenu) {
      item.submenu.items.forEach((subMenu) => {
        subMenu.enabled = false;
      });
    }
  }

  win.setMenu(config);
}

/**
 * Enables the menu for the specified id.
 *
 * @param id The id of the window.
 * @function
 */
export function enableMenu(id: string) {
  const win = get(id, false);
  const config = WINDOW_CONFIGS[id].buildMenu();

  if (!win) {
    return;
  }

  for (const item of config.items) {
    item.enabled = true;
    if (item.submenu) {
      item.submenu.items.forEach((subMenu) => {
        subMenu.enabled = true;
      });
    }
  }

  win.setMenu(config);
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
 * Sends the content to the specified window.
 *
 * Waits a few seconds before sending the data to account
 * for a race condition where the event fires before
 * React can mount the root component.
 *
 * @param id    The id of the window.
 * @param data  The window data.
 * @param delay Time to wait before sending the data.
 * @function
 */
export function send(id: Constants.WindowIdentifier, data: unknown, delay = 500) {
  const win = get(id);

  // if there's a delay we wait for
  // the window's DOM to be ready
  if (delay > 0) {
    win.webContents.once('dom-ready', () =>
      Util.sleep(delay).then(() => win.webContents.send(Constants.IPCRoute.WINDOW_SEND, data)),
    );
  } else {
    win.webContents.send(Constants.IPCRoute.WINDOW_SEND, data);
  }
}

/**
 * Sends an IPC message to all instantiated windows.
 *
 * @param channel The IPC channel.
 * @param data    The data to send.
 * @function
 */
export function sendAll(channel: string, data?: unknown) {
  Object.keys(windows)
    .map((id) => windows[id])
    .forEach((window) => window.webContents.send(channel, data));
}
