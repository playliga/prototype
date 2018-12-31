// @flow
import { app, Menu } from 'electron';
import is from 'electron-is';


// enum items get offset by one on osx because
// that first item is reserved for the application name
// see: https://electronjs.org/docs/api/menu#main-menus-name
export const MenuItems: Object = {
  APPNAME: 0,
  FILE: is.osx() ? 1 : 0,
  VIEW: is.osx() ? 2 : 1,
  WINDOW: is.osx() ? 3 : 2,
  HELP: is.osx() ? 4 : 3
};

export const RawDefaultMenuTemplate: Array<Object> = [
  {
    label: 'File',
    submenu: [
      { role: 'quit' }
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
    label: app.getName(),
    submenu: [
      { role: 'about' },
      { type: 'separator' },
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

const DefaultMenuTemplate = Menu.buildFromTemplate( RawDefaultMenuTemplate );
export default DefaultMenuTemplate;
