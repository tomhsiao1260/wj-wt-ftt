import { spawn } from 'child_process';
import path from 'path';
import storage from 'electron-json-storage';

const python = storage.getSync('config').pythonPath || 'python';
// const serverScript = path.join(__dirname, './index.py');
// const server = spawn(python, [serverScript]);

// server.stdout.on('data', (data) => {
//   console.log(data.toString());
// });
// server.stderr.on('data', (data) => {
//   console.log(data.toString());
// });
