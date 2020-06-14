import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import { SyncOutlined, CheckOutlined } from '@ant-design/icons';
import * as IPCRouting from 'shared/ipc-routing';


interface State {
  status: string;
  downloading: boolean;
}


class Splash extends Component<{}, State> {
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
    ipcRenderer.on( IPCRouting.Splash.ERROR, this.handleError );
    ipcRenderer.on( IPCRouting.Splash.CHECKING, this.handleCheckingUpdate );
    ipcRenderer.on( IPCRouting.Splash.NO_UPDATE_AVAIL, this.handleNoUpdateAvail );
    ipcRenderer.on( IPCRouting.Splash.UPDATE_AVAIL, this.handleUpdateAvail );
    ipcRenderer.on( IPCRouting.Splash.DOWNLOADING, this.handleDownloadProgress );
    ipcRenderer.on( IPCRouting.Splash.DOWNLOADED, this.handleUpdateDownloaded );
  }

  handleError = () => {
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
  handleDownloadProgress = () => {
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
            <SyncOutlined spin />
          )}
          {this.state.status === this.statuses.DONE && (
            <CheckOutlined />
          )}
        </div>
      </section>
    );
  }
}


export default Splash;
