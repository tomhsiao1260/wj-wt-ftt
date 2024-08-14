import os from 'os';
import { ipcMain } from 'electron';
import Channels from '../channels';

ipcMain.handle(Channels.getSystemDetail, async () => {
  return os.platform();
});
