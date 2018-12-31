// @flow
import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import { Icon } from 'antd';

import './app.scss';


type State = {
  status: string,
  downloading: boolean
};

class App extends Component<{}, State> {
  statuses = {
    CHECKING: 'Checking for updates...',
    ERROR: 'Error checking for update. See logs for more information.',
    UPTODATE: 'Up to date.',
    DOWNLOADING: 'Downloading update...',
    DONE: 'Done.'
  }

  state = {
    status: this.statuses.CHECKING,
    downloading: false
  }

  componentDidMount() {
    ipcRenderer.on( '/windows/splash/error', this.handleError );
    ipcRenderer.on( '/windows/splash/checking-update', this.handleCheckingUpdate );
    ipcRenderer.on( '/windows/splash/no-update-avail', this.handleNoUpdateAvail );
    ipcRenderer.on( '/windows/splash/update-avail', this.handleUpdateAvail );
    ipcRenderer.on( '/windows/splash/download-progress', this.handleDownloadProgress );
    ipcRenderer.on( '/windows/splash/update-downloaded', this.handleUpdateDownloaded );
  }

  handleError = ( err: Error ) => {
    this.setState({
      status: this.statuses.ERROR
    });
  }

  handleCheckingUpdate = () => {
    // @TODO
  }

  handleNoUpdateAvail = () => {
    this.setState({
      status: this.statuses.UPTODATE
    });
  }

  handleUpdateAvail = () => {
    this.setState({
      status: this.statuses.DOWNLOADING,
      downloading: true
    });
  }

  /**
   * NOTE: There is an active issue with auto-updater that does not
   * emit the download progress while doing differential updates.
   *
   * See: https://github.com/electron-userland/electron-builder/issues/3106
   * See: https://github.com/electron-userland/electron-builder/issues/2521
   */
  handleDownloadProgress = ( evt: Event, progressObj: Object ) => {
    // @TODO
  }

  handleUpdateDownloaded = () => {
    this.setState({
      status: this.statuses.DONE,
      downloading: false
    });
  }

  render() {
    return (
      <section id="splash">
        <p>{this.state.status}</p>
        <div className="progress-container">
          {this.state.downloading && (
            <Icon spin type="sync" />
          )}
          {this.state.status === this.statuses.DONE && (
            <Icon type="check" />
          )}
        </div>
      </section>
    );
  }
}

export default App;