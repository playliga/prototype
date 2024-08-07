/**
 * Preload scripts contain code that executes in a renderer process before its
 * web content begins loading. These scripts run within the renderer context,
 * but are granted more privileges by having access to Node.js APIs.
 *
 * @see https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
 * @module
 */
import api from './api';
import { contextBridge } from 'electron';
contextBridge.exposeInMainWorld('api', api);
