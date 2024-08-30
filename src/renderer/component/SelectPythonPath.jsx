import React, { useState, useEffect, useContext } from 'react';
import { DataContext } from '../provider/DataProvider';
import Channels from '../../main/ipcs/channels';

export default function SelectPythonPath() {
  const [pythonPath, setPythonPath] = useState('');

  useEffect(() => {
    window.electron.ipcRenderer.invoke(Channels.getPythonPath).then((path) => {
      setPythonPath(path);
    });
  }, []);

  async function handleFileBtnOnClick() {
    const selectedPath = await window.electron.selectFilePath();
    window.electron.ipcRenderer
      .invoke(Channels.setPythonPath, selectedPath)
      .then(() => {
        setTimeout(() => {
          window.electron.ipcRenderer.invoke('relaunch');
        }, 1000);
      });
  }

  return (
    <button
      className="fixed top-0 left-0 ml-4 mt-4 bg-white hover:bg-gray-100 text-gray-800 text-xs font-semibold py-2 px-4 border border-gray-400 rounded shadow"
      onClick={handleFileBtnOnClick}
    >
      {pythonPath ? pythonPath : ' Select Python PATH'}
    </button>
  );
}
