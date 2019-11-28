---
title: "WebUSB"
date: 2019-11-28T10:18:29-05:00
---

### 1. Overview

CanoKey supports the [WebUSB](https://wicg.github.io/webusb/) protocol for easier management. You can use our open-source [console](http://) to manage your CanoKey. Or, you can develop your own console via WebUSB APIs.

#### 1.1 Driver

CanoKey is a [WinUSB device](https://docs.microsoft.com/en-us/windows-hardware/drivers/usbcon/automatic-installation-of-winusb), whose firmware defines certain Microsoft operating system (OS) feature descriptors that report the compatible ID as "WINUSB". Therefore, you do not need additional drivers when you use it on Windows. And of course, no drivers are required on Linux or macOS.

#### 1.2 Interface & Pipe

CanoKey uses the interface with index 1, and the transfer type is control transfer. The default EP size is 16 bytes.

### 2. Messages

Basically, the messages on the WebUSB interface are APDU commands. To transceive a pair of APDU commands, three phases are required:

1. Send a command APDU
2. Excute the command
3. Get the response APDU

Each type of message is a vendor-specific request, defined as:

| bRequest | Value |
|----------|-------|
| CMD      | 00h   |
| EXEC     | 01h   |
| RESP     | 02h   |

#### 2.1 Command APDU

The following control pipe request is used to send a command APDU.

| bmRequestType | bRequest | wValue      | wIndex | wLength        | Data  |
| ------------- | -------- | ----------- | ------ | -------------- | ----- |
| 01000001B     | CMD      | bType, bSeq | 1      | lenght of data | bytes |


The wValue field contains the sequence number (bSeq) in the low byte and the type (bType) in the high byte.
`bType` should be `40h` for the first chunk and `80h` for more chunk.
`bSeq` is a monotonically increasing by one counter starting from `00h`.

For example, if you want to send `000102030405060708090A0B0C0D0E0F101112`, you need to send them in two requests:

1. The wValue of the first request should be `4000h`, and the data should be `000102030405060708090A0B0C0D0E0F`.
2. The wValue of the second request should be `8001h`, and the data should be `101112`.

#### 2.2 Excute the command

The following control pipe request is used to execute the command APDU.

| bmRequestType | bRequest | wValue | wIndex | wLength | Data |
| ------------- | -------- | ------ | ------ | ------- | ---- |
| 11000001B     | EXEC     | 0000h  | 1      | 0       | N/A  |

#### 2.3 Get the response APDU

The following control pipe request is used to get the response APDU.

| bmRequestType | bRequest | wValue | wIndex | wLength | Data |
| ------------- | -------- | ------ | ------ | ------- | ---- |
| 11000001B     | RESP     | 0000h  | 1      | 0       | N/A  |

The device will send the response no more than 1500 bytes.

### 3. Demo Code

```js
function byteToHexString(uint8arr) {
    if (!uint8arr) return '';
    var hexStr = '';
    for (var i = 0; i < uint8arr.length; i++) {
        var hex = (uint8arr[i] & 0xff).toString(16);
        hex = (hex.length === 1) ? '0' + hex : hex;
        hexStr += hex;
    }
    return hexStr.toUpperCase();
}

function hexStringToByte(str) {
    if (!str) return new Uint8Array();
    var a = [];
    for (var i = 0, len = str.length; i < len; i += 2)
        a.push(parseInt(str.substr(i, 2), 16));
    return new Uint8Array(a);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function reshape(data) {
    const packets = [];
    for (let i = 0; i < data.length; i += 16)
        packets.push(data.slice(i, i + 16));
    return packets;
}

async function tranceive(device, capdu) {
    let data = hexStringToByte(capdu);
    let reshapedData = reshape(data);   // divide command into 16-byte chunks
    // send a command
    for (let i = 0; i < reshapedData.length; ++i)
        await device.controlTransferOut({
            requestType: 'vendor',
            recipient: 'interface',
            request: 0,
            value: (i == 0 ? 0x4000 : 0x8000) + i,
            index: 1
        }, reshapedData[i]);
    // execute
    let resp = await device.controlTransferIn({
        requestType: 'vendor',
        recipient: 'interface',
        request: 1,
        value: 0,
        index: 1
    }, 0);
    // get the response
    while (1) {
        resp = await device.controlTransferIn({
            requestType: 'vendor',
            recipient: 'interface',
            request: 2,
            value: 0,
            index: 1
        }, 1500);
        if (resp.data.byteLength > 0) break;
        await sleep(100);
    }
    if (resp.status === "ok")
        return byteToHexString(new Uint8Array(resp.data.buffer));
    return '';
}
```

If you have CanoKey, you can try it now.

#### 3.1 Connect

Click the following button to connect a CanoKey.

<button id="connect" class="btn btn-default">Connect</button>
<span id="device-info"></span>

<script>
let button = document.getElementById('connect');
let info = document.getElementById('device-info');
button.addEventListener('click', async () => {
  let device;
  try {
    device = await navigator.usb.requestDevice({ filters: [{
        classCode: 0xFF, // vendor-specific
    }]});
  } catch (err) {
      info.innerText = 'No device selected';
  }

  if (device !== undefined) {
      info.innerText = 'A CanoKey is selected';
  }
});
</script>

{{%expand "Show me the code"%}}
```js
let button = document.getElementById('connect');
let info = document.getElementById('device-info');
button.addEventListener('click', async () => {
  let device;
  try {
    device = await navigator.usb.requestDevice({ filters: [{
        classCode: 0xFF, // vendor-specific
    }]});
  } catch (err) {
      info.innerText = 'No device selected';
  }

  if (device !== undefined) {
      info.innerText = 'A CanoKey is selected';
  }
});
```
{{% /expand%}}
