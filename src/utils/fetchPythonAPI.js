export async function fetchPythonAPIText(endPoint, arg) {
  const res = await fetch('http://127.0.0.1:8734' + endPoint, {
    method: 'post',
    body: arg,
  });
  return res;
}

export async function fetchPythonAPIJSON(endPoint,arg) {
  const res = await fetch('http://127.0.0.1:8734' + endPoint, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: arg,
  });
  return res;
}

export async function fetchPythonAPIBuffer(endPoint, arg) {

  const res = await fetch('http://127.0.0.1:8734' + endPoint, {
    method: 'post',
    headers: {
      'Content-Type': 'application/octet-stream',
    },
    body: arg,
  });
  return res;
}
