export async function fetchPythonAPIText(endPoint) {
  const res = await fetch('127.0.0.1:8734' + endPoint);
  const text = await res.text();
  return text;
}

export async function fetchPythonAPIJSON(endPoint) {
  const res = await fetch('127.0.0.1:8734' + endPoint);
  const json = await res.json();
  return json;
}

export async function fetchPythonAPIBuffer(endPoint) {
  const res = await fetch('127.0.0.1:8734' + endPoint);
  const buffer = await res.arrayBuffer();
  return buffer;
}
