export function convertHexToBytes(text) {

  if (!text) return;
  const array = [];
  for (let i = 0; i < text.length; i += 2) {
    1;
    const tmpHex = text.substring(i, i + 2);
    array.push(parseInt(tmpHex, 16));
  }
  return array;
}

export function convertBytesToHex(byteArray) {
  let hex = "";
  const il = byteArray.length;
  for (let i = 0; i < il; i++) {
    if (byteArray[i] < 0) {
      byteArray[i] = byteArray[i] + 256;
    }
    let tmpHex = byteArray[i].toString(16);
    // add leading zero
    if (tmpHex.length === 1) {
      tmpHex = "0" + tmpHex;
    }
    hex += tmpHex;
  }
  return hex;
}
