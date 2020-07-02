const WebSocket = require("ws");

const debug = false;

/********** OBS WEBSOCKET **********/

var hostname = "ws://localhost:4444";

if(debug) console.log("Starting WebSocket connection at " + hostname);

var Socket = null;

function ws_onOpen() {
  if(debug) console.log("Connected to OBS Websocket");
  ws_ping();
}

var pongReceived = false;

function ws_ping() {
  if(debug) console.log("PING sent");
  Socket.ping();
}

function ws_onPong() {
  if(debug) console.log("PONG received");
  pongReceived = true;
}

function ws_onMessage(event) {
  if(debug) console.log("Message received:" + event);
  // ws_message = JSON.parse(event);
}

var keepAlive = null;

function ws_keepAlive() {
  if(pongReceived == true) {
    // Connection is good
    // Reset the flag and ping again to keep alive
    pongReceived = false;
    ws_ping();
  } else {
    // Close the websocket and start a new one
    // We will ping again on open
    if(debug) console.log("No PONG received. Closing websocket and restarting");
    clearInterval(keepAlive);
    keepAlive = null;
    Socket.close();
  }
}

function ws_beginWebSocket() {
  if (Socket != null) {
    Socket.close();
  }
  Socket = new WebSocket(hostname);
  Socket.on("open", ws_onOpen);
  Socket.on("pong", ws_onPong);
  Socket.on("close", ws_beginWebSocket);
  Socket.on("message", ws_onMessage);
  
  if(keepAlive == null) {
    keepAlive = setInterval(ws_keepAlive, 10 * 1000);
  }
}

ws_beginWebSocket();


/************* OBS CONTROL FUNCTIONS ***************/

function nonce_gen(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

var staticTimeout = null;

function turnOnStatic() {
  if (staticTimeout == null) {
    
    // We don't currently have static playing, so start it
    request = {
      "request-type": "SetSceneItemProperties",
      "message-id": nonce_gen(8),
      "scene-name": "Websocket Overlays",
      "item": "Static",
      "visible": true
    }
    Socket.send(JSON.stringify(request));
    
    staticTimeout = setTimeout(turnOffStatic, 2000);
  } else {
    // We already have a timeout. Cancel that one, and set
    // a new one to extend the static
    clearTimeout(staticTimeout);
    staticTimeout = setTimeout(turnOffStatic, 2000);
  }
}

function turnOffStatic() {
  request = {
    "request-type": "SetSceneItemProperties",
    "message-id": nonce_gen(8),
    "scene-name": "Websocket Overlays",
    "item": "Static",
    "visible": false
  }
  Socket.send(JSON.stringify(request));
  staticTimeout = null;
}

// Interacting with the parent

// This is how we talk to chat
function say (message) {
  var response = {
      type: "chat_message",
      data: message
  };
  process.send(response);
};

process.on('message', (message) => {
  console.log("Received message: " + message);
  if (message.toUpperCase() == "STATIC") {
    turnOnStatic();
  }
});