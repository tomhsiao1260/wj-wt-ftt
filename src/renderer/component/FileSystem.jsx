import React, { useState, useEffect, useContext } from 'react';
import { DataContext } from '../provider/DataProvider';

export default function FileSystem({ setMeta }) {
  const [btn, setBtn] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const { mask, sdf, volumeList } = useContext(DataContext);

  async function handleFileBtnOnClick() {
    const directoryHandle = await window.showDirectoryPicker();
    const files = await readDirectory(directoryHandle);

    const text = await parseText(files, 'meta.json');
    const meta = JSON.parse(text);

    setBtn(false);
    setMeta({ files, chunks: meta.chunks });
  }

  async function readDirectory(directoryHandle, path) {
    const files = {};

    for await (const item of directoryHandle.values()) {
      if (item.kind !== 'directory') {
        const file = await item.getFile();
        files[item.name] = file;
      }
    }
    return files;
  }

  useEffect(() => {
    if (mask.loaded && sdf.loaded && volumeList[0].loaded) setLoaded(true);
  }, [mask, sdf, volumeList]);

  return loaded ? null : btn ? (
    <div className="flex items-center justify-center h-screen">
      <button
        className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        onClick={handleFileBtnOnClick}
      >
        Select a Folder
      </button>
    </div>
  ) : (
    <div className="text-2xl text-white opacity-85 font-bold">Loading ...</div>
  );
}

export async function parseText(files, path) {
  const file = files[path];
  const text = await file.text();
  return text;
}

export async function parseBuffer(files, path) {
  const file = files[path];
  const arraybuffer = await file.arrayBuffer();
  // const blob = new Blob([arraybuffer], { type: file.name });
  return arraybuffer;
}
