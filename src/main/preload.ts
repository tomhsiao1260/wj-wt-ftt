// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { app, contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import storage from 'electron-json-storage';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: any, ...args: any[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: any, func: (...args: any[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: any, func: (...args: any[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    invoke(channel: any, ...args: any[]) {
      return ipcRenderer.invoke(channel, ...args);
    },
  },

  selectFilePath: () => ipcRenderer.invoke('selectFilePath'),
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
