import { ipcMain } from 'electron';
import Channels from '../../channels';
import storage from 'electron-json-storage';

ipcMain.handle(Channels.setPythonPath, async (event, pythonPath: string) => {
  storage.set('config', { pythonPath }, () => {});
  return pythonPath;
});
