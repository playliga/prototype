import { app, Menu } from 'electron';
import is from 'electron-is';


// enum items get offset by one on osx because
// that first item is reserved for the application name
// see: https://electronjs.org/docs/api/menu#main-menus-name
export const MenuItems = {
  APPNAME: 0,
  FILE: is.osx() ? 1 : 0,
  EDIT: is.osx() ? 2 : 1,
  VIEW: is.osx() ? 3 : 2,
  WINDOW: is.osx() ? 4 : 3,
  HELP: is.osx() ? 4 : 3
};

export const RawDefaultMenuTemplate = [
  {
    label: 'File',
    submenu: [
      { role: 'quit' }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'pasteandmatchstyle' },
      { role: 'delete' },
      { role: 'selectall' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forcereload' },
      { role: 'toggledevtools' },
      { type: 'separator' },
      { role: 'resetzoom' },
      { role: 'zoomin' },
      { role: 'zoomout' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    role: 'window',
    submenu: [
      { role: 'minimize' },
      { role: 'close' }
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click() {
          require( 'electron' ).shell.openExternal( 'https://electronjs.org' );
        }
      }
    ]
  }
];

if( is.osx() ) {
  RawDefaultMenuTemplate.unshift({
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      // @ts-ignore
      { role: 'services', submenu: []},
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  });

  RawDefaultMenuTemplate[ MenuItems.WINDOW ].submenu = [
    { role: 'close' },
    { role: 'minimize' },
    { role: 'zoom' },
    { type: 'separator' },
    { role: 'front' }
  ];
}

// @ts-ignore
const DefaultMenuTemplate = Menu.buildFromTemplate( RawDefaultMenuTemplate );
export default DefaultMenuTemplate;
