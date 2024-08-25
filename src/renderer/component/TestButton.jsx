import React from 'react';
import {
  fetchPythonAPIJSON,
  fetchPythonAPIText,
} from '../../utils/fetchPythonAPI';

export default function TestButton() {
  const handleClick = async () => {
    const result = await fetchPythonAPIText('/handle_nrrd');
    alert(result);
  };

  return (
    <button
      onClick={handleClick}
      className="fixed left-0 top-0 bg-white rounded-md p-2"
    >
      test button
    </button>
  );
}
