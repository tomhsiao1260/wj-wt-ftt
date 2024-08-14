import { ipcMain } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import Channels from '../channels';

ipcMain.handle(Channels.runPythonCode, async (event, arg) => {
  const python = 'python'; // the path of python
  const pythonScript = spawn(python, [
    path.join(__dirname, "../../../../'test.py"),
    arg,
  ]);
  pythonScript.on('exit', () => {
    console.log('finish or error occur');
  });
  return null;
});
