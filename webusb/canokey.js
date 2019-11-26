/*
  Work based on https://github.com/SantiagoTorres/yubikey-webusb
*/
var webusb = {};

function str2ab(str) {
    var buf = new Array(64); 
    for (var i=0, strLen=str.length; i<strLen; i++) {
          buf[i] = str.charCodeAt(i) & 0xFF;
        }
    for (var i = str.length; i < 64; i++) {
        buf[i] = 0;
    }
    return buf;
}



(function() {
  'use strict';
  webusb.devices = {};

  const WEBUSB_CONFIGURE_VALUE = 1;
  const WEBUSB_INTERFACE_INDEX = 1;

  const WEBUSB_REQ_CMD = 0x00;
  const WEBUSB_REQ_CALC = 0x01;
  const WEBUSB_REQ_RESP = 0x02;

  const WEBUSB_REQ_FIRST_PACKET = 0x4000;
  const WEBUSB_REQ_MORE_PACKET = 0x8000;

  function findOrCreateDevice(rawDevice) {
    let device = webusb.getDevice(rawDevice);
    if (device === undefined)
      device = new webusb.Device(rawDevice);
    return device;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function chunk_buffer(data) {
    var data_chunks = [];
    var i, j, chunk = 8;
    for (i = 0, j = data.length; i < j; i += chunk) {
      data_chunks.push(data.slice(i, i + chunk));
    }

    var result = []
    data_chunks.forEach((value, i) => {
      var arrayChunk = new Uint8Array(value.length);
      value.forEach((value, i) => {
        arrayChunk[i] = value;
      })
      result.push(arrayChunk);
    });

    return result;
  }

  function concat_buffer (buffer1, buffer2) {
    var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp.buffer;
  };

  webusb.getDevices = function() {
    return navigator.usb.getDevices().then(devices => {
      return devices.map(device => findOrCreateDevice(device));
    });
  };

  webusb.requestDevice = function() {
    var filters = [
      { vendorId: 0x0483, productId: 0x0007 },
      { vendorId: 0x16D0, productId: 0x0E80 },
    ];
    return navigator.usb.requestDevice({filters: filters}).then(device => {
      return findOrCreateDevice(device);
    });
  };

  webusb.Device = function(device) {
    this.device_ = device;
    webusb.devices[device.serialNumber] = this;
  };

  webusb.deleteDevice = function(device) {
    delete webusb.devices[device.device_.serialNumber];
  };

  webusb.getDevice = function(device) {
    return webusb.devices[device.serialNumber];
  };

  webusb.Device.prototype.connect = function() {
    console.log("connecting", this.device_);
    return this.device_.open()
      .then(() => {
        console.log("current config", this.device_.configuration);
        if (this.device_.configuration === null) {
          return this.device_.selectConfiguration(WEBUSB_CONFIGURE_VALUE);
        }
      })
      .then(() => this.device_.claimInterface(WEBUSB_INTERFACE_INDEX));
  };

  webusb.Device.prototype.disconnect = function() {
    return this.device_.close();
  };

  webusb.Device.prototype.controlTransferOut = function(setup, data) {
    return this.device_.controlTransferOut(setup, data);
  };

  webusb.Device.prototype.controlTransferIn = function(setup, length) {
    return this.device_.controlTransferIn(setup, length);
  };

  webusb.Device.prototype.receiveData = function (dataBuffer) {
    return this.controlTransferIn(this._prepare_transfer_info(WEBUSB_REQ_RESP, 0), 64)
      .then((chunk) => {
        console.log('receiveData', chunk.data.byteLength);
        if(chunk.data.byteLength > 0) {
          return this.receiveData(concat_buffer(dataBuffer, chunk.data.buffer))
        } else {
          return dataBuffer;
        }
      });
  };

  webusb.Device.prototype.issueCommand = function(cmdAPDU, success) {
    var data_chunks = chunk_buffer(cmdAPDU);
    var n_chunks = data_chunks.length;

    data_chunks.reduce((acc, value, idx) => {
      return acc.then(() => {
        var seq = idx;
        if(idx == 0) seq |= WEBUSB_REQ_FIRST_PACKET;
        else seq |= WEBUSB_REQ_MORE_PACKET;
        // if(idx < n_chunks-1) seq |= WEBUSB_REQ_MORE_PACKET;
        console.log("controlTransferOut", seq.toString(16), value);
        return this.controlTransferOut(this._prepare_transfer_info(WEBUSB_REQ_CMD, seq), value);
      });
    }, this.connect())
      .then(() => this.controlTransferIn(this._prepare_transfer_info(WEBUSB_REQ_CALC, 0), 0))
      .then(() => sleep(100))
      .then(() => this.receiveData(new ArrayBuffer(0)))
      .then((result) => success(new DataView(result)))
      // .then(() => this.disconnect());
  };
/*
  webusb.Device.prototype.challengeResponse = function (token) {

    var challenge_buffer = [0x00,0xa2,0x00,0x01,8+token.length,0x7c,token.length].concat(token).concat([0x74,0x04,0x00,0x02,0x02,0x02,0x00]);
    
    this.issueCommand(challenge_buffer, (hash)=>{
        console.log(hash);
        if(hash.byteLength < 4 || hash.getUint8(0) != 0x76 || hash.getUint16(hash.byteLength-2) != 0x9000) {
          console.log("Invalid result");
          return;
        }
        var digits = hash.getUint8(2);
        var number = hash.getUint32(3);
        document.getElementById("response-field").innerHTML = number % 1000000;
    });
  }

  webusb.Device.prototype.encryptToken = function (challenge) {
    console.log(challenge);
    var encrypt_buffer = [0x00,0x05,0x00,0x00,challenge.length+6,0x73,challenge.length+2,0x21,0x06].concat(challenge).concat([0x78,0x00,0x00]);
    this.issueCommand(encrypt_buffer, (token)=>{
        if(token.byteLength < 2 || token.getUint16(token.byteLength-2) != 0x9000) {
          console.log("Invalid result");
          return;
        }
        var arr = [];
        for(var i=0; i<token.byteLength-2; i++)
          arr.push(token.getUint8(i));
        console.log(arr);
        window.DbgEncToken = arr;
    });
  }
*/
  webusb.Device.prototype._prepare_transfer_info = function(bRequest, wValue) {
    return {
      recipient: "interface",
      requestType: "class",
      request: bRequest,
      value: wValue,
      index: WEBUSB_INTERFACE_INDEX,
    }
  };

})();

/*
function challengeResponse(device) {
  device.challengeResponse(window.DbgEncToken);
}

function encryptToken(device) {
  var b32 = document.getElementById('challenge-field').value;
  var arr = [];
  var hex = b32.split(/ +/);
  for (let i = 0; i < hex.length; i++) {
    arr.push(parseInt(hex[i],16));
  }
  device.encryptToken(arr);
}
*/

function executeAPDUs(device) {
  let respTextarea = document.getElementById('response-field');
  let lines = document.getElementById('input-apdus').value.split('\n');
  respTextarea.value = '';
  lines.reduce((acc, value, idx) => {
    return acc.then(()=>{
      return new Promise((resolve) => {
        let hexLine = value.replace(/\s/g, '');
        if (hexLine.length == 0 || hexLine.length % 2 != 0) {
          console.log("skip line:", hexLine);
          resolve(null);
          return;
        }
        let apduBytes = [];
        for (let i = 0; i < hexLine.length; i += 2) {
          apduBytes.push(parseInt(hexLine.substring(i, i + 2), 16));
        }
        device.issueCommand(apduBytes, (respBytes) => {
          let newValue = respTextarea.value +
            Array.from(new Uint8Array(respBytes.buffer))
              .map(b => b.toString(16).padStart(2, "0"))
              .join("") + '\n';
          respTextarea.value = newValue;
          resolve(null);
        });
      });
    });
  }, Promise.resolve(null));
}

function connectDevice(device) {
  function setElementDeviceInfo(e, text) {
    e.getElementsByClassName("lightTitle")[0].innerText = text;
  }

  console.log('connectDevice', device);
  var e = document.getElementById("lightCardTemplate");
  // e.style.display = "block";
  device.element = e;
  var s = device.device_.productName + "\n" +
    device.device_.serialNumber;
  setElementDeviceInfo(device.element, s);

  // var sendButton = document.getElementById("send-challenge");
  // sendButton.addEventListener('click', challengeResponse.bind(this, device));
  // var encryptButton = document.getElementById("send-encrypt");
  // encryptButton.addEventListener('click', encryptToken.bind(this, device));

  var execAPDUButton = document.getElementById("exec-apdus");
  execAPDUButton.addEventListener('click', executeAPDUs.bind(this, device));

}

function handleConnectEvent(event) {
  var rawDevice = event.device;
  console.log('connect event', rawDevice);
  var device = new webusb.Device(rawDevice);
  connectDevice(device);
}

function cleanUpDevice(device) {
  webusb.deleteDevice(device);
}

function disconnectDevice(rawDevice) {
  var device = webusb.getDevice(rawDevice);
  if (device) {  // This can fail if the I/O code already threw an exception
    console.log("removing!");
    device.disconnect()
      .then(s => {
        console.log("disconnected", device);
        cleanUpDevice(device);
      }, e => {
        console.log("nothing to disconnect", device);
        cleanUpDevice(device);
      });
  }
}

function handleDisconnectEvent(event) {
  console.log('disconnect event', event.device);
  disconnectDevice(event.device);
}


function requestConnection(event) {
  webusb.requestDevice().then(device => {
    connectDevice(device);
  });
  event.preventDefault();
}

function start() {
  // navigator.usb.addEventListener('connect', handleConnectEvent);
  navigator.usb.addEventListener('disconnect', handleDisconnectEvent);

  var lightsConnect = document.getElementById("lightConnect");
  lightsConnect.addEventListener("click", requestConnection);

  webusb.getDevices().then(ports => {
    if (ports.length == 0) {
      console.log('No authorized devices.');
    } else {
      connectDevice(ports[0]);
    }
  });
}

document.addEventListener('DOMContentLoaded', start, false);

