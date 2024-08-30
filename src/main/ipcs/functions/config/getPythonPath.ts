import { ipcMain } from 'electron';
import Channels from '../../channels';
import storage from 'electron-json-storage';
import { promisify } from 'util';

ipcMain.handle(Channels.getPythonPath, async (event) => {
  const config: any = await promisify(storage.get)('config');
  return config?.pythonPath || 'python';
});
